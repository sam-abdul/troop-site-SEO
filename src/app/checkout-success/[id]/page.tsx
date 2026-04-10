"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronLeftCircleIcon } from "lucide-react";
import { trackTrafficEvent } from "@/services/trafficAPI";

export default function CheckOutSuccessPage() {
  const searchParams = useSearchParams();
  const routeParams = useParams<{ id?: string | string[] }>();
  const routeId = useMemo(() => {
    const raw = routeParams?.id;
    if (Array.isArray(raw)) return raw[0] || "";
    return raw || "";
  }, [routeParams]);
  const isMerch = useMemo(() => searchParams?.get("type") === "merch", [searchParams]);
  const backHref = isMerch
    ? routeId
      ? `/merch/${routeId}`
      : "/"
    : routeId
      ? `/event/${routeId}`
      : "/";

  useEffect(() => {
    if (typeof window === "undefined") return;

    trackTrafficEvent({
      domain: window.location.host,
      eventType: "checkout_success",
      path: window.location.pathname,
      pageType: "checkout_success",
      entityType: isMerch ? "merch" : "event",
      entityId: routeId || undefined,
      referrer: document.referrer || "",
    });
  }, [isMerch, routeId]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-5 text-center font-[poppins]">
      <div>
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              display: "grid",
              justifyContent: "center",
              maxWidth: 500,
              padding: 20,
              paddingTop: 60,
              paddingBottom: 60,
              borderRadius: 5,
            }}
            className="border border-[--border] bg-black/5"
          >
            <div className="flex justify-center">
              <CheckCircle2 className="text-green-500" size={70} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: "bold", marginTop: 20 }}>
              {isMerch ? "Merch Purchase Successful" : "Ticket Purchase Successful"}
            </h3>
            <p style={{ margin: 20 }}>
              {isMerch
                ? "Check your mail box for your merch and more info about the merch. The contact of the organizer is also included in the email."
                : "Check your mail box for your ticket QR code and more info about the event."}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-center gap-5 max-md:flex-col">
          <Link className="text-black text-center" href={backHref}>
            <p className="flex items-center justify-center gap-2">
              <ChevronLeftCircleIcon strokeWidth={3} size={19} />
              <b>{isMerch ? "Back to merch" : "Back to event"}</b>
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
