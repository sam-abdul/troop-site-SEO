"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { eventsAPI } from "@/services/eventsAPI";
import { merchAPI } from "@/services/merchAPI";
import { globalJsAPI } from "@/services/globalJsAPI";
import { trackTrafficEvent } from "@/services/trafficAPI";
import { useSiteData } from "@/context/SiteDataContext";
import { countries } from "@/utils/countries";
import JoinEvent from "@/components/events/JoinEvent";
import BuyMerchModal from "@/components/merch/BuyMerchModal";
import type { VariantOption } from "@/types/merch";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";
import type { SitePage } from "@/services/sitesAPI";

interface PageRendererSEOProps {
  page: SitePage;
  pages?: SitePage[];
  defaultPageId?: string | null;
  defaultPageSlug?: string | null;
  siteId?: string;
  eventId?: string | null;
  merchId?: string | null;
  initialEventData?: Record<string, any> | null;
  initialMerchData?: Record<string, any> | null;
}

const fontStylesheetUrls = [
  "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Style+Script&display=swap",
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Inconsolata:wght@200..900&family=Manrope:wght@200..800&family=Mona+Sans:ital,wght@0,200..900;1,200..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Public+Sans:ital,wght@0,100..900;1,100..900&family=Raleway:ital,wght@0,100..900;1,100..900&family=Space+Grotesk:wght@300..700&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap",
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap",
  "https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;700;900&display=swap",
  "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap",
  "https://unpkg.com/aos@2.3.1/dist/aos.css",
];

const shadowFontImportCss = `
  @import url('https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
`;

const baseRuntimeCss = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    line-height: 1.3;
  }
  [data-aos] {
    opacity: 1 !important;
    transform: none !important;
  }
  img,
  video {
    max-width: 100%;
  }
  video {
    display: block;
  }
  .gjs-section {
    width: 100%;
  }
  .gjs-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .gjs-row {
    display: flex;
    gap: 20px;
  }
  .gjs-col {
    flex: 1;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    padding: 0;
    font-weight: 600;
    font-family: Poppins, sans-serif;
  }
  h1 {
    font-size: 2.5rem;
    line-height: 1.2;
  }
  h2 {
    font-size: 2rem;
    line-height: 1.3;
  }
  h3 {
    font-size: 1.75rem;
    line-height: 1.4;
  }
  h4 {
    font-size: 1.5rem;
    line-height: 1.4;
  }
  h5 {
    font-size: 1.25rem;
    line-height: 1.5;
  }
  h6 {
    font-size: 1rem;
    line-height: 1.5;
  }
  p {
    margin: 0;
    padding: 0;
    font-size: 1rem;
    line-height: 1.6;
    font-family: Poppins, sans-serif;
  }
  .gjs-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(3, 1fr);
    min-height: 100px;
    padding: 20px;
  }
  .gjs-event-card,
  .gjs-merch-card {
    display: block;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    text-decoration: none;
    color: inherit;
  }
  .gjs-event-card:hover,
  .gjs-merch-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  .gjs-event-card-image,
  .gjs-merch-card-image {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    background: #f3f4f6;
  }
  .gjs-event-card-content,
  .gjs-merch-card-content {
    padding: 16px;
  }
  .gjs-event-card-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #111827;
    line-height: 1.3;
  }
  .gjs-event-card-theme {
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0 0 8px 0;
    color: #6b7280;
    line-height: 1.4;
  }
  .gjs-event-card-date {
    font-size: 0.875rem;
    margin: 0 0 8px 0;
    color: #4b5563;
    line-height: 1.4;
  }
  .gjs-event-card-price {
    font-size: 1rem;
    font-weight: 700;
    margin: 8px 0 0 0;
    color: #111827;
    line-height: 1.4;
  }
  .gjs-merch-card-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #111827;
    line-height: 1.3;
  }
  .gjs-merch-card-description {
    font-size: 0.875rem;
    margin: 0 0 8px 0;
    color: #6b7280;
    line-height: 1.5;
  }
  .gjs-merch-card-price {
    font-size: 1rem;
    font-weight: 700;
    margin: 8px 0 0 0;
    color: #111827;
    line-height: 1.4;
  }
  @media (max-width: 1024px) {
    .gjs-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 768px) {
    .gjs-row {
      flex-direction: column;
    }
    .gjs-grid {
      grid-template-columns: 1fr !important;
    }
    .gjs-section {
      padding: 30px 16px;
    }
    .gjs-event-card-content,
    .gjs-merch-card-content {
      padding: 12px;
    }
    .gjs-event-card-title,
    .gjs-merch-card-title {
      font-size: 1.125rem;
    }
  }
