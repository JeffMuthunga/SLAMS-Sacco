"use client";

import { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface OrgBranding {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

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

function useOrgBrandingData() {
  return useQuery<OrgBranding>({
    queryKey: ["org-branding"],
    queryFn: async () => {
      const { data } = await api.get<{ data: OrgBranding }>("/org/branding");
      return data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data: branding } = useOrgBrandingData();

  useEffect(() => {
    if (branding?.primary_color) {
      document.documentElement.style.setProperty("--color-primary", branding.primary_color);
    }
    if (branding?.secondary_color) {
      document.documentElement.style.setProperty("--color-secondary", branding.secondary_color);
    }
  }, [branding?.primary_color, branding?.secondary_color]);

  return (
    <BrandingContext.Provider
      value={{
        logoUrl: branding?.logo_url ?? null,
        orgName: branding?.name ?? null,
        primaryColor: branding?.primary_color ?? null,
        secondaryColor: branding?.secondary_color ?? null,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useOrgBranding() {
  return useContext(BrandingContext);
}
