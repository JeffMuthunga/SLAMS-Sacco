/**
 * Organization branding for exports, print headers, and reports.
 * Static fallbacks are used until live org data loads via setBranding().
 * BrandingProvider calls setBranding() on mount so all exports reflect
 * the current org's real details.
 */

export interface BrandingConfig {
  orgName: string;
  systemName: string;
  addressLines: string[];
  email: string;
  website: string;
  phone: string;
  tollFree: string;
  logoPath: string;
  locale: string;
}

const DEFAULTS: BrandingConfig = {
  orgName: "SACCO",
  systemName: "SACCO Management System",
  addressLines: ["Kenya"],
  email: "",
  website: "",
  phone: "",
  tollFree: "",
  logoPath: "/images/logo/logo-dark.svg",
  locale: "en-KE",
};

let _live: BrandingConfig = { ...DEFAULTS };

export function setBranding(partial: Partial<BrandingConfig>): void {
  _live = { ..._live, ...partial };
}

export function getBranding(): BrandingConfig {
  return _live;
}

/** Static export kept for legacy imports — always returns the live value. */
export const BRANDING: BrandingConfig = new Proxy({} as BrandingConfig, {
  get(_t, prop: string) {
    return _live[prop as keyof BrandingConfig];
  },
});