`;

const slugify = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

const formatDateValue = (value: unknown) => {
  if (!value) return "";
  const raw =
    typeof value === "string" || typeof value === "number" ? value : "";
  let date: Date;

  if (
    typeof raw === "number" ||
    (typeof raw === "string" && /^\d+$/.test(raw))
  ) {
    const timestamp = typeof raw === "string" ? parseInt(raw, 10) : raw;
    date = new Date(
      timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp,
    );
  } else {
    date = new Date(String(raw));
  }

  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTimeValue = (value: unknown) => {
  if (!value) return "";
  const raw = String(value);
  let date: Date;

  if (/^\d+$/.test(raw)) {
    const timestamp = parseInt(raw, 10);
    date = new Date(
      timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp,
    );
  } else if (raw.includes("T") || raw.includes(":")) {
    date = new Date(raw);
  } else {
    const [hours = "0", mins = "0"] = raw.split(":");
    date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
  }

  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getNested = (target: Record<string, any>, path: string): unknown => {
  if (!path) return "";

  if (path.includes("[") && path.includes("]")) {
    const matcher = path.match(/^(.+)\[(\d+)\](?:\.(.+))?$/);
    if (!matcher) return "";

    const [, basePath, indexStr, restField] = matcher;
    const baseParts = basePath.split(".");
    let value: any = target;

    for (const part of baseParts) {
      value = value?.[part];
      if (value === undefined || value === null) return "";
    }

    const index = parseInt(indexStr, 10);
    const item = Array.isArray(value) ? value[index] : undefined;
    if (item === undefined || item === null) return "";

    if (!restField) {
      if (typeof item === "object" && "url" in item) return (item as any).url;
      return item;
    }

    return item?.[restField] ?? "";
  }

  if (path.includes(".")) {
    return path.split(".").reduce((acc: any, part) => acc?.[part], target);
  }

  return target[path];
};

const getDynamicValue = (
  source: string | null,
  field: string | null,
  eventData: Record<string, any> | null,
  merchData: Record<string, any> | null,
) => {
  if (!source || !field) return "";

  const data = source === "event" ? eventData : merchData;
  if (!data) return "";

  const value = getNested(data, field);
  if (value === undefined || value === null) return "";

  if (field === "date" || field === "endDate") return formatDateValue(value);
  if (field === "time" || field === "endTime") return formatTimeValue(value);
  if (field === "isFree") return value ? "Free" : "Paid";
  if (field === "price") {
    const currency = countries[data.country || "US"]?.currency || "$";
    return `${currency}${Number(value).toLocaleString()}`;
  }

  return String(value);
};

const populateBoundFields = (
  root: HTMLElement,
  eventData: Record<string, any> | null,
  merchData: Record<string, any> | null,
) => {
  const boundElements = root.querySelectorAll<HTMLElement>(
    "[data-bind-source][data-bind-field]",
  );

  boundElements.forEach((el) => {
    const source = el.getAttribute("data-bind-source");
    const field = el.getAttribute("data-bind-field");
    const value = getDynamicValue(source, field, eventData, merchData);

    if (el.tagName === "IMG") {
      el.setAttribute("src", value);
      if (!el.getAttribute("alt")) {
        el.setAttribute("alt", value || "Image");
      }
      return;
    }

    el.textContent = value;
  });
};

const withImageVersion = (
  url: string,
  version: string | number | undefined,
) => {
  const source = String(url || "").trim();
  if (!source) return "";

  const versionValue =
    version !== undefined && version !== null ? String(version) : "";
  if (!versionValue) return source;

  try {
    const parsed = new URL(source, "https://troop.local");
    parsed.searchParams.set("troopv", versionValue);
    if (source.startsWith("http://") || source.startsWith("https://")) {
      return parsed.toString();
    }
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return path.startsWith("/") ? path : source;
  } catch {
    const separator = source.includes("?") ? "&" : "?";
    return `${source}${separator}troopv=${encodeURIComponent(versionValue)}`;
  }
};

const getEventCardFieldValue = (event: Record<string, any>, field: string) => {
  if (!event || !field) return "";

  switch (field) {
    case "title":
      return String(event.title || "");
    case "theme":
      return String(event.theme || event.eventTheme || "");
    case "date":
      return formatDateValue(event.date || event.startDate);
    case "time":
      return formatTimeValue(event.time || event.startTime);
    case "dateTime":
    case "date-time": {
      const date = formatDateValue(event.date || event.startDate);
      const time = formatTimeValue(event.time || event.startTime);
      return [date, time].filter(Boolean).join(" ");
    }
    case "price": {
      if (event.isFree) return "Free";
      const tickets = Array.isArray(event.tickets)
        ? event.tickets
        : Array.isArray(event.ticketTypes)
          ? event.ticketTypes
          : [];
      const ticketPrices = tickets
        .map((ticket: any) =>
          Number(ticket?.price ?? ticket?.ticketAmount ?? 0),
        )
        .filter((price: number) => Number.isFinite(price));
      const minPrice =
        ticketPrices.length > 0
          ? Math.min(...ticketPrices)
          : Number(event.price || 0);
      if (!Number.isFinite(minPrice) || minPrice <= 0) return "Free";
      const currency = countries[event.country || "US"]?.currency || "$";
      return `${currency}${Number(minPrice).toLocaleString()}`;
    }
    case "imageUrl":
    case "image": {
      const rawImage = String(event.imageUrl || event.image || "");
      const imageVersion =
        event.updatedAt ||
        event.lastUpdated ||
        event.timestamp ||
        event._fetchedAt ||
        "";
      return withImageVersion(rawImage, imageVersion);
    }
    case "description":
      return String(event.description || "");
    case "location":
      return String(
        event.location ||
          event.address ||
          event.placeDetails?.description ||
          "",
      );
    case "venue":
      return String(event.venue || event.location || event.address || "");
    default:
      return String(event[field] ?? "");
  }
};

const populateEventCards = (
  root: HTMLElement,
  userEvents: any[] | null,
  eventDetailsById: Record<string, any>,
) => {
  if (!Array.isArray(userEvents) || userEvents.length === 0) return;

  const allCards = root.querySelectorAll<HTMLElement>(
    'a[data-event-id], .gjs-event-card[data-event-id], [data-gjs-type="eventCard"][data-event-id], [data-block-id="eventCard"][data-event-id]',
  );

  allCards.forEach((card) => {
    const eventId = card.getAttribute("data-event-id");
    if (!eventId) return;

    const event =
      eventDetailsById[String(eventId)] ||
      userEvents.find((item: any) => String(item?.id) === String(eventId));
    if (!event) return;

    if (card.tagName === "A") {
      card.setAttribute("href", `/event/${eventId}`);
      card.setAttribute("data-link-type", "event");
      card.setAttribute("data-target-type", "url");
    }

    const boundElements =
      card.querySelectorAll<HTMLElement>("[data-bind-event]");
    boundElements.forEach((el) => {
      const field = el.getAttribute("data-bind-event") || "";
      const value = getEventCardFieldValue(event, field);
      if (el.tagName === "IMG") {
        el.setAttribute("src", value);
        if (!el.getAttribute("alt")) {
          el.setAttribute("alt", event.title || "Event image");
        }
      } else {
        el.textContent = value;
      }
    });

    const imageValue = getEventCardFieldValue(event, "imageUrl");
    const imageEl =
      card.querySelector<HTMLImageElement>(
        '.gjs-event-card-image img, .card-media img, img[data-bind-event="imageUrl"], img[data-bind-event="image"], img',
      ) || null;
    if (imageEl && imageValue) {
      imageEl.setAttribute("src", imageValue);
      imageEl.setAttribute("alt", event.title || "Event image");
    }

    const titleValue = getEventCardFieldValue(event, "title");
    const themeValue = getEventCardFieldValue(event, "theme");
    const dateValue = getEventCardFieldValue(event, "dateTime");
    const priceValue = getEventCardFieldValue(event, "price");

    const titleEl = card.querySelector<HTMLElement>(
      '.gjs-event-card-title, .card-title, [data-bind-event="title"]',
    );
    const themeEl = card.querySelector<HTMLElement>(
      '.gjs-event-card-theme, .card-theme, [data-bind-event="theme"]',
    );
    const dateEl = card.querySelector<HTMLElement>(
      '.gjs-event-card-date, .date-line, [data-bind-event="dateTime"], [data-bind-event="date-time"]',
    );
    const priceEl = card.querySelector<HTMLElement>(
      '.gjs-event-card-price, .price, [data-bind-event="price"]',
    );

    if (titleEl) titleEl.textContent = titleValue;
    if (themeEl) themeEl.textContent = themeValue;
    if (dateEl) dateEl.textContent = dateValue;
    if (priceEl) priceEl.textContent = priceValue;
  });
};

const getRequiredVariantTypes = (merch: any) => {
  const variants = Array.isArray(merch?.variants) ? merch.variants : [];
  return [
    ...new Set(variants.map((v: VariantOption) => v?.type).filter(Boolean)),
  ] as string[];
};

const replaceRootSelectorToken = (
  css: string,
  token: "html" | "body",
  replacement: string,
) => {
  // Replace selector tokens only, not class names like ".card-body".
  const tokenRegex = new RegExp(
    `(^|[\\s,{}>+~(])${token}(?=($|[\\s.#\\[:{>+~,:)]))`,
    "gim",
  );
  return css.replace(tokenRegex, `$1${replacement}`);
};

const normalizeRootSelectors = (css: string) => {
  let normalized = css.replace(/:root\b/gi, ".troop-page-root");
  normalized = replaceRootSelectorToken(normalized, "html", ".troop-page-root");
  normalized = replaceRootSelectorToken(normalized, "body", ".troop-page-body");
  return normalized
    .replace(/\.troop-page-root\s+\.troop-page-root/g, ".troop-page-root")
    .replace(/\.troop-page-body\s+\.troop-page-body/g, ".troop-page-body");
};

const extractBodyStyleFallbacks = (css: string) => {
  const fallback: {
    backgroundColor?: string;
    color?: string;
    fontFamily?: string;
  } = {};

  const isUsableValue = (value: string) => {
    const lowered = value.trim().toLowerCase();
    return (
      lowered.length > 0 &&
      lowered !== "initial" &&
      lowered !== "inherit" &&
      lowered !== "unset" &&
      lowered !== "transparent" &&
      !lowered.startsWith("var(")
    );
  };

  const parseBackgroundColorFromShorthand = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return "";

    const colorMatch = normalized.match(
      /(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8}\b)/i,
    );
    if (colorMatch?.[1]) return colorMatch[1].trim();

    const namedColorMatch = normalized.match(/\b(black|white)\b/i);
    if (namedColorMatch?.[1]) return namedColorMatch[1].trim();

    return "";
  };

  const selectorRuleRegex =
    /(?:^|})\s*([^{}]*\b(?:body|html)\b[^{}]*)\{([^}]*)\}/gim;
  let match: RegExpExecArray | null;
  while ((match = selectorRuleRegex.exec(css))) {
    const declarations = match[2] || "";

    const bgColorMatch = declarations.match(
      /background-color\s*:\s*([^;]+)\s*;?/i,
    );
    if (bgColorMatch?.[1] && isUsableValue(bgColorMatch[1])) {
      fallback.backgroundColor = bgColorMatch[1].trim();
    }

    if (!fallback.backgroundColor) {
      const bgShorthandMatch = declarations.match(
        /background\s*:\s*([^;]+)\s*;?/i,
      );
      if (bgShorthandMatch?.[1]) {
        const shorthandColor = parseBackgroundColorFromShorthand(
          bgShorthandMatch[1],
        );
        if (shorthandColor && isUsableValue(shorthandColor)) {
          fallback.backgroundColor = shorthandColor;
        }
      }
    }

    const colorMatch = declarations.match(
      /(?:^|;)\s*color\s*:\s*([^;]+)\s*;?/i,
    );
    if (colorMatch?.[1] && isUsableValue(colorMatch[1])) {
      fallback.color = colorMatch[1].trim();
    }

    const fontFamilyMatch = declarations.match(
      /font-family\s*:\s*([^;]+)\s*;?/i,
    );
    if (fontFamilyMatch?.[1] && isUsableValue(fontFamilyMatch[1])) {
      fallback.fontFamily = fontFamilyMatch[1].trim();
    }
  }

  return fallback;
};

