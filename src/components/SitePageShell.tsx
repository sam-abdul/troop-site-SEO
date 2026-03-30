"use client";

import React from "react";
import { Lock } from "lucide-react";
import { SiteDataProvider } from "@/context/SiteDataContext";
import { PageRendererSEO } from "@/components/PageRendererSEO";
import { AppProviders } from "@/components/AppProviders";
import type { Site, SitePage } from "@/services/sitesAPI";

const slugify = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

interface SitePageShellProps {
  site: Site;
  currentPage: SitePage | null;
  eventId?: string | null;
  merchId?: string | null;
  initialEventData?: Record<string, any> | null;
  initialMerchData?: Record<string, any> | null;
}

export function SitePageShell({
  site,
  currentPage,
  eventId,
  merchId,
  initialEventData,
  initialMerchData,
}: SitePageShellProps) {
  const defaultPage = (site.defaultPage && site.pages.find((p) => p.id === site.defaultPage)) || site.pages[0] || null;
  const defaultPageId = defaultPage?.id || null;
  const defaultPageSlug = defaultPage ? slugify(defaultPage.title) : null;

  if (site.disabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md px-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            Site temporarily unavailable
          </h2>
          <p className="text-gray-600">
            This site is currently unavailable. Contact the owner to restore access.
          </p>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-700">Page Not Found</h2>
          <p className="text-gray-500">No pages available for this site.</p>
        </div>
      </div>
    );
  }

  return (
    <SiteDataProvider userId={site.userId}>
      <AppProviders>
        <PageRendererSEO
          page={currentPage}
          pages={site.pages}
          defaultPageId={defaultPageId}
          defaultPageSlug={defaultPageSlug}
          siteId={site.id}
          eventId={eventId}
          merchId={merchId}
          initialEventData={initialEventData}
          initialMerchData={initialMerchData}
        />
      </AppProviders>
    </SiteDataProvider>
  );
}
