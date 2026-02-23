/**
 * Country calling codes for phone input.
 * Values use lowercase ISO 3166-1 alpha-2 to match app state (e.g. selectedCountry).
 */

export interface PhoneCountryCode {
  value: string
  label: string
  dialCode: string
}

export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
  { value: 'us', label: 'US (+1)', dialCode: '+1' },
  { value: 'ca', label: 'CA (+1)', dialCode: '+1' },
  { value: 'mx', label: 'MX (+52)', dialCode: '+52' },
  { value: 'uk', label: 'UK (+44)', dialCode: '+44' },
  { value: 'de', label: 'DE (+49)', dialCode: '+49' },
  { value: 'fr', label: 'FR (+33)', dialCode: '+33' },
  { value: 'it', label: 'IT (+39)', dialCode: '+39' },
  { value: 'es', label: 'ES (+34)', dialCode: '+34' },
  { value: 'nl', label: 'NL (+31)', dialCode: '+31' },
  { value: 'pl', label: 'PL (+48)', dialCode: '+48' },
  { value: 'ru', label: 'RU (+7)', dialCode: '+7' },
  { value: 'cn', label: 'CN (+86)', dialCode: '+86' },
  { value: 'in', label: 'IN (+91)', dialCode: '+91' },
  { value: 'jp', label: 'JP (+81)', dialCode: '+81' },
  { value: 'kr', label: 'KR (+82)', dialCode: '+82' },
  { value: 'pk', label: 'PK (+92)', dialCode: '+92' },
  { value: 'bd', label: 'BD (+880)', dialCode: '+880' },
  { value: 'id', label: 'ID (+62)', dialCode: '+62' },
  { value: 'th', label: 'TH (+66)', dialCode: '+66' },
  { value: 'vn', label: 'VN (+84)', dialCode: '+84' },
  { value: 'ph', label: 'PH (+63)', dialCode: '+63' },
  { value: 'my', label: 'MY (+60)', dialCode: '+60' },
  { value: 'sg', label: 'SG (+65)', dialCode: '+65' },
  { value: 'ae', label: 'AE (+971)', dialCode: '+971' },
  { value: 'sa', label: 'SA (+966)', dialCode: '+966' },
  { value: 'tr', label: 'TR (+90)', dialCode: '+90' },
  { value: 'au', label: 'AU (+61)', dialCode: '+61' },
  { value: 'nz', label: 'NZ (+64)', dialCode: '+64' },
  { value: 'br', label: 'BR (+55)', dialCode: '+55' },
  { value: 'ar', label: 'AR (+54)', dialCode: '+54' },
  { value: 'co', label: 'CO (+57)', dialCode: '+57' },
  { value: 'cl', label: 'CL (+56)', dialCode: '+56' },
  { value: 'eg', label: 'EG (+20)', dialCode: '+20' },
  { value: 'za', label: 'ZA (+27)', dialCode: '+27' },
  { value: 'ng', label: 'NG (+234)', dialCode: '+234' },
  { value: 'ke', label: 'KE (+254)', dialCode: '+254' },
  { value: 'af', label: 'AF (+93)', dialCode: '+93' },
  { value: 'al', label: 'AL (+355)', dialCode: '+355' },
  { value: 'dz', label: 'DZ (+213)', dialCode: '+213' },
  { value: 'ad', label: 'AD (+376)', dialCode: '+376' },
  { value: 'ao', label: 'AO (+244)', dialCode: '+244' },
  { value: 'ag', label: 'AG (+1268)', dialCode: '+1268' },
  { value: 'am', label: 'AM (+374)', dialCode: '+374' },
  { value: 'at', label: 'AT (+43)', dialCode: '+43' },
  { value: 'az', label: 'AZ (+994)', dialCode: '+994' },
  { value: 'bh', label: 'BH (+973)', dialCode: '+973' },
  { value: 'by', label: 'BY (+375)', dialCode: '+375' },
  { value: 'be', label: 'BE (+32)', dialCode: '+32' },
  { value: 'ba', label: 'BA (+387)', dialCode: '+387' },
  { value: 'bw', label: 'BW (+267)', dialCode: '+267' },
  { value: 'bg', label: 'BG (+359)', dialCode: '+359' },
  { value: 'cv', label: 'CV (+238)', dialCode: '+238' },
  { value: 'hr', label: 'HR (+385)', dialCode: '+385' },
  { value: 'cy', label: 'CY (+357)', dialCode: '+357' },
  { value: 'cz', label: 'CZ (+420)', dialCode: '+420' },
  { value: 'dk', label: 'DK (+45)', dialCode: '+45' },
  { value: 'ee', label: 'EE (+372)', dialCode: '+372' },
  { value: 'fi', label: 'FI (+358)', dialCode: '+358' },
  { value: 'ge', label: 'GE (+995)', dialCode: '+995' },
  { value: 'gh', label: 'GH (+233)', dialCode: '+233' },
  { value: 'gr', label: 'GR (+30)', dialCode: '+30' },
  { value: 'hk', label: 'HK (+852)', dialCode: '+852' },
  { value: 'hu', label: 'HU (+36)', dialCode: '+36' },
  { value: 'is', label: 'IS (+354)', dialCode: '+354' },
  { value: 'ie', label: 'IE (+353)', dialCode: '+353' },
  { value: 'il', label: 'IL (+972)', dialCode: '+972' },
  { value: 'kz', label: 'KZ (+7)', dialCode: '+7' },
  { value: 'kw', label: 'KW (+965)', dialCode: '+965' },
  { value: 'lv', label: 'LV (+371)', dialCode: '+371' },
  { value: 'lb', label: 'LB (+961)', dialCode: '+961' },
  { value: 'lt', label: 'LT (+370)', dialCode: '+370' },
  { value: 'lu', label: 'LU (+352)', dialCode: '+352' },
  { value: 'mt', label: 'MT (+356)', dialCode: '+356' },
  { value: 'md', label: 'MD (+373)', dialCode: '+373' },
  { value: 'ma', label: 'MA (+212)', dialCode: '+212' },
  { value: 'no', label: 'NO (+47)', dialCode: '+47' },
  { value: 'om', label: 'OM (+968)', dialCode: '+968' },
  { value: 'pt', label: 'PT (+351)', dialCode: '+351' },
  { value: 'qa', label: 'QA (+974)', dialCode: '+974' },
  { value: 'ro', label: 'RO (+40)', dialCode: '+40' },
  { value: 'sk', label: 'SK (+421)', dialCode: '+421' },
  { value: 'si', label: 'SI (+386)', dialCode: '+386' },
  { value: 'se', label: 'SE (+46)', dialCode: '+46' },
  { value: 'ch', label: 'CH (+41)', dialCode: '+41' },
  { value: 'tw', label: 'TW (+886)', dialCode: '+886' },
  { value: 'tz', label: 'TZ (+255)', dialCode: '+255' },
  { value: 'ua', label: 'UA (+380)', dialCode: '+380' },
  { value: 'uy', label: 'UY (+598)', dialCode: '+598' },
  { value: 've', label: 'VE (+58)', dialCode: '+58' },
]