const resolveVisibleBackgroundColor = (value: string | undefined) => {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (
    !normalized ||
    normalized === "initial" ||
    normalized === "inherit" ||
    normalized === "unset" ||
    normalized === "transparent" ||
    normalized.startsWith("var(")
  ) {
    return "";
  }
  return value.trim();
};

const getStyleValue = (
  element: HTMLElement,
  cssVarName: string,
  fallback: string,
) => {
  const cleanName = cssVarName.replace(/^--/, "");
  const inlineStyle = element.getAttribute("style") || "";
  const inlineRegex = new RegExp(`--${cleanName}:\\s*([^;]+)`, "i");
  const inlineMatch = inlineStyle.match(inlineRegex);

  if (inlineMatch?.[1]) {
    return inlineMatch[1].trim();
  }

  const computed = window
    .getComputedStyle(element)
    .getPropertyValue(`--${cleanName}`)
    .trim();
  return computed || fallback;
};

const populateVariationSelectors = (root: HTMLElement, merchData: any) => {
  if (!merchData || !Array.isArray(merchData.variants)) return;

  const selectors = root.querySelectorAll<HTMLElement>(
    "[data-gjs-type='variationSelector'], [data-block-id='variationSelector']",
  );
  if (!selectors.length) return;

  const variants = merchData.variants;
  const uniqueTypes = [
    ...new Set(variants.map((v: VariantOption) => v?.type).filter(Boolean)),
  ] as string[];
  const variantsByType: Record<string, VariantOption[]> = {};

  uniqueTypes.forEach((type) => {
    const typeVariants = variants.filter(
      (v: VariantOption) => v?.type === type && v?.value,
    );
    const values = [
      ...new Set(
        typeVariants
          .map((v: VariantOption) =>
            typeof v.value === "string" ? v.value : String(v.value),
          )
          .filter(Boolean),
      ),
    ] as string[];

    variantsByType[type] = values.map((value) => ({ type, value }));
  });

  selectors.forEach((selector) => {
    selector
      .querySelectorAll("div[data-variant-section]")
      .forEach((section) => section.remove());
    selector.querySelector("[data-preview-variants]")?.remove();

    const container =
      selector.closest<HTMLElement>(".variation-selector-container") ||
      selector;

    const styleConfig = {
      buttonBorder: getStyleValue(
        container,
        "variation-button-border",
        "#d1d5db",
      ),
      buttonBg: getStyleValue(container, "variation-button-bg", "#f9fafb"),
      buttonText: getStyleValue(container, "variation-button-text", "#111827"),
      buttonRadius: getStyleValue(container, "variation-button-radius", "8px"),
      buttonPadding: getStyleValue(
        container,
        "variation-button-padding",
        "8px 16px",
      ),
      buttonFontSize: getStyleValue(
        container,
        "variation-button-font-size",
        "14px",
      ),
      buttonGap: getStyleValue(container, "variation-button-gap", "8px"),
      selectedBg: getStyleValue(
        container,
        "variation-button-selected-bg",
        "#49DD96",
      ),
      selectedBorder: getStyleValue(
        container,
        "variation-button-selected-border",
        "#49DD96",
      ),
      selectedText: getStyleValue(
        container,
        "variation-button-selected-text",
        "#000000",
      ),
    };

    Object.entries(variantsByType).forEach(([type, typeVariants]) => {
      const section = document.createElement("div");
      section.setAttribute("data-variant-section", type);
      section.style.marginBottom = "16px";

      const heading = document.createElement("h4");
      heading.style.fontSize = "16px";
      heading.style.fontWeight = "500";
      heading.style.marginBottom = "8px";
      heading.textContent = type;
      section.appendChild(heading);

      const buttonsContainer = document.createElement("div");
      buttonsContainer.style.display = "flex";
      buttonsContainer.style.flexWrap = "wrap";
      buttonsContainer.style.gap = styleConfig.buttonGap;

      typeVariants.forEach((variant) => {
        const button = document.createElement("button");
        button.setAttribute("data-variant-button", "");
        button.setAttribute("data-variant-type", variant.type);
        button.setAttribute("data-variant-value", variant.value);
        button.setAttribute("data-style-border", styleConfig.buttonBorder);
        button.setAttribute("data-style-bg", styleConfig.buttonBg);
        button.setAttribute("data-style-text", styleConfig.buttonText);
        button.setAttribute(
          "data-style-selected-border",
          styleConfig.selectedBorder,
        );
        button.setAttribute("data-style-selected-bg", styleConfig.selectedBg);
        button.setAttribute(
          "data-style-selected-text",
          styleConfig.selectedText,
        );

        button.style.padding = styleConfig.buttonPadding;
        button.style.fontSize = styleConfig.buttonFontSize;
        button.style.borderRadius = styleConfig.buttonRadius;
        button.style.border = `2px solid ${styleConfig.buttonBorder}`;
        button.style.backgroundColor = styleConfig.buttonBg;
        button.style.color = styleConfig.buttonText;
        button.style.transition = "all 0.2s";
        button.style.cursor = "pointer";
        button.style.fontWeight = "400";
        button.textContent = variant.value;

        buttonsContainer.appendChild(button);
      });

      section.appendChild(buttonsContainer);
      selector.appendChild(section);
    });
  });
};

