const EBAY_IMAGE_HOSTS = /(^|\.)(ebayimg\.com|ebaystatic\.com)$/i;

export function isEbayImageHost(hostname: string) {
  return EBAY_IMAGE_HOSTS.test(hostname);
}

export function listingPhotoSrc(url?: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    const href = parsed.toString();
    if (isEbayImageHost(parsed.hostname)) {
      return `/api/ebay/image?u=${encodeURIComponent(href)}`;
    }
    return href;
  } catch {
    return "";
  }
}
