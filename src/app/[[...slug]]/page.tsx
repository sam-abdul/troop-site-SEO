import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SitePageShell } from "@/components/SitePageShell";
import { eventsAPI } from "@/services/eventsAPI";
import { merchAPI } from "@/services/merchAPI";
import { sitesAPI } from "@/services/sitesAPI";
import type { SeoSettings } from "@/types/seo";
import {
  resolveCurrentPage,
  resolveDomain,
  resolveMetaImage,
  slugify,
} from "@/lib/site-resolver";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const toMetaText = (value: unknown) => {
  if (!value) return "";
  return String(value).replace(/\s+/g, " ").trim();
};

const truncate = (value: string, max = 160) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
};

const firstMetaText = (...values: unknown[]) =>
  values.map((value) => toMetaText(value)).find(Boolean) || "";

const uniqueTexts = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const toNonEmptyText = (value: unknown) => {
  const text = toMetaText(value);
  return text || undefined;
};

const toList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => toMetaText(item))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeSeo = (raw: unknown): SeoSettings => {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, any>;
  const normalized: SeoSettings = {};

  const setText = (key: keyof SeoSettings) => {
    const value = toNonEmptyText(source[key]);
    if (value) {
      (normalized as any)[key] = value;
    }
  };

  setText("title");
  setText("description");
  setText("brandName");
  setText("canonicalPath");
  setText("locale");
  setText("category");
  setText("applicationName");
  setText("themeColor");
  setText("focusKeyword");
  setText("image");
  setText("jsonLd");

  const keywords = uniqueTexts(toList(source.keywords));
  if (keywords.length) normalized.keywords = keywords;

  const authors = uniqueTexts(toList(source.authors));
  if (authors.length) normalized.authors = authors;

  const openGraphSource =
    source.openGraph && typeof source.openGraph === "object"
      ? (source.openGraph as Record<string, any>)
      : null;
  if (openGraphSource) {
    const openGraph: SeoSettings["openGraph"] = {};
    const ogTitle = toNonEmptyText(openGraphSource.title);
    const ogDescription = toNonEmptyText(openGraphSource.description);
    const ogImage = toNonEmptyText(openGraphSource.image);
    const ogImageAlt = toNonEmptyText(openGraphSource.imageAlt);
    const ogType = toNonEmptyText(openGraphSource.type);
    const ogUrl = toNonEmptyText(openGraphSource.url);
    const ogSiteName = toNonEmptyText(openGraphSource.siteName);
    if (ogTitle) openGraph.title = ogTitle;
    if (ogDescription) openGraph.description = ogDescription;
    if (ogImage) openGraph.image = ogImage;
    if (ogImageAlt) openGraph.imageAlt = ogImageAlt;
    if (ogType) openGraph.type = ogType;
    if (ogUrl) openGraph.url = ogUrl;
    if (ogSiteName) openGraph.siteName = ogSiteName;
    if (Object.keys(openGraph).length) normalized.openGraph = openGraph;
  }

  const twitterSource =
    source.twitter && typeof source.twitter === "object"
      ? (source.twitter as Record<string, any>)
      : null;
  if (twitterSource) {
    const twitter: SeoSettings["twitter"] = {};
    const card = toNonEmptyText(twitterSource.card);
    if (
      card === "summary" ||
      card === "summary_large_image" ||
      card === "app" ||
      card === "player"
    ) {
      twitter.card = card;
    }
    const twTitle = toNonEmptyText(twitterSource.title);
    const twDescription = toNonEmptyText(twitterSource.description);
    const twImage = toNonEmptyText(twitterSource.image);
    const twSite = toNonEmptyText(twitterSource.site);
    const twCreator = toNonEmptyText(twitterSource.creator);
    if (twTitle) twitter.title = twTitle;
    if (twDescription) twitter.description = twDescription;
    if (twImage) twitter.image = twImage;
    if (twSite) twitter.site = twSite;
    if (twCreator) twitter.creator = twCreator;
    if (Object.keys(twitter).length) normalized.twitter = twitter;
  }

  const robotsSource =
    source.robots && typeof source.robots === "object"
      ? (source.robots as Record<string, any>)
      : null;
  if (robotsSource) {
    const robots: SeoSettings["robots"] = {};
    if (typeof robotsSource.index === "boolean") robots.index = robotsSource.index;
    if (typeof robotsSource.follow === "boolean") robots.follow = robotsSource.follow;
    if (typeof robotsSource.noarchive === "boolean") robots.noarchive = robotsSource.noarchive;
    if (typeof robotsSource.nosnippet === "boolean") robots.nosnippet = robotsSource.nosnippet;
    if (typeof robotsSource.noimageindex === "boolean") robots.noimageindex = robotsSource.noimageindex;
    if (typeof robotsSource.maxSnippet === "number") robots.maxSnippet = robotsSource.maxSnippet;
    if (typeof robotsSource.maxVideoPreview === "number") {
      robots.maxVideoPreview = robotsSource.maxVideoPreview;
    }
    const maxImagePreview = toNonEmptyText(robotsSource.maxImagePreview);
    if (
      maxImagePreview === "none" ||
      maxImagePreview === "standard" ||
      maxImagePreview === "large"
    ) {
      robots.maxImagePreview = maxImagePreview;
    }
    if (Object.keys(robots).length) normalized.robots = robots;
  }

  const geoSource =
    source.geo && typeof source.geo === "object"
      ? (source.geo as Record<string, any>)
      : null;
  if (geoSource) {
    const geo: SeoSettings["geo"] = {};
    const city = toNonEmptyText(geoSource.city);
    const state = toNonEmptyText(geoSource.state);
    const country = toNonEmptyText(geoSource.country);
    if (city) geo.city = city;
    if (state) geo.state = state;
    if (country) geo.country = country;
    if (Object.keys(geo).length) normalized.geo = geo;
  }

  return normalized;
};

