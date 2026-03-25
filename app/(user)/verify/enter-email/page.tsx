"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/useAppContext";
import { getCompanyContext } from "@/app/(public)/utils/kyc-company-context";
import { checkStatusByEmail } from "@/app/api/api";
import { PoweredBy } from "@/components/verify/PoweredBy";
import { SpinnerIcon } from "@/components/verify/SpinnerIcon";
import { API_BASE_URL } from "@/app/(public)/config";

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sendOTP = async (
  email: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (response.status === 429) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Too many requests." }));
      return {
        success: false,
        message: errorData.message || "Too many requests. Please wait.",
      };
    }
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to send OTP" }));
      return {
        success: false,
        message: errorData.message || "Failed to send OTP",
      };
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    return { success: false, message: "Failed to send OTP. Please try again." };
  }
};

const verifyOTP = async (
  email: string,
  otp: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Invalid OTP" }));
      return {
        success: false,
        message: errorData.message || "Invalid OTP code",
      };
    }
    const data = await response.json();
    return data;
  } catch {
    return {
      success: false,
      message: "Failed to verify OTP. Please try again.",
    };
  }
};

export default function EnterEmailPage() {
  const router = useRouter();
  const { dispatch } = useAppContext();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const ctx = getCompanyContext();
    const isLocalPreviewHost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    if (!ctx?.companyId || !ctx?.companySlug) {
      if (!isLocalPreviewHost) {
        router.replace("/verify/start");
        return;
      }
    }
    setChecking(false);
  }, [router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email address is required");
      return;
    }
    setSendingOTP(true);
    setError(null);
    try {
      const result = await sendOTP(trimmed);
      if (result.success) setResendTimer(60);
      else setError(result.message || "Failed to send OTP");
    } catch {
      setError("Failed to send OTP");
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(""));
      setError(null);
      inputRefs.current[5]?.focus();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const pasted = (await navigator.clipboard.readText()).trim();
      if (/^\d{6}$/.test(pasted)) {
        setOtp(pasted.split(""));
        setError(null);
        inputRefs.current[5]?.focus();
      } else if (pasted.length > 0)
        setError("Clipboard must contain a 6-digit code");
    } catch {
      setError("Could not access clipboard");
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    setOtpLoading(true);
    setError(null);
    try {
      const result = await verifyOTP(email.trim(), otpString);
      if (result.success) {
        sessionStorage.setItem("justCompletedOTP", "true");
        router.push("/verify/select-id-type");
        return;
      }
      setError(result.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Failed to verify OTP.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleContinue = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email");
      return;
    }
    if (!validateEmail(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    const ctx = getCompanyContext();
    const companyId = ctx?.companyId ?? null;

    try {
      const result = await checkStatusByEmail(trimmed, companyId ?? undefined);
      if (!result.success || !result.data) {
        setError(result.message ?? "Could not check status. Please try again.");
        setLoading(false);
        return;
      }

      const status = result.data.verificationStatus ?? result.data.kycStatus;

      if (status === "approved") {
        router.push("/decentralized-id/complete");
        setLoading(false);
        return;
      }
      if (
        status === "pending" ||
        status === "submitted" ||
        status === "under_review" ||
        status === "underReview"
      ) {
        router.push("/verify/under-review");
        setLoading(false);
        return;
      }
      if (status === "cancelled" || status === "rejected") {
        router.push(`/verify/rejected?email=${encodeURIComponent(trimmed)}`);
        setLoading(false);
        return;
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Could not verify your email. Please try again.";
      setError(msg);
      setLoading(false);
      return;
    }

    dispatch({
      type: "SET_PERSONAL_INFO",
      payload: {
        firstName: "",
        lastName: "",
        fatherName: "",
        idNumber: "",
        email: trimmed,
        phone: "",
        address: "",
      },
    });

    // Show OTP step immediately so the UI feels instant; send OTP in the background
    setLoading(false);
    setStep("otp");
    setError(null);

    sendOTP(trimmed).then((sendResult) => {
      if (sendResult.success) {
        setResendTimer(60);
      } else {
        setError(
          sendResult.message ??
            "Failed to send verification code. You can try Resend code below.",
        );
      }
    });
  };

  if (checking) {
    return (
      <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-white flex flex-col">
      {/* Mobile: close X only (no back arrow) */}
      <div className="md:hidden flex justify-end pr-4 pt-5 pb-1">
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.push("/")}
          className="h-8 w-5 inline-flex items-center justify-center text-[#000000] hover:opacity-80 transition-opacity"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Main Content - mobile: left-aligned; desktop: centered */}
      <main className="flex-1 min-h-0 flex flex-col items-start md:items-center md:justify-center px-4 pt-2 md:pt-6 pb-28 md:pb-6 overflow-hidden md:overflow-y-auto">
        {/* Desktop: Tell us about yourself - same typography as previous (Inter 20px/700 #000, 16px/400 #545454) */}
        <section className="hidden md:block text-center mb-4">
          <h1 className="font-sans text-[28px] font-bold leading-[100%] tracking-[0%] text-[#000000]">
            Tell us about yourself
          </h1>
          <p className="mt-2 font-sans text-[18px] font-normal leading-[100%] text-[#545454]">
            We&apos;re required to collect this to verify your identity.
          </p>
        </section>

        {/* Card - full width on mobile, bordered on desktop */}
        <div className="w-full max-w-[760px] md:mt-4 md:border-[1.5px] md:border-[#D3D3D3] md:rounded-[14px] md:px-7 md:py-9">
          {step === "email" ? (
            <>
              {/* Email heading + helper: same as Confirm Email page (Inter 20px/700 #000, 16px/400 #545454) */}
              <div className="mb-4">
                <label className="block font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-2">
                  Email
                </label>
                <p className="font-sans text-[16px] font-normal leading-[100%] text-[#545454] mb-3">
                  Enter the email address you&apos;d like to use
                </p>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.replace(/\s/g, ""));
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " ") e.preventDefault();
                    if (e.key === "Enter" && !loading) void handleContinue();
                  }}
                  disabled={loading}
                  className={`w-full h-[52px] rounded-[12px] border-[1.5px] bg-[#E8E8E9] placeholder:text-[#545454] font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] px-4 focus:outline-none focus:ring-2 focus:ring-[#A7D80D]/20 focus:border-[#A7D80D] transition-colors ${
                    error
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-[#A7D80D]"
                  }`}
                />
              </div>

              {error && (
                <p className="text-sm md:text-base text-red-600 mb-4">
                  {error}
                </p>
              )}

              {/* Desktop Continue + Back to Previous */}
              <div className="hidden md:block">
                <button
                  type="button"
                  onClick={() => void handleContinue()}
                  disabled={loading}
                  className="w-full h-[50px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <SpinnerIcon color="#000000" /> : "Continue"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/verify/start")}
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
            </>
          ) : (
            <>
              {/* Confirm Email heading: Inter 700, 20px, #000000, left-aligned */}
              <h2 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-2">
                Confirm Email
              </h2>
              {/* Instructions: Inter 400, 16px, #545454, left-aligned */}
              <p className="font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#545454] mb-4 ">
                Please enter the confirmation code sent to your email. This code
                will expire in two hours.
              </p>

              {/* Email display field: light grey bg, rounded, dark grey text + pencil icon */}
              <div className="flex items-center justify-between gap-2 bg-[#E8E8E9] rounded-[12px] px-4 py-3 md:py-1 mb-5 md:w-fit md:min-w-0 md:max-w-full">
                <span className="text-[14px] md:text-[16px] font-normal text-[#545454] truncate md:max-w-[280px]">
                  {email.trim() || "youremail@gmail.com"}
                </span>
                <button
                  type="button"
                  aria-label="Change email"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className="flex-shrink-0 p-1 text-[#545454] hover:text-[#000000] transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>

              {/* OTP inputs: 6 boxes, light grey interior; focused = green border */}
              <div className="mb-3 md:mt-8 md:ml-5">
                <div className="flex items-center justify-center md:justify-start gap-[5px]">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      disabled={otpLoading}
                      className="w-[42px] h-[52px] md:w-[44px] md:h-[58px] text-center font-sans text-[16px] font-normal leading-[100%] tracking-[0%] rounded-[10px] border-[1.5px] bg-[#E8E8E9] text-[#000000] transition-colors focus:outline-none focus:border-[#A7D80D] focus:ring-2 focus:ring-[#A7D80D]/20 border-[#E0E0E0]"
                    />
                  ))}
                </div>
                {error && (
                  <p className="text-sm text-red-600 mt-2 text-center md:text-left">
                    {error}
                  </p>
                )}
              </div>

              {/* Paste from clipboard - centered on mobile, dark grey */}
              <button
                type="button"
                onClick={() => void handlePasteFromClipboard()}
                className="block w-full text-center md:text-left font-sans text-[14px] font-normal text-[#343434] hover:text-[#000000] transition-colors mb-6 md:mb-4 md:mt-7"
              >
                Paste from clipboard
              </button>

              {/* Desktop OTP Buttons: Go to email (lime), Resend email (gray) */}
              <div className="hidden md:flex flex-col mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleVerifyOtp()}
                  disabled={otpLoading || otp.join("").length !== 6}
                  className="h-[50px] w-full rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-white text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? <SpinnerIcon color="#ffffff" /> : "Go to email"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSendOTP()}
                  disabled={sendingOTP || resendTimer > 0 || otpLoading}
                  className="h-[50px] w-full rounded-[12px] bg-[#E8E8E9] hover:bg-[#E0E0E0] text-black text-[16px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0
                    ? `Resend email (${resendTimer}s)`
                    : "Resend email"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className="flex items-center justify-center gap-2 pt-4 text-[#545454] text-[14px] font-normal mt-4 hover:text-[#000000] transition-colors"
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
            </>
          )}
        </div>
      </main>

      <PoweredBy />

      {/* Mobile: button same width as input (px-4 = main content padding) */}
      {step === "email" ? (
        <div className="md:hidden fixed bottom-0 left-0 right-0   pt-2 bg-gradient-to-t from-white to-transparent flex flex-col items-center gap-2">
          <div className="px-4 flex flex-col items-center w-full">
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={loading}
              className="w-full h-[50px] rounded-[12px] mx-4 bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                "Continue"
              )}
            </button>
          </div>

          <div className="py-3 mt-2 w-full text-center border-t border-gray-200 bg-white">
            <p className="text-xs  text-gray-500">
              Powered by{" "}
              <span className="font-semibold text-gray-700">
                {getCompanyContext()?.companyName}
              </span>
            </p>
          </div>
        </div>
      ) : (
        <div className="md:hidden fixed bottom-0 left-0 right-0   pt-2 bg-gradient-to-t from-white to-transparent flex flex-col items-center gap-2">
          <div className="space-y-2 w-full px-4">
            <button
              type="button"
              onClick={() => void handleVerifyOtp()}
              disabled={otpLoading || otp.join("").length !== 6}
              className="h-[50px] w-full rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-white text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {otpLoading ? <SpinnerIcon color="#ffffff" /> : "Go to email"}
            </button>
            <button
              type="button"
              onClick={() => void handleSendOTP()}
              disabled={sendingOTP || resendTimer > 0 || otpLoading}
              className="h-[50px] w-full rounded-[12px] bg-[#E8E8E9] hover:bg-[#E0E0E0] text-[#545454] text-[16px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendTimer > 0
                ? `Resend email (${resendTimer}s)`
                : "Resend email"}
            </button>
          </div>
           <div className="py-3 mt-2 w-full text-center border-t border-gray-200 bg-white">
            <p className="text-xs  text-gray-500">
              Powered by{" "}
              <span className="font-semibold text-gray-700">
                {getCompanyContext()?.companyName}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
