import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyVaultExchange",
    short_name: "MyVault",
    description: "Scan coins and paper money, then price them from eBay last sold and Heritage Auctions.",
    start_url: "/scan",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a7a46",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
