import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

const DASHBOARD_SECRET = process.env.DASHBOARD_API_SECRET || "";

const getClientIp = (request: NextRequest): string => {
  const candidates = [
    request.headers.get("x-forwarded-for"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-client-ip"),
    request.headers.get("x-nf-client-connection-ip"),
    request.headers.get("x-vercel-forwarded-for"),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const value = candidate.split(",")[0].trim();
    if (value) return value;
  }

  return "";
};

const pickFirstHeader = (request: NextRequest, names: string[]) => {
  for (const name of names) {
    const value = request.headers.get(name);
    if (value && value.trim()) return value.trim();
  }
  return "";
};

const parseHeaderJson = (request: NextRequest, headerName: string) => {
  const raw = request.headers.get(headerName);
  if (!raw) return {} as Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore malformed header
  }
  return {} as Record<string, unknown>;
};

const getString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const getNameOrCode = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return getString(record.name) || getString(record.code);
  }
  return "";
};

export async function POST(request: NextRequest) {
  try {
    const payload =
      (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (!DASHBOARD_SECRET) {
      console.error("[traffic] DASHBOARD_API_SECRET is missing");
      return NextResponse.json(
        { success: false, message: "Traffic secret missing" },
        { status: 500 }
      );
    }

    const netlifyGeo = parseHeaderJson(request, "x-nf-geo");
    const netlifySubdivision =
      (netlifyGeo.subdivision as Record<string, unknown> | undefined) || {};

    const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
    const endpoint = `${normalizedBase}/sites/traffic`;

    const forwardedPayload = {
      ...payload,
      location: {
        country:
          pickFirstHeader(request, [
            "cf-ipcountry",
            "x-vercel-ip-country",
            "x-country",
            "x-nf-geo-country",
          ]) ||
          getNameOrCode(netlifyGeo.country) ||
          undefined,
        state:
          pickFirstHeader(request, [
            "x-vercel-ip-country-region",
            "x-region",
            "x-nf-geo-region",
          ]) ||
          getString(netlifyGeo.region) ||
          getNameOrCode(netlifySubdivision) ||
          getString(netlifyGeo.subdivision_name) ||
          undefined,
        city:
          pickFirstHeader(request, ["x-vercel-ip-city", "x-city", "x-nf-geo-city"]) ||
          getString(netlifyGeo.city) ||
          undefined,
      },
      ip: getClientIp(request) || undefined,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DASHBOARD_SECRET}`,
        "User-Agent":
          request.headers.get("user-agent") || "troop-site-seo-traffic-proxy",
      },
      body: JSON.stringify(forwardedPayload),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[traffic] backend tracking failed", {
        status: response.status,
        body: body.slice(0, 300),
      });
      return NextResponse.json(
        { success: false, message: "Traffic forwarding failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    console.error("[traffic] unexpected proxy error", error);
    return NextResponse.json(
      { success: false, message: "Traffic proxy error" },
      { status: 500 }
    );
  }
}