const mergeSeo = (base: SeoSettings, override: SeoSettings): SeoSettings => ({
  ...base,
  ...override,
  robots: {
    ...(base.robots || {}),
    ...(override.robots || {}),
  },
  openGraph: {
    ...(base.openGraph || {}),
    ...(override.openGraph || {}),
  },
  twitter: {
    ...(base.twitter || {}),
    ...(override.twitter || {}),
  },
  geo: {
    ...(base.geo || {}),
    ...(override.geo || {}),
  },
});

const resolveCanonicalUrl = (
  canonicalPath: string | undefined,
  origin: string,
  fallbackUrl: string,
) => {
  if (!canonicalPath) return fallbackUrl;
  try {
    return new URL(canonicalPath, origin).toString();
  } catch {
    return fallbackUrl;
  }
};

const appendLocationToDescription = (description: string, location: string) => {
  const desc = toMetaText(description);
  const loc = toMetaText(location);
  if (!desc) return "";
  if (!loc) return truncate(desc);
  if (desc.toLowerCase().includes(loc.toLowerCase())) return truncate(desc);
  return truncate(`${desc} Location: ${loc}.`);
};

const resolveSeoImage = (
  seo: SeoSettings,
  origin: string,
  fallbackImage?: string,
) => {
  const candidate =
    seo.image ||
    seo.openGraph?.image ||
    seo.twitter?.image ||
    fallbackImage ||
    "";
  if (!candidate) return "";
  try {
    return new URL(candidate, origin).toString();
  } catch {
    return candidate;
  }
};

const resolveAbsoluteUrl = (candidate: string | undefined, origin: string) => {
  const value = toMetaText(candidate);
  if (!value) return "";
  try {
    return new URL(value, origin).toString();
  } catch {
    return value;
  }
};

const resolveRobotsMetadata = (robots: SeoSettings["robots"]) => {
  if (!robots || !Object.keys(robots).length) return undefined;
  return {
    index: robots.index,
    follow: robots.follow,
    noarchive: robots.noarchive,
    nosnippet: robots.nosnippet,
    noimageindex: robots.noimageindex,
    maxSnippet: robots.maxSnippet,
    maxImagePreview: robots.maxImagePreview,
    maxVideoPreview: robots.maxVideoPreview,
  };
};

type OpenGraphType =
  | "article"
  | "website"
  | "book"
  | "profile"
  | "music.song"
  | "music.album"
  | "music.playlist"
  | "music.radio_station"
  | "video.movie"
  | "video.episode"
  | "video.tv_show"
  | "video.other";

const resolveOpenGraphType = (value: string | undefined): OpenGraphType => {
  const normalized = toMetaText(value) as OpenGraphType;
  switch (normalized) {
    case "article":
    case "website":
    case "book":
    case "profile":
    case "music.song":
    case "music.album":
    case "music.playlist":
    case "music.radio_station":
    case "video.movie":
    case "video.episode":
    case "video.tv_show":
    case "video.other":
      return normalized;
    default:
      return "website";
  }
};

