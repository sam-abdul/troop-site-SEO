import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SitePageShell } from "@/components/SitePageShell";
import { eventsAPI } from "@/services/eventsAPI";
import { merchAPI } from "@/services/merchAPI";
import { sitesAPI } from "@/services/sitesAPI";
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
}: {
  title: string;
  description: string;
  image?: string;
  icon?: string;
  siteName: string;
  url: string;
  keywords?: string[];
}): Metadata => ({
  title,
  description: description || undefined,
  keywords: keywords?.length ? keywords : undefined,
  icons: icon
    ? {
        icon: [{ url: icon, type: "image/svg+xml" }],
        shortcut: [{ url: icon, type: "image/svg+xml" }],
        apple: [{ url: icon, type: "image/svg+xml" }],
      }
    : undefined,
  openGraph: {
    type: "website",
    title,
    description: description || undefined,
    siteName,
    url,
    images: image ? [{ url: image }] : undefined,
  },
  twitter: {
    card: image ? "summary_large_image" : "summary",
    title,
    description: description || undefined,
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
    const siteIcon = generateLetterFaviconDataUrl(siteName);
    const origin = data.domain.startsWith("http")
      ? data.domain
      : `https://${data.domain}`;
    const path = data.path ? `/${data.path}` : "";
    const url = `${origin}${path}`;
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
      const eventDescription =
        eventLocation && !eventBaseDescription.toLowerCase().includes(eventLocation.toLowerCase())
          ? truncate(`${eventBaseDescription} Location: ${eventLocation}.`)
          : truncate(eventBaseDescription);

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
      const eventImage =
        resolveRecordImage(data.initialEventData, origin) || fallbackImage;

      return buildMetadata({
        title: eventTitle,
        description: eventDescription,
        image: eventImage || undefined,
        icon: siteIcon,
        siteName,
        url,
        keywords: eventKeywords,
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
      const merchImage =
        resolveRecordImage(data.initialMerchData, origin) || fallbackImage;

      return buildMetadata({
        title: merchTitle,
        description: merchDescription,
        image: merchImage || undefined,
        icon: siteIcon,
        siteName,
        url,
      });
    }

    const pageTitle = toMetaText(data.currentPage?.title);
    const pageDescription = truncate(
      toMetaText((data.currentPage as any)?.description) ||
        siteDescription ||
        `${siteName} website`,
    );
    const finalTitle = isDefaultPage ? siteName : pageTitle || siteName;

    return buildMetadata({
      title: finalTitle,
      description: pageDescription,
      image: fallbackImage || undefined,
      icon: siteIcon,
      siteName,
      url,
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

  return (
    <SitePageShell
      site={data.site}
      currentPage={data.currentPage || null}
      eventId={data.eventId}
      merchId={data.merchId}
      initialEventData={data.initialEventData}
      initialMerchData={data.initialMerchData}
    />
  );
}
