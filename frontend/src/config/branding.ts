/**
 * Organization branding used by exports, print headers, and reports.
 * In the multi-tenant build this becomes per-org data served by the API;
 * until then it is the single configured SACCO.
 */
export const BRANDING = {
  orgName: "SLAMS SACCO",
  systemName: "SLAMS SACCO Management System",
  addressLines: ["P.O. Box 00000", "Nairobi, Kenya"],
  email: "info@slamssacco.co.ke",
  website: "www.slamssacco.co.ke",
  phone: "+254 700 000 000",
  tollFree: "",
  /** Used in print/PDF headers. PNG/JPG render in PDFs; SVG only in print HTML. */
  logoPath: "/images/logo/logo-dark.svg",
  locale: "en-KE",
};