const generateLetterFaviconDataUrl = (siteName: string) => {
  const firstLetter = (siteName || "S").trim().charAt(0).toUpperCase() || "S";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#000"/><text x="32" y="32" fill="#fff" font-family="Arial, sans-serif" font-size="37" font-weight="500" text-anchor="middle" dominant-baseline="central">${firstLetter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const resolveEventLocation = (eventData: Record<string, any> | null | undefined) => {
  if (!eventData) return "";

  const rawLocation = eventData.location || eventData.eventLocation;
  if (typeof rawLocation === "string" && rawLocation.trim()) {
    return toMetaText(rawLocation);
  }

  if (rawLocation && typeof rawLocation === "object") {
    const locationObject = rawLocation as Record<string, unknown>;
    const objectParts = uniqueTexts(
      [
        firstMetaText(locationObject.venue, locationObject.name),
        firstMetaText(locationObject.city),
        firstMetaText(locationObject.state, locationObject.region, locationObject.province),
        firstMetaText(locationObject.country),
      ].filter(Boolean),
    );
    if (objectParts.length) {
      return objectParts.join(", ");
    }
  }

  const fallbackParts = uniqueTexts(
    [
      firstMetaText(eventData.venue, eventData.venueName, eventData.place),
      firstMetaText(eventData.city),
      firstMetaText(eventData.state, eventData.region, eventData.province),
      firstMetaText(eventData.country),
    ].filter(Boolean),
  );
  return fallbackParts.join(", ");
};

const resolveRecordImage = (
  target: Record<string, any> | null | undefined,
  origin: string,
) => {
  if (!target) return "";

  const imageCandidates = [
    target.imageUrl,
    target.image,
    target.bannerUrl,
    target.coverImageUrl,
    target.thumbnail,
    target.poster,
    target.photoUrl,
  ];
  const firstDirect = imageCandidates.find(
    (item) => typeof item === "string" && item.trim(),
  );
  if (typeof firstDirect === "string" && firstDirect.trim()) {
    try {
      return new URL(firstDirect, origin).toString();
    } catch {
      return firstDirect;
    }
  }

  const listCandidates = [target.images, target.media, target.gallery];
  for (const list of listCandidates) {
    if (!Array.isArray(list) || !list.length) continue;
    const first = list[0];
    if (typeof first === "string" && first.trim()) {
      try {
        return new URL(first, origin).toString();
      } catch {
        return first;
      }
    }
    if (
      first &&
      typeof first === "object" &&
      typeof first.url === "string" &&
      first.url.trim()
    ) {
      try {
        return new URL(first.url, origin).toString();
      } catch {
        return first.url;
      }
    }
  }

  return "";
};

const buildMetadata = ({
  title,
  description,
  image,
  icon,
  siteName,
  url,
  keywords,
  seo,
}: {
  title: string;
  description: string;
  image?: string;
  icon?: string;
  siteName: string;
  url: string;
  keywords?: string[];
  seo?: SeoSettings;
}): Metadata => ({
  title,
  description: description || undefined,
  keywords: keywords?.length ? keywords : undefined,
  authors: seo?.authors?.length
    ? seo.authors.map((name) => ({ name }))
    : undefined,
  category: seo?.category || undefined,
  applicationName: seo?.applicationName || undefined,
  themeColor: seo?.themeColor || undefined,
  robots: resolveRobotsMetadata(seo?.robots),
  icons: icon
    ? {
        icon: [{ url: icon }],
        shortcut: [{ url: icon }],
        apple: [{ url: icon }],
      }
    : undefined,
  openGraph: {
    type: resolveOpenGraphType(seo?.openGraph?.type),
    title: seo?.openGraph?.title || title,
    description: seo?.openGraph?.description || description || undefined,
    siteName: seo?.openGraph?.siteName || seo?.brandName || siteName,
    locale: seo?.locale || undefined,
    url: seo?.openGraph?.url || url,
    images: image
      ? [
          {
            url: image,
            alt: seo?.openGraph?.imageAlt || undefined,
          },
        ]
      : undefined,
  },
  twitter: {
    card:
      seo?.twitter?.card || (image ? "summary_large_image" : "summary"),
    title: seo?.twitter?.title || title,
    description: seo?.twitter?.description || description || undefined,
    site: seo?.twitter?.site || undefined,
    creator: seo?.twitter?.creator || undefined,
    images: image ? [image] : undefined,
  },
  alternates: { canonical: url },
});

