"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/context/AuthContext";
import dynamic from "next/dynamic";

const libraries: ("places")[] = ["places"];
const LoadScriptNoSSR = dynamic(
  () => import("@react-google-maps/api").then((mod) => mod.LoadScript),
  { ssr: false },
);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const appContent = (
    <AuthProvider>
      <Toaster
        containerStyle={{ zIndex: 999999999999999 }}
        containerClassName="!z-[999999999999999] font-[poppins]"
      />
      {children}
    </AuthProvider>
  );

  if (!mapsApiKey) {
    return appContent;
  }

  return (
    <LoadScriptNoSSR
      id="troop-google-maps-script"
      googleMapsApiKey={mapsApiKey}
      libraries={libraries}
      loadingElement={<></>}
    >
      {appContent}
    </LoadScriptNoSSR>
  );
}
