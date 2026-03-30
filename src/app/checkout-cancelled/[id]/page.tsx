"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronLeftCircleIcon, XCircleIcon } from "lucide-react";

export default function CheckOutCancelledPage() {
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
              <XCircleIcon className="text-red-500" size={70} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: "bold", marginTop: 20 }}>
              {isMerch ? "Merch Purchase Cancelled" : "Ticket Purchase Cancelled"}
            </h3>
            <p style={{ margin: 20 }}>
              {isMerch
                ? "The payment process for your merch was canceled. To purchase a merch, go back to the merch and try again."
                : "The payment process for your event was canceled. To purchase a ticket, go back to the event and try again."}
            </p>
          </div>
        </div>
        <div className="mt-5">
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
