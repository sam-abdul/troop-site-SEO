"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, ChevronLeftCircleIcon } from "lucide-react";

export default function CheckOutPendingPage() {
  const routeParams = useParams<{ id?: string | string[] }>();
  const routeId = useMemo(() => {
    const raw = routeParams?.id;
    if (Array.isArray(raw)) return raw[0] || "";
    return raw || "";
  }, [routeParams]);
  const backHref = routeId ? `/event/${routeId}` : "/";

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
              Registration Submitted
            </h3>
            <p style={{ margin: 20 }}>
              Your registration has been submitted. After the organizer approval, you&apos;ll receive your ticket.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-center gap-5 max-md:flex-col">
          <Link className="text-black text-center" href={backHref}>
            <p className="flex items-center justify-center gap-2">
              <ChevronLeftCircleIcon strokeWidth={3} size={19} />
              <b>Back to event</b>
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
