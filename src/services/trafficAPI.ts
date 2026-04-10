"use client";

type TrackEventType =
  | "page_view"
  | "checkout_success"
  | "checkout_cancelled"
  | "checkout_pending";

type TrackPayload = {
  siteId?: string;
  domain?: string;
  eventType: TrackEventType;
  path?: string;
  pageId?: string;
  pageTitle?: string;
  pageType?: string;
  entityType?: "event" | "merch";
  entityId?: string;
  entityTitle?: string;
  referrer?: string;
};

const VISITOR_STORAGE_KEY = "troop_traffic_visitor_id";
const SESSION_STORAGE_KEY = "troop_traffic_session_id";

let memoryVisitorId = "";
let memorySessionId = "";

const generateClientId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `troop-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getOrCreateStorageId = (
  key: string,
  storage: "local" | "session"
): string => {
  try {
    const targetStorage =
      storage === "local" ? window.localStorage : window.sessionStorage;
    const existing = targetStorage.getItem(key);
    if (existing) return existing;
    const created = generateClientId();
    targetStorage.setItem(key, created);
    return created;
  } catch {
    if (storage === "local") {
      if (!memoryVisitorId) memoryVisitorId = generateClientId();
      return memoryVisitorId;
    }
    if (!memorySessionId) memorySessionId = generateClientId();
    return memorySessionId;
  }
};

const isEmbeddedPreview = (): boolean => {
  if (typeof window === "undefined") return false;

  const search = new URLSearchParams(window.location.search);
  if (search.get("preview") === "true") return true;

  try {
    if (window.self !== window.top) return true;
  } catch {
    // Cross-origin access can throw; if this happens we're embedded.
    return true;
  }

  return false;
};

export const trackTrafficEvent = async (payload: TrackPayload) => {
  if (typeof window === "undefined") return;
  if (isEmbeddedPreview()) return;

  const visitorId = getOrCreateStorageId(VISITOR_STORAGE_KEY, "local");
  const sessionId = getOrCreateStorageId(SESSION_STORAGE_KEY, "session");

  const body = {
    ...payload,
    visitorId,
    sessionId,
    domain: payload.domain || window.location.host,
    path: payload.path || window.location.pathname,
    referrer: payload.referrer || document.referrer || "",
  };

  const jsonBody = JSON.stringify(body);

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([jsonBody], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/traffic", blob);
      if (sent) return;
    }
  } catch {
    // fall through to fetch
  }

  try {
    await fetch("/api/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonBody,
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    // noop
  }
};