const updateVariantButtonStyles = (
  root: HTMLElement,
  selectedVariants: VariantOption[],
) => {
  const buttons = root.querySelectorAll<HTMLElement>("[data-variant-button]");

  buttons.forEach((button) => {
    const variantType = button.getAttribute("data-variant-type");
    const variantValue = button.getAttribute("data-variant-value");
    const isSelected = selectedVariants.some(
      (variant) =>
        variant.type === variantType && variant.value === variantValue,
    );

    const border = button.getAttribute("data-style-border") || "#d1d5db";
    const bg = button.getAttribute("data-style-bg") || "#f9fafb";
    const text = button.getAttribute("data-style-text") || "#111827";
    const selectedBorder =
      button.getAttribute("data-style-selected-border") || "#49DD96";
    const selectedBg =
      button.getAttribute("data-style-selected-bg") || "#49DD96";
    const selectedText =
      button.getAttribute("data-style-selected-text") || "#000000";

    button.style.borderColor = isSelected ? selectedBorder : border;
    button.style.backgroundColor = isSelected ? selectedBg : bg;
    button.style.color = isSelected ? selectedText : text;
    button.style.fontWeight = isSelected ? "600" : "400";
  });
};

const createScopedDocument = (root: HTMLElement): Document => {
  const getElementById = (id: string) =>
    root.querySelector<HTMLElement>(`[id="${id.replace(/"/g, '\\"')}"]`);

  return {
    querySelector: root.querySelector.bind(root),
    querySelectorAll: root.querySelectorAll.bind(root),
    getElementById,
    addEventListener: root.addEventListener.bind(root),
    removeEventListener: root.removeEventListener.bind(root),
    body: root,
    documentElement: root,
    readyState: "complete",
  } as unknown as Document;
};

