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

export async function POST(request: NextRequest) {
  try {
    const payload =
      (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (!DASHBOARD_SECRET) {
      return NextResponse.json(
        { success: true, message: "Traffic secret missing, skipped" },
        { status: 202 }
      );
    }

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
          ]) || undefined,
        state:
          pickFirstHeader(request, [
            "x-vercel-ip-country-region",
            "x-region",
            "x-nf-geo-region",
          ]) || undefined,
        city:
          pickFirstHeader(request, ["x-vercel-ip-city", "x-city", "x-nf-geo-city"]) ||
          undefined,
      },
      ip: getClientIp(request) || undefined,
    };

    await fetch(endpoint, {
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

    return NextResponse.json({ success: true }, { status: 202 });
  } catch {
    return NextResponse.json({ success: true }, { status: 202 });
  }
}

