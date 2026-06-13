"use client";

import { createContext, useContext, useEffect } from "react";
import { useOrg } from "@/lib/api/configurations";

interface BrandingCtx {
  logoUrl: string | null;
  orgName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

const BrandingContext = createContext<BrandingCtx>({
  logoUrl: null,
  orgName: null,
  primaryColor: null,
  secondaryColor: null,
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data: org } = useOrg();

  useEffect(() => {
    if (org?.primary_color) {
      document.documentElement.style.setProperty("--color-primary", org.primary_color);
    }
    if (org?.secondary_color) {
      document.documentElement.style.setProperty("--color-secondary", org.secondary_color);
    }
  }, [org?.primary_color, org?.secondary_color]);

  return (
    <BrandingContext.Provider
      value={{
        logoUrl: org?.logo_url ?? null,
        orgName: org?.name ?? null,
        primaryColor: org?.primary_color ?? null,
        secondaryColor: org?.secondary_color ?? null,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useOrgBranding() {
  return useContext(BrandingContext);
}