export const PageRendererSEO: React.FC<PageRendererSEOProps> = ({
  page,
  pages = [],
  defaultPageId = null,
  defaultPageSlug = null,
  siteId,
  eventId,
  merchId,
  initialEventData = null,
  initialMerchData = null,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, userEvents } = useSiteData();

  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const executedGlobalJsKey = useRef("");
  const singleEventRef = useRef<any | null>(initialEventData);
  const singleMerchRef = useRef<any | null>(initialMerchData);
  const selectedVariantsRef = useRef<VariantOption[]>([]);
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const trackedPageViewKeyRef = useRef("");

  const [singleEvent, setSingleEvent] = useState<any | null>(initialEventData);
  const [singleMerch, setSingleMerch] = useState<any | null>(initialMerchData);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [loadingMerch, setLoadingMerch] = useState(false);
  const [showJoinEventModal, setShowJoinEventModal] = useState(false);
  const [showBuyMerchModal, setShowBuyMerchModal] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<VariantOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [globalJs, setGlobalJs] = useState("");
  const [shadowReady, setShadowReady] = useState(false);
  const [eventDetailsById, setEventDetailsById] = useState<Record<string, any>>(
    {},
  );
  const requestedEventIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    singleEventRef.current = singleEvent;
  }, [singleEvent]);

  useEffect(() => {
    singleMerchRef.current = singleMerch;
  }, [singleMerch]);

  useEffect(() => {
    selectedVariantsRef.current = selectedVariants;
  }, [selectedVariants]);

  const eventTemplatePage = useMemo(
    () => pages.find((item) => item.pageType === "event") || null,
    [pages],
  );
  const merchTemplatePage = useMemo(
    () => pages.find((item) => item.pageType === "merch") || null,
    [pages],
  );
  const activePage = useMemo(() => {
    if ((eventId || singleEvent) && eventTemplatePage) return eventTemplatePage;
    if (merchId && merchTemplatePage) return merchTemplatePage;
    return page;
  }, [
    eventId,
    eventTemplatePage,
    merchId,
    merchTemplatePage,
    page,
    singleEvent,
  ]);

  const currentPath = useMemo(
    () => (pathname || "").replace(/^\//, ""),
    [pathname],
  );

  useEffect(() => {
    if (!siteId || !activePage?.id) return;
    if (typeof window === "undefined") return;

    const path = pathname || "/";
    const entityType =
      eventId || singleEvent?.id ? "event" : merchId ? "merch" : undefined;
    const entityId = eventId || singleEvent?.id || merchId || singleMerch?.id;
    const entityTitle =
      entityType === "event"
        ? String(singleEvent?.title || "")
        : String(singleMerch?.name || singleMerch?.title || "");

    const trackingKey = [
      siteId,
      activePage.id,
      path,
      entityType || "",
      String(entityId || ""),
    ].join("|");

    if (trackedPageViewKeyRef.current === trackingKey) return;
    trackedPageViewKeyRef.current = trackingKey;

    trackTrafficEvent({
      siteId,
      domain: window.location.host,
      eventType: "page_view",
      path,
      pageId: String(activePage.id || ""),
      pageTitle: String(activePage.title || ""),
      pageType: String(activePage.pageType || "normal"),
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      entityTitle: entityTitle || undefined,
      referrer: document.referrer || "",
    });
  }, [
    activePage?.id,
    activePage?.pageType,
    activePage?.title,
    eventId,
    merchId,
    pathname,
    singleEvent?.id,
    singleEvent?.title,
    singleMerch?.id,
    singleMerch?.name,
    singleMerch?.title,
    siteId,
  ]);

  const pageHtml = useMemo(() => {
    const html = (activePage?.html || "").trim();
    if (html.startsWith("<body>")) {
      return html.replace(/^<body>/, "").replace(/<\/body>$/, "");
    }
    return html;
  }, [activePage?.html]);

  const pageCss = useMemo(
    () => normalizeRootSelectors(activePage?.css || ""),
    [activePage?.css],
  );
  const bodyCssFallbacks = useMemo(
    () => extractBodyStyleFallbacks(activePage?.css || ""),
    [activePage?.css],
  );

  const pageBaseCss = useMemo(
    () => `
      .troop-page-root {
        width: 100%;
        min-height: 100dvh;
        background-color: ${bodyCssFallbacks.backgroundColor || activePage.bodyBackgroundColor || "#ffffff"};
        color: ${bodyCssFallbacks.color || activePage.bodyTextColor || "#000000"};
      }
      .troop-page-body {
        width: 100%;
        min-height: 100dvh;
        font-family: ${bodyCssFallbacks.fontFamily || activePage.bodyFontFamily || "Poppins, sans-serif"};
        background-color: ${bodyCssFallbacks.backgroundColor || activePage.bodyBackgroundColor || "#ffffff"};
        color: ${bodyCssFallbacks.color || activePage.bodyTextColor || "#000000"};
        text-align: ${activePage.bodyTextAlign || "left"};
        -webkit-font-smoothing: auto;
        -moz-osx-font-smoothing: auto;
        text-rendering: auto;
      }
    `,
    [
      activePage.bodyBackgroundColor,
      activePage.bodyFontFamily,
      activePage.bodyTextAlign,
      activePage.bodyTextColor,
      bodyCssFallbacks.backgroundColor,
      bodyCssFallbacks.color,
      bodyCssFallbacks.fontFamily,
    ],
  );

  const shadowHeadHtml = useMemo(
    () =>
      fontStylesheetUrls
        .map((url) => `<link rel="stylesheet" href="${url}" />`)
        .join("\n"),
    [],
  );

  const getPageRoot = () =>
    shadowRef.current?.querySelector<HTMLElement>(".troop-page-body") || null;

  const pageBackgroundColor = useMemo(() => {
    const resolved =
      resolveVisibleBackgroundColor(bodyCssFallbacks.backgroundColor) ||
      resolveVisibleBackgroundColor(activePage.bodyBackgroundColor);
    if (resolved) return resolved;

    const textColor = (
      bodyCssFallbacks.color ||
      activePage.bodyTextColor ||
      ""
    ).toLowerCase();
    const likelyDarkPage =
      textColor.includes("255") ||
      textColor.includes("#fff") ||
      textColor.includes("white");
    return likelyDarkPage ? "#0b0b0b" : "#ffffff";
  }, [
    activePage.bodyBackgroundColor,
    activePage.bodyTextColor,
    bodyCssFallbacks.backgroundColor,
    bodyCssFallbacks.color,
  ]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (!shadowRef.current) {
      shadowRef.current = host.attachShadow({ mode: "open" });
    }

    setShadowReady(false);

    shadowRef.current.innerHTML = `
      ${shadowHeadHtml}
      <style>${shadowFontImportCss}</style>
      <style>${baseRuntimeCss}\n${pageBaseCss}\n${pageCss}</style>
      <div class="troop-page-root troop-aos-fallback"><div class="troop-page-body">${pageHtml}</div></div>
    `;

    let cancelled = false;
    const linkElements = Array.from(
      shadowRef.current.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    );
    const cleanupFns: Array<() => void> = [];

    const markReady = () => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (!cancelled) {
          setShadowReady(true);
        }
      });
    };

    if (!linkElements.length) {
      markReady();
      return () => {
        cancelled = true;
      };
    }

    let remaining = linkElements.length;
    const onDone = () => {
      remaining -= 1;
      if (remaining <= 0) {
        markReady();
      }
    };

    linkElements.forEach((link) => {
      if ((link as any).sheet) {
        onDone();
        return;
      }

      const handleLoad = () => onDone();
      const handleError = () => onDone();
      link.addEventListener("load", handleLoad, { once: true });
      link.addEventListener("error", handleError, { once: true });

      cleanupFns.push(() => {
        link.removeEventListener("load", handleLoad);
        link.removeEventListener("error", handleError);
      });
    });

    const timeoutId = window.setTimeout(markReady, 2200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      cleanupFns.forEach((fn) => fn());
    };
  }, [pageBaseCss, pageCss, pageHtml, shadowHeadHtml]);

  useEffect(() => {
    document.body.style.height = "100dvh";
    return () => {
      document.body.style.height = "";
    };
  }, []);

  useEffect(() => {
    if (!siteId) return;

    let cancelled = false;

    const fetchGlobalJs = async () => {
      try {
        const global = await globalJsAPI.getGlobalJs(siteId);
        if (!cancelled) {
          setGlobalJs(global?.code || "");
        }
      } catch {
        if (!cancelled) {
          setGlobalJs("");
        }
      }
    };

    fetchGlobalJs();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  useEffect(() => {
    setSelectedVariants([]);
    setQuantity(1);
  }, [merchId, eventId, activePage.pageType]);

  useEffect(() => {
    let mounted = true;

    const fetchEvent = async () => {
      if (!mounted) return;

      if (eventId) {
        if (!userId) {
          setLoadingEvent(true);
          return;
        }

        const cachedEvent = singleEventRef.current;
        if (cachedEvent && String(cachedEvent.id) === String(eventId)) {
          setLoadingEvent(false);
          return;
        }

        setLoadingEvent(true);
        try {
          const response = await eventsAPI.getSingleEvent(eventId);
          const sameOwner =
            response?.data?.event?.userID !== undefined &&
            String(response.data.event.userID) === String(userId);

          if (response.success && response.data?.event && sameOwner) {
            if (mounted)
              setSingleEvent({ id: eventId, ...response.data.event });
          } else {
            router.push("/");
          }
        } catch {
          router.push("/");
        } finally {
          if (mounted) setLoadingEvent(false);
        }
        return;
      }

      if (
        !currentPath ||
        currentPath.startsWith("event/") ||
        currentPath.startsWith("merch/")
      ) {
        if (!currentPath.startsWith("event/")) {
          setSingleEvent(null);
        }
        setLoadingEvent(false);
        return;
      }

      if (!userId) {
        setLoadingEvent(true);
        return;
      }

      const pathSlug = currentPath.toLowerCase();
      const pageBySlug = pages.find((item) => slugify(item.title) === pathSlug);
      const pageById = pages.find((item) => item.id === currentPath);

      if (pageBySlug || pageById) {
        setSingleEvent(null);
        setLoadingEvent(false);
        return;
      }

      try {
        setLoadingEvent(true);
        const response = await eventsAPI.getEventByShortURL(currentPath);
        const sameOwner =
          response?.data?.event?.userID !== undefined &&
          String(response.data.event.userID) === String(userId);

        if (response.success && response.data?.event && sameOwner) {
          if (mounted) {
            setSingleEvent({
              id: response.data.event.id,
              ...response.data.event,
            });
          }
        } else {
          if (mounted) setSingleEvent(null);
        }
      } catch {
        if (mounted) setSingleEvent(null);
      } finally {
        if (mounted) setLoadingEvent(false);
      }
    };

    fetchEvent();

    return () => {
      mounted = false;
    };
  }, [currentPath, eventId, pages, router, userId]);

  useEffect(() => {
    let mounted = true;

    const fetchMerch = async () => {
      if (activePage.pageType !== "merch" || !merchId) {
        setLoadingMerch(false);
        if (activePage.pageType !== "merch") {
          setSingleMerch(null);
        }
        return;
      }

      if (!userId) {
        setLoadingMerch(true);
        return;
      }

      const cachedMerch = singleMerchRef.current;
      if (cachedMerch && String(cachedMerch.id) === String(merchId)) {
        setLoadingMerch(false);
        return;
      }

      setLoadingMerch(true);
      try {
        const response = await merchAPI.getSingleMerch(merchId);
        const sameOwner =
          response?.data?.userID !== undefined &&
          String(response.data.userID) === String(userId);

        if (response.success && response.data && sameOwner) {
          if (mounted) setSingleMerch(response.data);
        } else {
          toast.error("Merch item not found");
          router.push("/");
        }
      } catch {
        toast.error("Failed to load merch item");
        router.push("/");
      } finally {
        if (mounted) setLoadingMerch(false);
      }
    };

    fetchMerch();

    return () => {
      mounted = false;
    };
  }, [activePage.pageType, merchId, router, userId]);

  useEffect(() => {
    const root = getPageRoot();
    if (!root) return;

    populateBoundFields(root, singleEvent, singleMerch);
    populateEventCards(root, userEvents, eventDetailsById);

    if (singleMerch) {
      populateVariationSelectors(root, singleMerch);
      updateVariantButtonStyles(root, selectedVariantsRef.current);
    }
  }, [
    eventDetailsById,
    pageBaseCss,
    pageCss,
    pageHtml,
    singleEvent,
    singleMerch,
    userEvents,
  ]);

  useEffect(() => {
    const root = getPageRoot();
    if (!root || !userId) return;

    const ids = Array.from(
      new Set(
        Array.from(root.querySelectorAll<HTMLElement>("[data-event-id]"))
          .map((el) => el.getAttribute("data-event-id") || "")
          .filter(Boolean),
      ),
    );

    if (!ids.length) return;

    let cancelled = false;

    const fetchLatestEventDetails = async () => {
      const missingIds = ids.filter(
        (id) =>
          !eventDetailsById[id] &&
          !requestedEventIdsRef.current.has(String(id)),
      );

      if (!missingIds.length) return;

      await Promise.all(
        missingIds.map(async (id) => {
          requestedEventIdsRef.current.add(String(id));
          try {
            const response = await eventsAPI.getSingleEvent(String(id));
            const event = response?.data?.event;
            const sameOwner =
              event?.userID !== undefined &&
              String(event.userID) === String(userId);
            if (!cancelled && response?.success && event && sameOwner) {
              setEventDetailsById((prev) => ({
                ...prev,
                [String(id)]: {
                  id: String(id),
                  ...event,
                  _fetchedAt: Date.now(),
                },
              }));
            }
          } catch {
            // noop
          }
        }),
      );
    };

    fetchLatestEventDetails();

    return () => {
      cancelled = true;
    };
  }, [eventDetailsById, pageBaseCss, pageCss, pageHtml, userId]);

  useEffect(() => {
    const root = getPageRoot();
    if (!root) return;

    updateVariantButtonStyles(root, selectedVariants);
  }, [selectedVariants, pageBaseCss, pageCss, pageHtml]);

  useEffect(() => {
    const root = getPageRoot();
    if (!root || !globalJs) return;

    const executionKey = `${activePage.id || activePage.title}:${globalJs}:${pageHtml.length}`;
    if (executedGlobalJsKey.current === executionKey) return;
    executedGlobalJsKey.current = executionKey;

    try {
      const execute = new Function("window", "document", "root", globalJs);
      execute(window, createScopedDocument(root), root);
    } catch (error) {
      console.error("Global JS error", error);
    }
  }, [activePage.id, activePage.title, globalJs, pageHtml]);

  useEffect(() => {
    const root = getPageRoot();
    if (!root) return;

    const prefetchRoute = (href: string) => {
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      const normalizedHref = href.toLowerCase();
      const isDefaultHref =
        (defaultPageSlug &&
          normalizedHref === `/${defaultPageSlug.toLowerCase()}`) ||
        (defaultPageId &&
          normalizedHref === `/${String(defaultPageId).toLowerCase()}`);
      const route = isDefaultHref ? "/" : href;
      if (prefetchedRoutesRef.current.has(route)) return;
      prefetchedRoutesRef.current.add(route);
      try {
        router.prefetch(route);
      } catch {
        // noop
      }
    };

    const resolveRouteFromLink = (link: HTMLAnchorElement) => {
      const href = link.getAttribute("href") || "";
      const pageId = link.getAttribute("data-page-id");
      const targetType = link.getAttribute("data-target-type");
      const eventTargetId = link.getAttribute("data-event-id");
      const merchTargetId = link.getAttribute("data-merch-id");
      const isEventCard =
        link.classList.contains("gjs-event-card") ||
        link.getAttribute("data-gjs-type") === "eventCard";
      const isMerchCard =
        link.classList.contains("gjs-merch-card") ||
        link.getAttribute("data-gjs-type") === "merchCard";
      const linkType = link.getAttribute("data-link-type");

      if (pageId && targetType === "page") {
        const targetPage = pages.find((item) => item.id === pageId);
        if (!targetPage) return "";
        const isDefaultTarget =
          Boolean(defaultPageId) &&
          String(targetPage.id) === String(defaultPageId);
        return isDefaultTarget ? "/" : `/${slugify(targetPage.title)}`;
      }

      if (isEventCard && eventTargetId) return `/event/${eventTargetId}`;
      if (isMerchCard && merchTargetId) return `/merch/${merchTargetId}`;

      if (!href || /^(https?:\/\/|mailto:|tel:)/i.test(href)) return "";
      if (
        linkType === "event" ||
        linkType === "merch" ||
        href.startsWith("/event/") ||
        href.startsWith("/merch/") ||
        (href.startsWith("/") && !href.startsWith("//"))
      ) {
        return href;
      }
      return "";
    };

    const prefetchAllVisibleLinks = () => {
      const links = root.querySelectorAll<HTMLAnchorElement>("a");
      links.forEach((link) => {
        const route = resolveRouteFromLink(link);
        if (route) prefetchRoute(route);
      });
    };

    const handleHoverPrefetch = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest<HTMLAnchorElement>("a");
      if (!link) return;
      const route = resolveRouteFromLink(link);
      if (route) prefetchRoute(route);
    };

    prefetchAllVisibleLinks();
    root.addEventListener("mouseover", handleHoverPrefetch);

    return () => {
      root.removeEventListener("mouseover", handleHoverPrefetch);
    };
  }, [
    defaultPageId,
    defaultPageSlug,
    pageBaseCss,
    pageCss,
    pageHtml,
    pages,
    router,
  ]);

  useEffect(() => {
    const root = getPageRoot();
    if (!root) return;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const buyButton = target.closest(
        "[data-gjs-type='buyButton'], [data-block-id='buyButton'], button[data-gjs-type='buyButton']",
      );
      if (buyButton) {
        event.preventDefault();

        if (activePage.pageType === "event" && singleEvent) {
          setShowJoinEventModal(true);
          return;
        }

        if (activePage.pageType === "merch" && merchId && singleMerch) {
          const requiredTypes = getRequiredVariantTypes(singleMerch);
          const selectedTypes = selectedVariants.map((variant) => variant.type);
          const allSelected = requiredTypes.every((type) =>
            selectedTypes.includes(type),
          );

          if (!allSelected && requiredTypes.length > 0) {
            toast.error(
              "Please select all required variants before purchasing",
            );
            return;
          }

          setShowBuyMerchModal(true);
          return;
        }

        toast.error("Please wait for the page to load");
        return;
      }

      const decreaseBtn = target.closest("[data-quantity-decrease]");
      if (decreaseBtn) {
        event.preventDefault();

        const parent = decreaseBtn.parentElement;
        const quantityEl = parent?.querySelector<HTMLElement>(
          "[data-quantity-value]",
        );
        const currentQty = quantityEl
          ? parseInt(quantityEl.textContent || "1", 10)
          : quantity;
        const nextQty = Math.max(1, currentQty - 1);

        if (quantityEl) quantityEl.textContent = String(nextQty);
        setQuantity(nextQty);
        return;
      }

      const increaseBtn = target.closest("[data-quantity-increase]");
      if (increaseBtn) {
        event.preventDefault();

        const parent = increaseBtn.parentElement;
        const quantityEl = parent?.querySelector<HTMLElement>(
          "[data-quantity-value]",
        );
        const currentQty = quantityEl
          ? parseInt(quantityEl.textContent || "1", 10)
          : quantity;
        const nextQty = currentQty + 1;

        if (quantityEl) quantityEl.textContent = String(nextQty);
        setQuantity(nextQty);
        return;
      }

      const variantButton = target.closest<HTMLElement>(
        "[data-variant-button]",
      );
      if (variantButton) {
        event.preventDefault();

        const variantType = variantButton.getAttribute("data-variant-type");
        const variantValue = variantButton.getAttribute("data-variant-value");
        if (!variantType || !variantValue) return;

        setSelectedVariants((prev) => {
          const withoutType = prev.filter(
            (variant) => variant.type !== variantType,
          );
          return [...withoutType, { type: variantType, value: variantValue }];
        });
        return;
      }

      const link = target.closest<HTMLAnchorElement>("a");
      if (!link) return;

      const href = link.getAttribute("href");
      const pageId = link.getAttribute("data-page-id");
      const targetType = link.getAttribute("data-target-type");
      const eventTargetId = link.getAttribute("data-event-id");
      const merchTargetId = link.getAttribute("data-merch-id");
      const isEventCard =
        link.classList.contains("gjs-event-card") ||
        link.getAttribute("data-gjs-type") === "eventCard";
      const isMerchCard =
        link.classList.contains("gjs-merch-card") ||
        link.getAttribute("data-gjs-type") === "merchCard";
      const linkType = link.getAttribute("data-link-type");

      if (!href) return;

      if (/^(https?:\/\/)/i.test(href)) {
        event.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }

      if (pageId && targetType === "page") {
        event.preventDefault();
        const targetPage = pages.find((item) => item.id === pageId);
        if (targetPage) {
          const isDefaultTarget =
            Boolean(defaultPageId) &&
            String(targetPage.id) === String(defaultPageId);
          router.push(isDefaultTarget ? "/" : `/${slugify(targetPage.title)}`);
        }
        return;
      }

      if (isEventCard && eventTargetId) {
        event.preventDefault();
        router.push(`/event/${eventTargetId}`);
        return;
      }

      if (isMerchCard && merchTargetId) {
        event.preventDefault();
        router.push(`/merch/${merchTargetId}`);
        return;
      }

      if (
        linkType === "event" ||
        linkType === "merch" ||
        href.startsWith("/event/") ||
        href.startsWith("/merch/") ||
        (href.startsWith("/") && !href.startsWith("//"))
      ) {
        event.preventDefault();
        const normalizedHref = href.toLowerCase();
        const isDefaultHref =
          (defaultPageSlug &&
            normalizedHref === `/${defaultPageSlug.toLowerCase()}`) ||
          (defaultPageId &&
            normalizedHref === `/${String(defaultPageId).toLowerCase()}`);
        router.push(isDefaultHref ? "/" : href);
      }
    };

    root.addEventListener("click", handleClick);
    return () => {
      root.removeEventListener("click", handleClick);
    };
  }, [
    activePage.pageType,
    merchId,
    pages,
    defaultPageId,
    defaultPageSlug,
    quantity,
    router,
    selectedVariants,
    singleEvent,
    singleMerch,
    pageBaseCss,
    pageCss,
    pageHtml,
  ]);

  const isLoading = Boolean(
    (eventId && loadingEvent) ||
    (activePage.pageType === "merch" && merchId && loadingMerch),
  );
  const isEventContext = Boolean(eventId || singleEvent);
  const eventDataReady = !isEventContext || Boolean(singleEvent);
  const merchDataReady =
    activePage.pageType !== "merch" || !merchId || Boolean(singleMerch);
  const isDataReady = eventDataReady && merchDataReady;

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader
            strokeWidth={3}
            className="h-8 w-8 animate-spin text-gray-600"
          />
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (!isDataReady) return null;

  return (
    <>
      <div
        style={{
          width: "100%",
          minHeight: "100dvh",
          backgroundColor: pageBackgroundColor,
        }}
      >
        <div
          ref={hostRef}
          style={{
            width: "100%",
            minHeight: "100dvh",
            visibility: shadowReady ? "visible" : "hidden",
            opacity: shadowReady ? 1 : 0,
            transition: "opacity 0.12s ease-out",
          }}
        />
      </div>

      {showJoinEventModal && singleEvent?.id && (
        <JoinEvent
          isOpen={showJoinEventModal}
          setIsOpen={setShowJoinEventModal}
          event={singleEvent}
          id={singleEvent.id}
          modalColors={(activePage as any).modalColors}
        />
      )}

      {showBuyMerchModal && singleMerch && merchId && (
        <BuyMerchModal
          isOpen={showBuyMerchModal}
          setIsOpen={setShowBuyMerchModal}
          merchItem={singleMerch}
          selectedVariants={selectedVariants}
          quantity={quantity}
          modalColors={(activePage as any).modalColors}
        />
      )}
    </>
  );
};
