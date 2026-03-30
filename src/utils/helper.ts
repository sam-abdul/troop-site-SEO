import axios from "axios";

export function isTimestamp(value: any): boolean {
  if (typeof value !== "number") {
    return false;
  }
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export const formatTime = (timeString: any): string => {
  if (isTimestamp(timeString)) {
    const date = new Date(timeString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    const formattedTime = `${formattedHours}:${formattedMinutes} ${ampm}`;
    return formattedTime;
  } else {
    const [hours, minutes, seconds] = timeString.split(":");
    const currentDate = new Date();
    currentDate.setHours(parseInt(hours, 10));
    currentDate.setMinutes(parseInt(minutes, 10));
    currentDate.setSeconds(parseInt(seconds, 10));
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(currentDate);
  }
};

export const formatDate = (dateString: any, short: boolean): string => {
  if (isTimestamp(dateString)) {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = short
      ? { month: "short", day: "2-digit" }
      : { month: "short", day: "2-digit", year: "numeric" };
    const formattedDate = date.toLocaleDateString("en-US", options);
    return formattedDate;
  } else {
    const [year, month, day] = dateString?.split("-");
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const monthAbbreviation = months[parseInt(month) - 1];

    return short
      ? `${monthAbbreviation} ${parseInt(day)}`
      : `${monthAbbreviation} ${parseInt(day)}, ${parseInt(year)}`;
  }
};

export const formatDateShort = (dateString: string | number): string => {
  if (isTimestamp(dateString)) {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "2-digit",
    };
    const formattedDate = date.toLocaleDateString("en-US", options);
    return formattedDate;
  } else {
    const [, month, day] = (dateString as string)?.split("-");
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const monthAbbreviation = months[parseInt(month) - 1];
    return `${monthAbbreviation} ${parseInt(day)}`;
  }
};

export const getDomainFromHost = (): string => {
  const hostname = window?.location?.hostname || "";

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    const domainParam = new URLSearchParams(window.location.search).get(
      "domain"
    );
    if (domainParam) return domainParam.replace(/\//g, "").trim();

    return (
      process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || "lagerxperience.troop.sh"
    );
  }

  return hostname.split(":")[0].replace(/\//g, "").trim();
};

export const generateRandomPassword = (): string => {
  return Math.random().toString(36).slice(-8);
};

export const trustedEmailDomains: string[] = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "aol.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "msn.com",
  "yahoo.fr",
  "wanadoo.fr",
  "orange.fr",
  "comcast.net",
  "yahoo.co.uk",
  "yahoo.com.br",
  "yahoo.co.in",
  "live.com",
  "rediffmail.com",
  "free.fr",
  "gmx.de",
  "web.de",
  "yandex.ru",
  "ymail.com",
  "libero.it",
  "outlook.com",
  "uol.com.br",
  "bol.com.br",
  "mail.ru",
  "cox.net",
  "hotmail.it",
  "sbcglobal.net",
  "sfr.fr",
  "live.fr",
  "verizon.net",
  "troopsocial.net",
  "troop.fm",
];

export function isTrustedEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  const domain = email.split("@")[1].toLowerCase();

  if (!trustedEmailDomains.includes(domain) && !domain.endsWith(".edu")) {
    return false;
  }

  return true;
}

export const getFee = (region: string): number => {
  if (region == "United States") return 1;
  if (region == "Canada") return 1;
  if (region == "Ghana") return 1;
  return 100;
};

export const getFeeString = (region: string): string => {
  if (region == "United States") return "$1";
  if (region == "Canada") return "CA$1";
  if (region == "Ghana") return "GH₵1";
  return "₦100";
};

export const getApiErrorMessage = (
  err: unknown,
  fallback = "Something went wrong."
) => {
  if (axios.isAxiosError(err)) {
    if (err.response?.data && typeof err.response.data === "object") {
      if ("message" in err.response.data)
        return String(err.response.data.message);
      if ("error" in err.response.data) return String(err.response.data.error);
    }

    if (err.message === "Network Error") {
      return "Network error. Check your internet and try again.";
    }
  }

  return fallback;
};
