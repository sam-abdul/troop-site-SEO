export interface CountryData {
  country: string;
  currency: string;
  payment: string;
  code: string;
  wallet: string;
  balance: string;
  countryCode: string;
  flag: string;
}

export interface CountriesCollection {
  [key: string]: CountryData;
}

export const countries: CountriesCollection = {
  Nigeria: {
    country: "Nigeria",
    currency: "₦",
    payment: "paystack",
    code: "NGN",
    wallet: "Naira Wallet",
    balance: "nairaBalance",
    countryCode: "NG",
    flag: "https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/NG.svg",
  },
  Ghana: {
    country: "Ghana",
    currency: "₵",
    payment: "paystack",
    code: "GHS",
    wallet: "GHS Wallet",
    balance: "ghanaBalance",
    countryCode: "GH",
    flag: "https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/GH.svg",
  },
  Canada: {
    country: "Canada",
    currency: "CA$",
    payment: "stripe",
    code: "CAD",
    balance: "canadianBalance",
    wallet: "Canadian Wallet",
    countryCode: "CA",
    flag: "https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/CA.svg",
  },
  "United States": {
    country: "United States",
    currency: "$",
    payment: "stripe",
    code: "USD",
    balance: "dollarBalance",
    wallet: "Dollar Wallet",
    countryCode: "US",
    flag: "https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/US.svg",
  },
};