const resolveDefaultPage = (site: {
  defaultPage?: string;
  pages: Array<{ id: string; title: string }>;
}) => (site.defaultPage && site.pages.find((page) => page.id === site.defaultPage)) || site.pages[0] || null;

const getHostFromHeaders = async () => {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-host") || headerStore.get("host");
};

const parseRoute = (path: string) => {
  const eventMatch = path.match(/^event\/([^/]+)$/);
  const merchMatch = path.match(/^merch\/([^/]+)$/);
  return {
    eventId: eventMatch ? eventMatch[1] : null,
    merchId: merchMatch ? merchMatch[1] : null,
  };
};

const loadSiteData = async (props: PageProps) => {
  const routeParams = await props.params;
  const query = await props.searchParams;
  const host = await getHostFromHeaders();
  const domainParam =
    typeof query.domain === "string" ? query.domain : undefined;
  const domain = resolveDomain(host, domainParam);
  const path = (routeParams.slug || []).join("/");
  const { eventId, merchId } = parseRoute(path);

  if (!domain) {
    return {
      domain: "",
      path,
      eventId,
      merchId,
      site: null,
      isEventShortURL: false,
    };
  }

  const siteResponse = await sitesAPI.getSiteByDomain(domain);
  if (!siteResponse.success || !siteResponse.data) {
    return {
      domain,
      path,
      eventId,
      merchId,
      site: null,
      isEventShortURL: false,
    };
  }

  const site = siteResponse.data;
  let isEventShortURL = false;
  let shortUrlEventData: Record<string, any> | null = null;
  let initialEventData: Record<string, any> | null = null;
  let initialMerchData: Record<string, any> | null = null;

  if (path && !eventId && !merchId) {
    const pathSlug = path.toLowerCase();
    const pageBySlug = site.pages.find(
      (page) => slugify(page.title) === pathSlug,
    );
    const pageById = site.pages.find((page) => page.id === path);

    if (!pageBySlug && !pageById) {
      try {
        const eventResponse = await eventsAPI.getEventByShortURL(path);
        if (
          eventResponse.success &&
          eventResponse.data?.event &&
          eventResponse.data.event.userID === site.userId
        ) {
          isEventShortURL = true;
          shortUrlEventData = {
            id: eventResponse.data.event.id,
            ...eventResponse.data.event,
          };
        }
      } catch {
        isEventShortURL = false;
      }
    }
  }

  const currentPage = resolveCurrentPage({
    site,
    path,
    eventId,
    merchId,
    isEventShortURL,
  });

  if (eventId) {
    try {
      const eventResponse = await eventsAPI.getSingleEvent(eventId);
      const sameOwner =
        eventResponse?.data?.event?.userID !== undefined &&
        String(eventResponse.data.event.userID) === String(site.userId);
      if (eventResponse.success && eventResponse.data?.event && sameOwner) {
        initialEventData = { id: eventId, ...eventResponse.data.event };
      }
    } catch {
      initialEventData = null;
    }
  } else if (isEventShortURL && shortUrlEventData) {
    initialEventData = shortUrlEventData;
  }

  if (merchId) {
    try {
      const merchResponse = await merchAPI.getSingleMerch(merchId);
      const sameOwner =
        merchResponse?.data?.userID !== undefined &&
        String(merchResponse.data.userID) === String(site.userId);
      if (merchResponse.success && merchResponse.data && sameOwner) {
        initialMerchData = merchResponse.data;
      }
    } catch {
      initialMerchData = null;
    }
  }

  return {
    domain,
    path,
    eventId,
    merchId,
    site,
    isEventShortURL,
    currentPage,
    initialEventData,
    initialMerchData,
  };
};

const resolvePageSeoSettings = (data: Awaited<ReturnType<typeof loadSiteData>>) => {
  const seoMap =
    data.site && data.site.seo && typeof data.site.seo === "object"
      ? data.site.seo
      : {};
  if (!data.currentPage || !seoMap) return {};
  return normalizeSeo((seoMap as Record<string, unknown>)[data.currentPage.id]);
};

