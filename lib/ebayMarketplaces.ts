export const EBAY_SELL_SITES = [
  { id: "EBAY_CA", label: "Canada (ebay.ca)", currency: "CAD", host: "https://www.ebay.ca", locale: "en-CA" },
  { id: "EBAY_US", label: "United States (ebay.com)", currency: "USD", host: "https://www.ebay.com", locale: "en-US" },
  { id: "EBAY_GB", label: "United Kingdom (ebay.co.uk)", currency: "GBP", host: "https://www.ebay.co.uk", locale: "en-GB" },
  { id: "EBAY_AU", label: "Australia (ebay.com.au)", currency: "AUD", host: "https://www.ebay.com.au", locale: "en-AU" },
  { id: "EBAY_DE", label: "Germany (ebay.de)", currency: "EUR", host: "https://www.ebay.de", locale: "de-DE" },
  { id: "EBAY_FR", label: "France (ebay.fr)", currency: "EUR", host: "https://www.ebay.fr", locale: "fr-FR" },
  { id: "EBAY_IT", label: "Italy (ebay.it)", currency: "EUR", host: "https://www.ebay.it", locale: "it-IT" },
  { id: "EBAY_ES", label: "Spain (ebay.es)", currency: "EUR", host: "https://www.ebay.es", locale: "es-ES" },
] as const;

export type EbaySellSiteId = (typeof EBAY_SELL_SITES)[number]["id"];

export function isEbaySellSite(value: string | undefined): value is EbaySellSiteId {
  return Boolean(value && EBAY_SELL_SITES.some((site) => site.id === value));
}

export function ebaySellSite(id: string) {
  return EBAY_SELL_SITES.find((site) => site.id === id) ?? EBAY_SELL_SITES[0];
}