export function getCountryCode(countryKey: string): string {
  const entry = PHONE_COUNTRY_CODES.find((c) => c.value === countryKey.toLowerCase())
  return entry?.dialCode ?? '+1'
}

export function getMinPhoneLength(country: string): number {
  const lengths: Record<string, number> = {
    us: 10, ca: 10, mx: 10,
    uk: 10, de: 10, fr: 9, it: 9, es: 9, nl: 9, pl: 9, ru: 10,
    cn: 11, in: 10, jp: 10, kr: 9, pk: 10, bd: 10, id: 9, th: 9,
    vn: 9, ph: 10, my: 9, sg: 8, ae: 9, sa: 9, tr: 10,
    au: 9, nz: 8,
    br: 10, ar: 10, co: 10, cl: 9,
    eg: 10, za: 9, ng: 10, ke: 9,
  }
  return lengths[country.toLowerCase()] ?? 7
}

export function getMaxPhoneLength(country: string): number {
  const lengths: Record<string, number> = {
    us: 10, ca: 10, mx: 10,
    uk: 10, de: 11, fr: 9, it: 10, es: 9, nl: 9, pl: 9, ru: 10,
    cn: 11, in: 10, jp: 10, kr: 10, pk: 10, bd: 10, id: 10, th: 9,
    vn: 10, ph: 10, my: 10, sg: 8, ae: 9, sa: 9, tr: 10,
    au: 9, nz: 9,
    br: 11, ar: 10, co: 10, cl: 9,
    eg: 10, za: 9, ng: 10, ke: 9,
  }
  return lengths[country.toLowerCase()] ?? 15
}

export function validatePhoneByCountry(phone: string, countryKey: string, dialCode?: string): string | null {
  const digitsOnly = phone.replace(/\D/g, '')
  const code = dialCode ?? getCountryCode(countryKey)
  const codeDigits = code.replace(/\+/, '')
  const phoneDigits = digitsOnly.startsWith(codeDigits)
    ? digitsOnly.slice(codeDigits.length)
    : digitsOnly
  const minLength = getMinPhoneLength(countryKey)
  const maxLength = getMaxPhoneLength(countryKey)
  if (phoneDigits.length < minLength) return `Phone number must be at least ${minLength} digits`
  if (phoneDigits.length > maxLength) return `Phone number must be at most ${maxLength} digits`
  return null
}

export function formatByCountry(digits: string, country: string): string {
  const c = country.toLowerCase()
  if (c === 'us' || c === 'ca') {
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (c === 'uk') {
    if (digits.length <= 4) return digits
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  if (c === 'pk') {
    if (digits.length <= 4) return digits
    return `${digits.slice(0, 4)}-${digits.slice(4)}`
  }
  if (c === 'in') {
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  if (c === 'br') {
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (c === 'de') {
    if (digits.length <= 4) return digits
    return `${digits.slice(0, 4)} ${digits.slice(4)}`
  }
  if (c === 'fr') {
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
  }
  if (c === 'au') {
    if (digits.length <= 4) return digits
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  if (c === 'cn') {
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
  }
  if (c === 'jp') {
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return digits
}