const buildJsonLdScript = (jsonLd: string | undefined) => {
  if (!jsonLd) return "";
  try {
    const parsed = JSON.parse(jsonLd);
    return JSON.stringify(parsed);
  } catch {
    return "";
  }
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  try {
    const data = await loadSiteData(props);
    if (!data.site) {
      return {
        title: "Site Not Found",
        description: "The requested site was not found.",
      };
    }

    const siteName = data.site.name?.trim() || "Site";
    const siteDescription = toMetaText(data.site.description);
    const origin = data.domain.startsWith("http")
      ? data.domain
      : `https://${data.domain}`;
    const siteIcon =
      resolveAbsoluteUrl(data.site.faviconUrl, origin) ||
      generateLetterFaviconDataUrl(siteName);
    const path = data.path ? `/${data.path}` : "";
    const pageUrl = `${origin}${path}`;
    const fallbackImage = resolveMetaImage(
      data.site,
      data.currentPage || null,
      origin,
    );

    const defaultPage = resolveDefaultPage(data.site);
    const isDefaultPage =
      !!defaultPage &&
      !!data.currentPage &&
      String(defaultPage.id) === String(data.currentPage.id) &&
      !data.initialEventData &&
      !data.initialMerchData;

    if (data.initialEventData) {
      const eventTitle =
        toMetaText(data.initialEventData.title) ||
        toMetaText(data.initialEventData.name) ||
        toMetaText(data.initialEventData.eventTitle) ||
        "Event";
      const eventLocation = resolveEventLocation(data.initialEventData);
      const eventCityOrLocation =
        firstMetaText(data.initialEventData.city) ||
        firstMetaText(data.initialEventData.locationCity) ||
        eventLocation;

      const eventBaseDescription =
        toMetaText(data.initialEventData.description) ||
        toMetaText(data.initialEventData.shortDescription) ||
        siteDescription ||
        eventTitle;
      const fallbackEventDescription = appendLocationToDescription(
        eventBaseDescription,
        eventLocation,
      );

      const eventKeywords = uniqueTexts(
        [
          eventTitle,
          eventCityOrLocation
            ? `${eventTitle} in ${eventCityOrLocation}`
            : "",
          `${eventTitle} tickets`,
          eventCityOrLocation ? `events in ${eventCityOrLocation}` : "",
          eventLocation ? `${eventTitle} ${eventLocation}` : "",
          siteName,
        ].filter(Boolean),
      );
      const eventSeoDefaults: SeoSettings = {
        title: eventTitle,
        description: fallbackEventDescription,
        brandName: siteName,
        locale: "en_US",
        keywords: eventKeywords,
        geo: {
          city: firstMetaText(data.initialEventData.city, data.initialEventData.locationCity),
          state: firstMetaText(data.initialEventData.state, data.initialEventData.region),
          country: firstMetaText(data.initialEventData.country),
        },
        openGraph: {
          title: eventTitle,
          description: fallbackEventDescription,
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: eventTitle,
          description: fallbackEventDescription,
        },
      };
      const eventSeo = mergeSeo(
        eventSeoDefaults,
        normalizeSeo(data.initialEventData.seo),
      );
      const eventDescription = appendLocationToDescription(
        eventSeo.description || fallbackEventDescription,
        eventLocation,
      );
      const eventImage = resolveSeoImage(
        eventSeo,
        origin,
        resolveRecordImage(data.initialEventData, origin) || fallbackImage,
      );
      const canonicalUrl = resolveCanonicalUrl(
        eventSeo.canonicalPath,
        origin,
        pageUrl,
      );
      const keywords = uniqueTexts([
        ...(eventSeo.keywords || []),
        ...(eventSeo.focusKeyword ? [eventSeo.focusKeyword] : []),
        ...eventKeywords,
      ]);

      return buildMetadata({
        title: eventSeo.title || eventTitle,
        description: eventDescription,
        image: eventImage || undefined,
        icon: siteIcon,
        siteName: eventSeo.brandName || siteName,
        url: canonicalUrl,
        keywords,
        seo: eventSeo,
      });
    }

    if (data.initialMerchData) {
      const merchTitle =
        toMetaText(data.initialMerchData.title) ||
        toMetaText(data.initialMerchData.name) ||
        "Merch";
      const merchDescription = truncate(
        toMetaText(data.initialMerchData.description) ||
          toMetaText(data.initialMerchData.shortDescription) ||
          siteDescription ||
          `Shop ${siteName} merch`,
      );
      const merchSeoDefaults: SeoSettings = {
        title: merchTitle,
        description: merchDescription,
        brandName: siteName,
        locale: "en_US",
        openGraph: {
          title: merchTitle,
          description: merchDescription,
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: merchTitle,
          description: merchDescription,
        },
      };
      const merchSeo = mergeSeo(
        merchSeoDefaults,
        normalizeSeo(data.initialMerchData.seo),
      );
      const merchImage = resolveSeoImage(
        merchSeo,
        origin,
        resolveRecordImage(data.initialMerchData, origin) || fallbackImage,
      );
      const canonicalUrl = resolveCanonicalUrl(
        merchSeo.canonicalPath,
        origin,
        pageUrl,
      );

      return buildMetadata({
        title: merchSeo.title || merchTitle,
        description: merchSeo.description || merchDescription,
        image: merchImage || undefined,
        icon: siteIcon,
        siteName: merchSeo.brandName || siteName,
        url: canonicalUrl,
        keywords: uniqueTexts([
          ...(merchSeo.keywords || []),
          ...(merchSeo.focusKeyword ? [merchSeo.focusKeyword] : []),
        ]),
        seo: merchSeo,
      });
    }

    const pageTitle = toMetaText(data.currentPage?.title);
    const fallbackPageDescription = truncate(
      toMetaText((data.currentPage as any)?.description) ||
        siteDescription ||
        `${siteName} website`,
    );
    const fallbackTitle = isDefaultPage ? siteName : pageTitle || siteName;
    const pageSeoDefaults: SeoSettings = {
      title: fallbackTitle,
      description: fallbackPageDescription,
      brandName: siteName,
      locale: "en_US",
      openGraph: {
        title: fallbackTitle,
        description: fallbackPageDescription,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackPageDescription,
      },
    };
    const pageSeo = mergeSeo(
      pageSeoDefaults,
      resolvePageSeoSettings(data),
    );
    const finalImage = resolveSeoImage(pageSeo, origin, fallbackImage);
    const canonicalUrl = resolveCanonicalUrl(
      pageSeo.canonicalPath,
      origin,
      pageUrl,
    );
    const keywords = uniqueTexts([
      ...(pageSeo.keywords || []),
      ...(pageSeo.focusKeyword ? [pageSeo.focusKeyword] : []),
      pageTitle,
      siteName,
    ].filter(Boolean) as string[]);

    return buildMetadata({
      title: pageSeo.title || fallbackTitle,
      description: pageSeo.description || fallbackPageDescription,
      image: finalImage || undefined,
      icon: siteIcon,
      siteName: pageSeo.brandName || siteName,
      url: canonicalUrl,
      keywords,
      seo: pageSeo,
    });
  } catch {
    return {
      title: "Site",
      description: "Troop site",
    };
  }
}

