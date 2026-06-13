"use client";

import { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { setBranding } from "@/config/branding";

interface OrgBranding {
  name: string;
  full_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  town: string | null;
  country_code: string | null;
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
  const { data: b } = useOrgBrandingData();

  useEffect(() => {
    if (!b) return;

    if (b.primary_color) {
      document.documentElement.style.setProperty("--color-primary", b.primary_color);
    }
    if (b.secondary_color) {
      document.documentElement.style.setProperty("--color-secondary", b.secondary_color);
    }

    // Feed the export/print singleton so DataTable PDFs show live org details
    const addressLines: string[] = [];
    if (b.address) addressLines.push(b.address);
    if (b.town) addressLines.push(b.town);
    if (b.country_code) addressLines.push(b.country_code);

    setBranding({
      orgName: b.name ?? undefined,
      systemName: b.full_name ? `${b.full_name} — Management System` : undefined,
      addressLines: addressLines.length ? addressLines : undefined,
      email: b.email ?? undefined,
      phone: b.phone ?? undefined,
      website: b.website ?? undefined,
      ...(b.logo_url ? { logoPath: b.logo_url } : {}),
    });
  }, [b]);

  return (
    <BrandingContext.Provider
      value={{
        logoUrl: b?.logo_url ?? null,
        orgName: b?.name ?? null,
        primaryColor: b?.primary_color ?? null,
        secondaryColor: b?.secondary_color ?? null,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useOrgBranding() {
  return useContext(BrandingContext);
}
