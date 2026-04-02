"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAppContext } from "@/context/useAppContext";
import { getCompanyContext } from "@/app/(public)/utils/kyc-company-context";
import { PoweredBy } from "@/components/verify/PoweredBy";
import { VerifyMobileBackRow } from "@/components/verify/VerifyMobileBackRow";
import { SpinnerIcon } from "@/components/verify/SpinnerIcon";
type GeocodeSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
  };
};

/** Composes the four address fields into a single string sent to the backend as personalInfo.address */
function composeAddress(
  line1: string,
  line2: string,
  city: string,
  postalCode: string,
): string {
  const parts = [
    line1.trim(),
    line2.trim(),
    city.trim(),
    postalCode.trim(),
  ].filter(Boolean);
  return parts.join(", ");
}

export default function EnterAddressPage() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorAddress, setErrorAddress] = useState<string | null>(null);
  const [errorCity, setErrorCity] = useState<string | null>(null);
  const [errorPostalCode, setErrorPostalCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  /** Android: keep focused field above the soft keyboard (layout is fixed height + bottom bar). */
  const scrollFieldIntoView = useCallback((el: HTMLInputElement | null) => {
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) return;
    const run = () =>
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    requestAnimationFrame(run);
    window.setTimeout(run, 120);
    window.setTimeout(run, 320);
  }, []);

  const searchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const countryParam = state.selectedCountry
          ? `&country=${state.selectedCountry}`
          : "";
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(query)}${countryParam}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.error || !Array.isArray(data)) {
          setSuggestions([]);
          return;
        }
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    },
    [state.selectedCountry],
  );

  useEffect(() => {
    const ctx = getCompanyContext();
    const t = setTimeout(() => {
      if (addressLine1.trim().length >= 2) searchSuggestions(addressLine1);
      else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [addressLine1, searchSuggestions]);

  const handleSelectSuggestion = (s: GeocodeSuggestion) => {
    const addr = s.address;
    if (addr) {
      const street = [addr.house_number, addr.road]
        .filter(Boolean)
        .join(" ")
        .trim();
      setAddressLine1(street || s.display_name);
      if (addr.city) setCity(addr.city);
      else if (addr.town) setCity(addr.town);
      else if (addr.village) setCity(addr.village);
      if (addr.postcode) setPostalCode(addr.postcode);
    } else {
      setAddressLine1(s.display_name);
    }
    setShowSuggestions(false);
    setSuggestions([]);
    // Return to non-focused visual state after choosing a suggestion.
    setTimeout(() => addressInputRef.current?.blur(), 0);
  };

  const handleContinue = () => {
    setErrorAddress(null);
    setErrorCity(null);
    setErrorPostalCode(null);
    const line1 = addressLine1.trim();
    const line3 = city.trim();
    const line4 = postalCode.trim();
    if (!line1) {
      setErrorAddress("Please enter your address");
      return;
    }
    if (!line3) {
      setErrorCity("Please enter your city");
      return;
    }
    if (!line4) {
      setErrorPostalCode("Please enter your postal code");
      return;
    }
    setLoading(true);
    const current = state.personalInfo || {
      firstName: "",
      lastName: "",
      fatherName: "",
      idNumber: "",
      email: "",
      phone: "",
      address: "",
    };
    const address = composeAddress(
      addressLine1,
      addressLine2,
      city,
      postalCode,
    );
    dispatch({
      type: "SET_PERSONAL_INFO",
      payload: {
        ...current,
        address,
        addressLine1: line1,
        addressLine2: addressLine2.trim() || undefined,
        city: line3,
        postalCode: line4,
      },
    });
    router.push("/verify/employment-status");
  };

  const canProceed =
    addressLine1.trim().length > 0 &&
    city.trim().length > 0 &&
    postalCode.trim().length > 0;

  useEffect(() => {
    const p = state.personalInfo;
    if (p?.addressLine1) setAddressLine1(p.addressLine1);
    if (p?.addressLine2) setAddressLine2(p.addressLine2);
    if (p?.city) setCity(p.city);
    if (p?.postalCode) setPostalCode(p.postalCode);
  }, [
    state.personalInfo?.addressLine1,
    state.personalInfo?.addressLine2,
    state.personalInfo?.city,
    state.personalInfo?.postalCode,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 768px)");
    const prevHtml = document.documentElement.style.overflowY;
    const prevBody = document.body.style.overflowY;
    const apply = () => {
      if (mql.matches) {
        document.documentElement.style.overflowY = "hidden";
        document.body.style.overflowY = "hidden";
      } else {
        document.documentElement.style.overflowY = prevHtml;
        document.body.style.overflowY = prevBody;
      }
    };
    apply();
    mql.addEventListener?.("change", apply);
    return () => {
      mql.removeEventListener?.("change", apply);
      document.documentElement.style.overflowY = prevHtml;
      document.body.style.overflowY = prevBody;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const syncKeyboard = () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setKeyboardInset(0);
        return;
      }
      const overlap = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      setKeyboardInset(overlap);
    };
    syncKeyboard();
    vv.addEventListener("resize", syncKeyboard);
    vv.addEventListener("scroll", syncKeyboard);
    return () => {
      vv.removeEventListener("resize", syncKeyboard);
      vv.removeEventListener("scroll", syncKeyboard);
    };
  }, []);

  /* verify-address-autofill: globals.css resets WebKit autofill paint so device “saved address” matches field gray */
  const inputBase =
    "verify-address-autofill w-full h-[51px] bg-transparent placeholder:text-[#545454] font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] px-4 border-0 outline-none focus:outline-none focus:ring-0";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#FFFFFF] md:h-screen">
      <VerifyMobileBackRow onBack={() => router.push("/verify/enter-dob")} />

      <main
        className="flex min-h-0 flex-1 flex-col items-start overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 pt-3 pb-28 md:min-h-0 md:items-center md:justify-center md:overflow-visible md:pb-6 md:pt-6"
        style={
          keyboardInset > 0
            ? {
                paddingBottom: `calc(7rem + ${keyboardInset}px + env(safe-area-inset-bottom, 0px))`,
              }
            : undefined
        }
      >
        {/* Desktop heading */}
        <section className="hidden md:block text-center mb-3 md:mb-4">
          <h1 className="font-sans text-[28px] font-bold leading-[100%] tracking-[0%] text-[#000000]">
            Tell us about yourself
          </h1>
          <p className="mt-2 font-sans text-[18px] font-normal leading-[100%] text-[#545454]">
            Local regulation requires us to ask
          </p>
        </section>

        <div className="w-full max-w-[760px] md:mt-2 md:border-[1.5px] md:border-[#D3D3D3] md:rounded-[14px] md:px-7 md:py-9">
          {/* Mobile heading */}
          <h2 className="md:hidden font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-2">
            Address
          </h2>
          {/* Desktop label */}
          <label className="hidden md:block font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-1">
            Address
          </label>
          <p className="font-sans text-[16px] md:text-[16px] leading-[1.4] font-normal text-[#545454] mb-3">
            What is your residential address?
          </p>

          {/* Inputs: same border + focus ring as select-id-type / other verify fields */}
          <div className="space-y-1">
            {/* Address: top 12, bottom 5 — suggestions outside bordered box */}
            <div className="relative w-full">
              <div
                className={`w-full h-[51px] rounded-tl-[12px] rounded-tr-[12px] rounded-br-[5px] rounded-bl-[5px] flex items-center px-0 bg-[#EBEBEB] md:bg-[#14111C1A] border border-[#E5E5E5] focus-within:border-[#A7D80D] focus-within:ring-2 focus-within:ring-[#A7D80D]/20 transition-colors ${
                  errorAddress
                    ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20'
                    : ''
                }`}
              >
                <input
                  ref={addressInputRef}
                  type="text"
                  placeholder="Address"
                  value={addressLine1}
                  onChange={(e) => {
                    setAddressLine1(e.target.value.replace(/^\s+/, ""));
                    setErrorAddress(null);
                  }}
                  onFocus={(e) => {
                    scrollFieldIntoView(e.target);
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) handleContinue();
                  }}
                  className={`${inputBase} rounded-tl-[12px] rounded-tr-[12px] rounded-br-[5px] rounded-bl-[5px]`}
                  autoComplete="off"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#E8E8E9] rounded-[10px] shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s.lat}-${s.lon}-${i}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full px-4 py-3 text-left hover:bg-[#E8E8E9] font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] border-b border-[#E8E8E9] last:border-b-0"
                    >
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errorAddress && (
              <p className="text-sm text-red-600 mt-1">{errorAddress}</p>
            )}

            {/* Apt/Suite: middle field, small radius all around */}
            <div className="relative w-full h-[51px] rounded-[5px] flex items-center px-0 bg-[#EBEBEB] md:bg-[#14111C1A] border border-[#E5E5E5] focus-within:border-[#A7D80D] focus-within:ring-2 focus-within:ring-[#A7D80D]/20 transition-colors">
              <input
                type="text"
                placeholder="Apt, Suite, Unit, Building"
                value={addressLine2}
                onChange={(e) =>
                  setAddressLine2(e.target.value.replace(/^\s+/, ""))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleContinue();
                }}
                onFocus={(e) => scrollFieldIntoView(e.target)}
                className={`${inputBase} rounded-[5px] pr-14`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] md:text-[11px] text-[#828282] pointer-events-none">
                Optional
              </span>
            </div>

            {/* City: middle field */}
            <div
              className={`relative w-full h-[51px] rounded-[5px] flex items-center px-0 bg-[#EBEBEB] md:bg-[#14111C1A] border border-[#E5E5E5] focus-within:border-[#A7D80D] focus-within:ring-2 focus-within:ring-[#A7D80D]/20 transition-colors ${
                errorCity
                  ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20'
                  : ''
              }`}
            >
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value.replace(/^\s+/, ""));
                  setErrorCity(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleContinue();
                }}
                onFocus={(e) => scrollFieldIntoView(e.target)}
                className={`${inputBase} rounded-[5px]`}
              />
              {errorCity && (
                <p className="text-sm text-red-600 mt-1">{errorCity}</p>
              )}
            </div>

            {/* Postal code: bottom field, top 5, bottom 12 */}
            <div
              className={`relative w-full h-[51px] rounded-tl-[5px] rounded-tr-[5px] rounded-br-[12px] rounded-bl-[12px] flex items-center px-0 bg-[#EBEBEB] md:bg-[#14111C1A] border border-[#E5E5E5] focus-within:border-[#A7D80D] focus-within:ring-2 focus-within:ring-[#A7D80D]/20 transition-colors ${
                errorPostalCode
                  ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20'
                  : ''
              }`}
            >
              <input
                type="text"
                placeholder="Postal code"
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value.replace(/^\s+/, ""));
                  setErrorPostalCode(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleContinue();
                }}
                onFocus={(e) => scrollFieldIntoView(e.target)}
                className={`${inputBase} rounded-tl-[5px] rounded-tr-[5px] rounded-br-[12px] rounded-bl-[12px]`}
              />
              {errorPostalCode && (
                <p className="text-sm text-red-600 mt-1">{errorPostalCode}</p>
              )}
            </div>
          </div>

          <div className="hidden md:block mt-4">
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={loading || !canProceed}
              className="w-full h-[50px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <SpinnerIcon color="#000000" /> : "Continue"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/verify/enter-dob")}
              className="flex items-center justify-center gap-2 font-sans text-[16px] font-normal text-[#545454] mt-6 hover:text-[#000000] transition-colors mx-auto"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 18l-6-6 6-6"
                />
              </svg>
              Back to Previous
            </button>
          </div>
        </div>
      </main>
      <PoweredBy />
      {/* Mobile: helper text + bottom Continue button, lime with black text */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex flex-col">
        <p className="mb-3 font-sans text-[14px] leading-[1.4] font-normal text-center text-[#545454]">
          Local regulation requires us to ask
        </p>
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={loading || !canProceed}
          className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <SpinnerIcon color="#000000" /> : "Continue"}
        </button>
      </div>
    </div>
  );
}