export default async function SitePage(props: PageProps) {
  const data = await loadSiteData(props);

  if (!data.site) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-700">
            Site Not Found
          </h2>
          <p className="text-gray-500">
            The site you&apos;re looking for doesn&apos;t exist or isn&apos;t
            published.
          </p>
        </div>
      </div>
    );
  }

  const defaultPage =
    (data.site.defaultPage && data.site.pages.find((page) => page.id === data.site.defaultPage)) ||
    data.site.pages[0] ||
    null;
  const defaultSlug = defaultPage ? slugify(defaultPage.title) : "";
  const isDefaultPageRoute =
    !!data.path &&
    !data.eventId &&
    !data.merchId &&
    !!defaultPage &&
    (data.path === defaultSlug || data.path === defaultPage.id);

  if (isDefaultPageRoute) {
    redirect("/");
  }

  const activeSeo = data.initialEventData
    ? normalizeSeo(data.initialEventData.seo)
    : data.initialMerchData
      ? normalizeSeo(data.initialMerchData.seo)
      : resolvePageSeoSettings(data);
  const jsonLd = buildJsonLdScript(activeSeo.jsonLd);

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      ) : null}
      <SitePageShell
        site={data.site}
        currentPage={data.currentPage || null}
        eventId={data.eventId}
        merchId={data.merchId}
        initialEventData={data.initialEventData}
        initialMerchData={data.initialMerchData}
      />
    </>
  );
}
