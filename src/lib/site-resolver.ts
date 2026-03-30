import type { Site, SitePage } from "@/services/sitesAPI";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

const isLocalHost = (hostname: string) =>
  LOCAL_HOSTS.has(hostname) ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.") ||
  hostname.startsWith("172.") ||
  /^\d+\.\d+\.\d+\.\d+$/.test(hostname);

export const slugify = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

export const resolveDomain = (hostHeader: string | null, queryDomain?: string) => {
  const host = (hostHeader || "").split(":")[0].trim();
  const fallbackDomain =
    process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || "lagerxperience.troop.sh";

  if (isLocalHost(host)) {
    if (queryDomain) {
      return queryDomain.replace(/\//g, "").trim();
    }
    return fallbackDomain;
  }

  if (!host) {
    // No host in non-local context should not silently resolve to a default domain.
    return "";
  }

  return host.replace(/\//g, "").trim();
};

export const toAbsoluteUrl = (url: string | undefined, origin: string) => {
  if (!url) return "";
  try {
    return new URL(url, origin).toString();
  } catch {
    return url;
  }
};

export const extractFirstImageUrl = (html?: string) => {
  if (!html) return "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || "";
};

export const resolveMetaImage = (site: Site, page: SitePage | null, origin: string) => {
  const candidate =
    site.shareImageUrl ||
    site.imageUrl ||
    site.logoUrl ||
    site.bannerUrl ||
    site.coverImageUrl;

  if (candidate) {
    return toAbsoluteUrl(candidate, origin);
  }

  const fromHtml = extractFirstImageUrl(page?.html);
  return toAbsoluteUrl(fromHtml, origin);
};

export const resolveCurrentPage = ({
  site,
  path,
  eventId,
  merchId,
  isEventShortURL,
}: {
  site: Site;
  path: string;
  eventId?: string | null;
  merchId?: string | null;
  isEventShortURL?: boolean;
}) => {
  if (!site.pages?.length) return null;

  if (eventId || isEventShortURL) {
    const eventPage = site.pages.find((p) => p.pageType === "event");
    if (eventPage) return eventPage;
  }

  if (merchId) {
    const merchPage = site.pages.find((p) => p.pageType === "merch");
    if (merchPage) return merchPage;
  }

  if (!path) {
    if (site.defaultPage) {
      const defaultPage = site.pages.find((p) => p.id === site.defaultPage);
      if (defaultPage) return defaultPage;
    }
    return site.pages[0];
  }

  const pathSlug = path.toLowerCase();
  const pageBySlug = site.pages.find((p) => slugify(p.title) === pathSlug);
  if (pageBySlug) return pageBySlug;

  const pageById = site.pages.find((p) => p.id === path);
  if (pageById) return pageById;

  if (site.defaultPage) {
    const defaultPage = site.pages.find((p) => p.id === site.defaultPage);
    if (defaultPage) return defaultPage;
  }

  return site.pages[0];
};
