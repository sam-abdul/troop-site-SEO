import React, { createContext, useContext, useEffect, useState } from "react";
import { eventsAPI } from "../services/eventsAPI";
import { merchAPI } from "../services/merchAPI";

interface SiteDataContextType {
  userEvents: any[] | null;
  userMerch: any[] | null;
  loadingEvents: boolean;
  loadingMerch: boolean;
  userId: string | null;
}

const SiteDataContext = createContext<SiteDataContextType | null>(null);

export function SiteDataProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const [userEvents, setUserEvents] = useState<any[] | null>(null);
  const [userMerch, setUserMerch] = useState<any[] | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingMerch, setLoadingMerch] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      if (!userId) {
        setUserEvents(null);
        return;
      }

      try {
        setLoadingEvents(true);
        const evRes = await eventsAPI.getUserEvents(userId);
        const evFiltered = (evRes.data || []).filter(
          (e: any) => e.eventType === "public"
        );
        if (mounted) {
          setUserEvents(evFiltered);
        }
      } catch (error) {
        console.error("Error loading user events:", error);
        if (mounted) {
          setUserEvents([]);
        }
      } finally {
        if (mounted) {
          setLoadingEvents(false);
        }
      }
    };

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    let mounted = true;

    const loadMerch = async () => {
      if (!userId) {
        setUserMerch(null);
        return;
      }

      try {
        setLoadingMerch(true);
        const merchRes = await merchAPI.getUserMerchItems(userId);
        const merchFiltered = (merchRes.data || []).filter(
          (m: any) => m.isPublic !== false
        );
        if (mounted) {
          setUserMerch(merchFiltered);
        }
      } catch (error) {
        console.error("Error loading user merch:", error);
        if (mounted) {
          setUserMerch([]);
        }
      } finally {
        if (mounted) {
          setLoadingMerch(false);
        }
      }
    };

    loadMerch();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <SiteDataContext.Provider
      value={{
        userEvents,
        userMerch,
        loadingEvents,
        loadingMerch,
        userId,
      }}
    >
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error("useSiteData must be used within SiteDataProvider");
  }
  return context;
}
