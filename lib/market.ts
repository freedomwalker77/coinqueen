import { getItem, type CatalogItem } from "./catalog";

export type ListingKind = "buy_now" | "auction";

export type Shop = {
  slug: string;
  name: string;
  rating: number;
  reviews: number;
  blurb: string;
};

export type Listing = {
  id: string;
  catalogId: string;
  shopSlug: string;
  grade: string;
  price: number;
  kind: ListingKind;
  endsAt?: string;
  bids: number;
  note?: string;
  createdAt: string;
  seed: boolean;
};

export const MY_SHOP: Shop = {
  slug: "your-shop",
  name: "Your MyVaultExchange shop",
  rating: 5,
  reviews: 0,
  blurb: "Listings you publish from the scanner or sell page live here on this device.",
};

export const SHOPS: Shop[] = [
  {
    slug: "crown-and-die",
    name: "Crown & Die Co.",
    rating: 5,
    reviews: 64,
    blurb: "U.S. type, keys, and original-skin copper.",
  },
  {
    slug: "paper-throne",
    name: "Paper Throne Notes",
    rating: 4.9,
    reviews: 41,
    blurb: "Large-size, small-size, and world paper.",
  },
  {
    slug: "old-head-gold",
    name: "Old Head Gold",
    rating: 5,
    reviews: 28,
    blurb: "Sovereigns, eagles, and bullion with a collector tilt.",
  },
  {
    slug: "binder-queen",
    name: "Binder Queen",
    rating: 4.8,
    reviews: 19,
    blurb: "Circulated sets, wheat cents, and affordable type.",
  },
  MY_SHOP,
];

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const SEED_LISTINGS: Listing[] = [
  {
    id: "seed-vdb-vf",
    catalogId: "1909-s-vdb-lincoln-cent",
    shopSlug: "crown-and-die",
    grade: "VF-20",
    price: 995,
    kind: "buy_now",
    bids: 0,
    note: "Original brown, clear VDB and mint mark.",
    createdAt: "2026-09-01T12:00:00.000Z",
    seed: true,
  },
  {
    id: "seed-morgan-ms65",
    catalogId: "1881-s-morgan-dollar",
    shopSlug: "crown-and-die",
    grade: "MS-65",
    price: 138,
    kind: "buy_now",
    bids: 0,
    createdAt: "2026-09-03T15:00:00.000Z",
    seed: true,
  },
  {
    id: "seed-v-nickel-f",
    catalogId: "1901-liberty-head-nickel",
    shopSlug: "binder-queen",
    grade: "F-12",
    price: 0.5,
    kind: "buy_now",
    bids: 0,
    note: "Full date, even wear, typical gray nickel surfaces.",
    createdAt: "2026-09-06T18:00:00.000Z",
    seed: true,
  },
  {
    id: "seed-black-eagle-vf",
    catalogId: "1899-black-eagle",
    shopSlug: "paper-throne",
    grade: "VF-30",
    price: 216,
    kind: "auction",
    endsAt: daysFromNow(2),
    bids: 3,
    note: "Problem-free paper, strong eagle.",
    createdAt: "2026-09-04T09:00:00.000Z",
    seed: true,
  },
  {
    id: "seed-sovereign-ef",
    catalogId: "1900-gold-sovereign",
    shopSlug: "old-head-gold",
    grade: "EF",
    price: 655,
    kind: "buy_now",
    bids: 0,
    createdAt: "2026-09-02T18:00:00.000Z",
    seed: true,
  },
  {
    id: "seed-kennedy-bu",
    catalogId: "1964-kennedy-half",
    shopSlug: "binder-queen",
    grade: "MS-63",
    price: 14.5,
    kind: "buy_now",
    bids: 0,
    createdAt: "2026-09-05T11:00:00.000Z",
    seed: true,
  },
  {
    id: "seed-mercury-g",
    catalogId: "1916-d-mercury-dime",
    shopSlug: "crown-and-die",
    grade: "G-4",
    price: 1450,
    kind: "auction",
    endsAt: daysFromNow(1),
    bids: 6,
    createdAt: "2026-09-05T20:00:00.000Z",
    seed: true,
  },
  {
    id: "seed-silver-cert",
    catalogId: "1935a-silver-certificate",
    shopSlug: "paper-throne",
    grade: "EF",
    price: 12,
    kind: "buy_now",
    bids: 0,
    createdAt: "2026-09-06T08:00:00.000Z",
    seed: true,
  },
  {
    id: "seed-hadrian",
    catalogId: "hadrian-denarius",
    shopSlug: "old-head-gold",
    grade: "VF",
    price: 110,
    kind: "buy_now",
    bids: 0,
    note: "Clear portrait, typical bankers’ marks.",
    createdAt: "2026-08-28T10:00:00.000Z",
    seed: true,
  },
  {
    id: "seed-peace-au",
    catalogId: "1921-peace-dollar",
    shopSlug: "binder-queen",
    grade: "AU-50",
    price: 165,
    kind: "auction",
    endsAt: daysFromNow(4),
    bids: 1,
    createdAt: "2026-09-06T14:00:00.000Z",
    seed: true,
  },
  {
    id: "seed-gold-cert",
    catalogId: "1934-hundred-gold-cert",
    shopSlug: "paper-throne",
    grade: "VF-20",
    price: 410,
    kind: "buy_now",
    bids: 0,
    createdAt: "2026-09-01T16:00:00.000Z",
    seed: true,
  },
];

export function shopFromAccount(name: string, slug: string): Shop {
  return {
    slug,
    name: `${name}'s shop`,
    rating: 5,
    reviews: 0,
    blurb: "Collector shop on MyVaultExchange.",
  };
}

export function getShop(slug: string) {
  const known = SHOPS.find((shop) => shop.slug === slug);
  if (known) return known;
  if (!slug) return undefined;
  const label = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return {
    slug,
    name: slug === MY_SHOP.slug ? MY_SHOP.name : `${label}`,
    rating: 5,
    reviews: 0,
    blurb: "Collector shop on MyVaultExchange.",
  };
}

export function listingWithItem(listing: Listing): (Listing & { item: CatalogItem }) | null {
  const item = getItem(listing.catalogId);
  if (!item) return null;
  return { ...listing, item };
}

export function seedListingsForItem(catalogId: string) {
  return SEED_LISTINGS.filter((row) => row.catalogId === catalogId);
}

export function seedListingsForShop(slug: string) {
  return SEED_LISTINGS.filter((row) => row.shopSlug === slug);
}
