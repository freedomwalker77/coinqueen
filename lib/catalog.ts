export type PieceType = "coin" | "note";
export type Category =
  | "us-coins"
  | "world-coins"
  | "ancient"
  | "us-paper"
  | "world-paper";

export type Comp = {
  date: string;
  venue: string;
  grade: string;
  price: number;
  kind: "sold" | "listed";
  url?: string;
  title?: string;
  imageUrl?: string;
  seller?: string;
  details?: string;
  catalogId?: string;
};

export type GradePrice = {
  grade: string;
  price: number;
};

export type CatalogItem = {
  id: string;
  type: PieceType;
  category: Category;
  name: string;
  shortName: string;
  year: number | null;
  country: string;
  denomination: string;
  mint?: string;
  metal?: string;
  series: string;
  rarity: "common" | "scarce" | "rare" | "key";
  keywords: string[];
  description: string;
  marketLow: number;
  marketMid: number;
  marketHigh: number;
  grades: GradePrice[];
  comps: Comp[];
  population: { grade: string; count: number }[];
  accent: string;
};

export const CATEGORIES: { id: Category | "all" | PieceType; label: string }[] = [
  { id: "all", label: "All pieces" },
  { id: "coin", label: "Coins" },
  { id: "note", label: "Paper money" },
  { id: "us-coins", label: "U.S. coins" },
  { id: "world-coins", label: "World coins" },
  { id: "ancient", label: "Ancient" },
  { id: "us-paper", label: "U.S. paper" },
  { id: "world-paper", label: "World paper" },
];

export const catalog: CatalogItem[] = [
  {
    id: "1909-s-vdb-lincoln-cent",
    type: "coin",
    category: "us-coins",
    name: "1909-S VDB Lincoln Wheat Cent",
    shortName: "1909-S VDB Cent",
    year: 1909,
    country: "United States",
    denomination: "1 cent",
    mint: "San Francisco",
    metal: "Bronze",
    series: "Lincoln Wheat Cent",
    rarity: "key",
    keywords: ["lincoln", "wheat", "vdb", "penny", "key date", "san francisco"],
    description:
      "The key date of the Lincoln cent series. Victor D. Brenner’s initials on the reverse, struck only in San Francisco in 1909. Heavily counterfeited — mint mark and VDB should be authenticated.",
    marketLow: 720,
    marketMid: 1450,
    marketHigh: 9800,
    grades: [
      { grade: "G-4", price: 720 },
      { grade: "VF-20", price: 980 },
      { grade: "EF-40", price: 1250 },
      { grade: "AU-50", price: 1450 },
      { grade: "MS-63 BN", price: 2800 },
      { grade: "MS-65 RD", price: 9800 },
    ],
    comps: [
      { date: "2026-08-12", venue: "Heritage", grade: "MS-64 RB", price: 4320, kind: "sold" },
      { date: "2026-07-02", venue: "eBay", grade: "VF-20", price: 955, kind: "sold" },
      { date: "2026-06-18", venue: "GreatCollections", grade: "AU-55", price: 1680, kind: "sold" },
      { date: "2026-09-01", venue: "eBay", grade: "F-12", price: 810, kind: "listed" },
    ],
    population: [
      { grade: "Circulated", count: 18 },
      { grade: "AU", count: 6 },
      { grade: "Mint State", count: 3 },
    ],
    accent: "#c4783a",
  },
  {
    id: "1964-kennedy-half",
    type: "coin",
    category: "us-coins",
    name: "1964 Kennedy Half Dollar",
    shortName: "1964 Kennedy Half",
    year: 1964,
    country: "United States",
    denomination: "50 cents",
    mint: "Philadelphia / Denver",
    metal: "90% silver",
    series: "Kennedy Half Dollar",
    rarity: "common",
    keywords: ["kennedy", "half", "silver", "90%", "1964"],
    description:
      "First year of the Kennedy half and the only circulation year struck in 90% silver. Melt value plus collector premium. Proofs and SMS pieces bring more.",
    marketLow: 11,
    marketMid: 14.5,
    marketHigh: 85,
    grades: [
      { grade: "VF-20", price: 11 },
      { grade: "AU-50", price: 13 },
      { grade: "MS-63", price: 14.5 },
      { grade: "MS-65", price: 28 },
      { grade: "PR-69", price: 85 },
    ],
    comps: [
      { date: "2026-08-28", venue: "eBay", grade: "BU roll", price: 268, kind: "sold" },
      { date: "2026-08-04", venue: "APMEX", grade: "MS-63", price: 15.2, kind: "listed" },
      { date: "2026-07-19", venue: "eBay", grade: "AU", price: 12.5, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 42 },
      { grade: "BU", count: 21 },
    ],
    accent: "#b8b8c4",
  },
  {
    id: "1881-s-morgan-dollar",
    type: "coin",
    category: "us-coins",
    name: "1881-S Morgan Silver Dollar",
    shortName: "1881-S Morgan",
    year: 1881,
    country: "United States",
    denomination: "1 dollar",
    mint: "San Francisco",
    metal: "90% silver",
    series: "Morgan Dollar",
    rarity: "common",
    keywords: ["morgan", "dollar", "silver", "1881", "s mint"],
    description:
      "One of the most available Morgans in gem. San Francisco strikes of 1881 are famous for sharp strikes and frosty luster. A gateway Morgan for new collectors.",
    marketLow: 38,
    marketMid: 62,
    marketHigh: 420,
    grades: [
      { grade: "VF-20", price: 38 },
      { grade: "AU-50", price: 48 },
      { grade: "MS-63", price: 62 },
      { grade: "MS-65", price: 145 },
      { grade: "MS-67", price: 420 },
    ],
    comps: [
      { date: "2026-08-21", venue: "PCGS TrueView / eBay", grade: "MS-65", price: 138, kind: "sold" },
      { date: "2026-07-30", venue: "Stack’s Bowers", grade: "MS-66", price: 264, kind: "sold" },
      { date: "2026-06-11", venue: "eBay", grade: "MS-63", price: 59, kind: "sold" },
    ],
    population: [
      { grade: "AU", count: 9 },
      { grade: "MS-63–64", count: 14 },
      { grade: "MS-65+", count: 5 },
    ],
    accent: "#d7d3c8",
  },
  {
    id: "2024-american-silver-eagle",
    type: "coin",
    category: "us-coins",
    name: "2024 American Silver Eagle",
    shortName: "2024 Silver Eagle",
    year: 2024,
    country: "United States",
    denomination: "1 dollar",
    mint: "West Point",
    metal: "1 oz .999 silver",
    series: "American Silver Eagle",
    rarity: "common",
    keywords: ["ase", "eagle", "bullion", "silver", "ounce", "west point"],
    description:
      "The U.S. Mint’s flagship 1 oz silver bullion coin. Spot plus premium drives the market; Type 2 reverse (Eagle Landing) since 2021.",
    marketLow: 36,
    marketMid: 42,
    marketHigh: 78,
    grades: [
      { grade: "BU", price: 42 },
      { grade: "MS-69", price: 52 },
      { grade: "MS-70", price: 78 },
    ],
    comps: [
      { date: "2026-09-03", venue: "JM Bullion", grade: "BU", price: 41.8, kind: "listed" },
      { date: "2026-08-15", venue: "eBay", grade: "MS-70", price: 74, kind: "sold" },
    ],
    population: [
      { grade: "BU", count: 31 },
      { grade: "Graded 70", count: 8 },
    ],
    accent: "#cfd4dc",
  },
  {
    id: "1916-d-mercury-dime",
    type: "coin",
    category: "us-coins",
    name: "1916-D Mercury Dime",
    shortName: "1916-D Mercury",
    year: 1916,
    country: "United States",
    denomination: "10 cents",
    mint: "Denver",
    metal: "90% silver",
    series: "Mercury (Winged Liberty) Dime",
    rarity: "key",
    keywords: ["mercury", "dime", "1916", "denver", "winged liberty", "key"],
    description:
      "The key date of the Mercury dime. Mintage of 264,000. Full-band mint-state coins are five-figure trophies. Check the mint mark under the wreath.",
    marketLow: 980,
    marketMid: 3200,
    marketHigh: 28500,
    grades: [
      { grade: "AG-3", price: 980 },
      { grade: "G-4", price: 1450 },
      { grade: "VF-20", price: 3200 },
      { grade: "AU-50", price: 7800 },
      { grade: "MS-65 FB", price: 28500 },
    ],
    comps: [
      { date: "2026-05-22", venue: "Heritage", grade: "VF-25", price: 3480, kind: "sold" },
      { date: "2026-04-09", venue: "eBay", grade: "G-4", price: 1395, kind: "sold" },
    ],
    population: [
      { grade: "Low grade", count: 7 },
      { grade: "VF+", count: 2 },
    ],
    accent: "#9aa3ad",
  },
  {
    id: "1937-d-three-leg-buffalo",
    type: "coin",
    category: "us-coins",
    name: "1937-D Three-Legged Buffalo Nickel",
    shortName: "1937-D 3-Leg Buffalo",
    year: 1937,
    country: "United States",
    denomination: "5 cents",
    mint: "Denver",
    metal: "Copper-nickel",
    series: "Buffalo Nickel",
    rarity: "rare",
    keywords: ["buffalo", "nickel", "three leg", "3-legged", "1937", "error", "variety"],
    description:
      "Famous over-polished die variety: the bison’s front right leg is missing. Look for the extra trailing hoof and die pitting under the belly. Counterfeits are common.",
    marketLow: 420,
    marketMid: 890,
    marketHigh: 12500,
    grades: [
      { grade: "G-4", price: 420 },
      { grade: "VF-20", price: 690 },
      { grade: "EF-40", price: 890 },
      { grade: "AU-50", price: 1450 },
      { grade: "MS-64", price: 12500 },
    ],
    comps: [
      { date: "2026-07-08", venue: "Heritage", grade: "EF-45", price: 960, kind: "sold" },
      { date: "2026-03-14", venue: "eBay", grade: "F-12", price: 505, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 5 },
      { grade: "AU+", count: 1 },
    ],
    accent: "#7a6a4f",
  },
  {
    id: "1901-liberty-head-nickel",
    type: "coin",
    category: "us-coins",
    name: "1901 Liberty Head Nickel (V Nickel)",
    shortName: "Liberty Head V Nickel",
    year: 1901,
    country: "United States",
    denomination: "5 cents",
    metal: "Copper-nickel",
    series: "Liberty Head Nickel",
    rarity: "common",
    keywords: [
      "liberty",
      "liberty head",
      "v nickel",
      "nickel",
      "five cent",
      "5c",
      "coronet",
      "1901",
      "barber nickel",
    ],
    description:
      "Liberty facing left, 13 stars, date below; large V on the reverse. Common date in the 1883–1912 Liberty Head (V) nickel series. Circulated pieces are inexpensive; look for a full LIBERTY on the coronet.",
    marketLow: 2,
    marketMid: 8,
    marketHigh: 175,
    grades: [
      { grade: "G-4", price: 2 },
      { grade: "VF-20", price: 6 },
      { grade: "EF-40", price: 12 },
      { grade: "AU-50", price: 28 },
      { grade: "MS-63", price: 85 },
      { grade: "MS-65", price: 175 },
    ],
    comps: [
      { date: "2026-08-12", venue: "eBay", grade: "F-12", price: 4.5, kind: "sold" },
      { date: "2026-06-03", venue: "Heritage", grade: "MS-64", price: 120, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 18 },
      { grade: "Mint state", count: 3 },
    ],
    accent: "#8a8f96",
  },
  {
    id: "1943-lincoln-steel-cent",
    type: "coin",
    category: "us-coins",
    name: "1943 Lincoln Steel Cent",
    shortName: "1943 Steel Cent",
    year: 1943,
    country: "United States",
    denomination: "1 cent",
    mint: "P / D / S",
    metal: "Zinc-coated steel",
    series: "Lincoln Wheat Cent",
    rarity: "common",
    keywords: ["steel", "penny", "1943", "zinc", "wheat", "war"],
    description:
      "Wartime cents struck on zinc-coated steel planchets. Common in circulated grades; uncirculated and original-luster coins bring a premium. Beware copper-plated fakes of the rare 1943 bronze.",
    marketLow: 0.15,
    marketMid: 1.25,
    marketHigh: 45,
    grades: [
      { grade: "VG-8", price: 0.15 },
      { grade: "EF-40", price: 0.6 },
      { grade: "MS-63", price: 1.25 },
      { grade: "MS-67", price: 45 },
    ],
    comps: [
      { date: "2026-08-01", venue: "eBay", grade: "BU lot of 10", price: 18, kind: "sold" },
      { date: "2026-06-20", venue: "eBay", grade: "MS-65", price: 8.5, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 55 },
      { grade: "BU", count: 12 },
    ],
    accent: "#d0d4d8",
  },
  {
    id: "1921-peace-dollar",
    type: "coin",
    category: "us-coins",
    name: "1921 Peace Dollar (High Relief)",
    shortName: "1921 Peace Dollar",
    year: 1921,
    country: "United States",
    denomination: "1 dollar",
    mint: "Philadelphia",
    metal: "90% silver",
    series: "Peace Dollar",
    rarity: "scarce",
    keywords: ["peace", "dollar", "high relief", "1921", "silver"],
    description:
      "One-year high-relief design. The fields are concave and the hair detail is sculptural. Even circulated examples carry a strong date premium over later Peace dollars.",
    marketLow: 95,
    marketMid: 225,
    marketHigh: 4200,
    grades: [
      { grade: "VF-20", price: 95 },
      { grade: "AU-50", price: 165 },
      { grade: "MS-62", price: 225 },
      { grade: "MS-64", price: 680 },
      { grade: "MS-65", price: 4200 },
    ],
    comps: [
      { date: "2026-08-09", venue: "Heritage", grade: "MS-63", price: 312, kind: "sold" },
      { date: "2026-05-03", venue: "eBay", grade: "AU-58", price: 188, kind: "sold" },
    ],
    population: [
      { grade: "VF–AU", count: 8 },
      { grade: "Mint State", count: 3 },
    ],
    accent: "#c5bfb0",
  },
  {
    id: "1857-flying-eagle-cent",
    type: "coin",
    category: "us-coins",
    name: "1857 Flying Eagle Cent",
    shortName: "1857 Flying Eagle",
    year: 1857,
    country: "United States",
    denomination: "1 cent",
    mint: "Philadelphia",
    metal: "Copper-nickel",
    series: "Flying Eagle Cent",
    rarity: "scarce",
    keywords: ["flying eagle", "cent", "1857", "copper nickel", "small cent"],
    description:
      "First year of the small cent for circulation. Thick copper-nickel planchet, short two-year type (plus 1856 pattern). Attractive type coin even in Fine.",
    marketLow: 32,
    marketMid: 78,
    marketHigh: 1850,
    grades: [
      { grade: "G-4", price: 32 },
      { grade: "F-12", price: 48 },
      { grade: "VF-20", price: 78 },
      { grade: "EF-40", price: 165 },
      { grade: "MS-63", price: 1850 },
    ],
    comps: [
      { date: "2026-06-27", venue: "eBay", grade: "VF-30", price: 92, kind: "sold" },
      { date: "2026-04-18", venue: "Stack’s", grade: "AU-50", price: 340, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 11 },
      { grade: "AU+", count: 2 },
    ],
    accent: "#c9a227",
  },
  {
    id: "1999-delaware-quarter",
    type: "coin",
    category: "us-coins",
    name: "1999 Delaware State Quarter",
    shortName: "1999 Delaware Quarter",
    year: 1999,
    country: "United States",
    denomination: "25 cents",
    mint: "P / D / S",
    metal: "Copper-nickel clad",
    series: "50 State Quarters",
    rarity: "common",
    keywords: ["state quarter", "delaware", "1999", "caesar rodney"],
    description:
      "First issue of the 50 State Quarters program. Circulation strikes are common; silver proofs and high-grade MS-67+ pieces are the only real premiums.",
    marketLow: 0.25,
    marketMid: 0.5,
    marketHigh: 18,
    grades: [
      { grade: "Circulated", price: 0.25 },
      { grade: "BU", price: 0.5 },
      { grade: "Silver Proof", price: 6 },
      { grade: "MS-67", price: 18 },
    ],
    comps: [
      { date: "2026-07-11", venue: "eBay", grade: "BU roll", price: 18, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 80 },
      { grade: "BU", count: 22 },
    ],
    accent: "#4f7cac",
  },
  {
    id: "1900-gold-sovereign",
    type: "coin",
    category: "world-coins",
    name: "1900 Great Britain Gold Sovereign",
    shortName: "1900 Gold Sovereign",
    year: 1900,
    country: "United Kingdom",
    denomination: "1 sovereign",
    mint: "London / branch mints",
    metal: "22K gold (7.32 g fine)",
    series: "Queen Victoria Old Head Sovereign",
    rarity: "common",
    keywords: ["sovereign", "gold", "victoria", "britain", "pound", "veiled head"],
    description:
      "Classic trade gold coin. Price tracks the gold spot with a modest numismatic premium for Victoria’s veiled (“old head”) portrait. Branch-mint marks (S, M, P) can add interest.",
    marketLow: 620,
    marketMid: 655,
    marketHigh: 890,
    grades: [
      { grade: "VF", price: 620 },
      { grade: "EF", price: 655 },
      { grade: "AU", price: 710 },
      { grade: "Unc", price: 890 },
    ],
    comps: [
      { date: "2026-09-02", venue: "Bullion dealer", grade: "EF", price: 648, kind: "listed" },
      { date: "2026-07-22", venue: "eBay UK", grade: "AU", price: 705, kind: "sold" },
    ],
    population: [
      { grade: "VF–EF", count: 9 },
      { grade: "AU–Unc", count: 4 },
    ],
    accent: "#e0b84a",
  },
  {
    id: "2023-maple-leaf",
    type: "coin",
    category: "world-coins",
    name: "2023 Canada 1 oz Silver Maple Leaf",
    shortName: "2023 Maple Leaf",
    year: 2023,
    country: "Canada",
    denomination: "5 dollars",
    mint: "Royal Canadian Mint",
    metal: "1 oz .9999 silver",
    series: "Silver Maple Leaf",
    rarity: "common",
    keywords: ["maple", "canada", "bullion", "silver", "rcm"],
    description:
      "Four-nines silver bullion with radial lines and a micro-engraved security mark. Trades as bullion with a small maple premium over generic rounds.",
    marketLow: 35,
    marketMid: 40,
    marketHigh: 58,
    grades: [
      { grade: "BU", price: 40 },
      { grade: "MS-69", price: 48 },
      { grade: "MS-70", price: 58 },
    ],
    comps: [
      { date: "2026-08-29", venue: "SD Bullion", grade: "BU", price: 39.4, kind: "listed" },
    ],
    population: [{ grade: "BU", count: 16 }],
    accent: "#d8dde3",
  },
  {
    id: "hadrian-denarius",
    type: "coin",
    category: "ancient",
    name: "Roman Silver Denarius — Hadrian",
    shortName: "Hadrian Denarius",
    year: 125,
    country: "Roman Empire",
    denomination: "denarius",
    mint: "Rome",
    metal: "Silver",
    series: "Imperial Denarius",
    rarity: "scarce",
    keywords: ["roman", "denarius", "hadrian", "ancient", "silver", "empire"],
    description:
      "Silver denarius of Hadrian (AD 117–138). Values depend on reverse type, portrait style, and surfaces. Typical “fine silver” trade pieces sit in the $60–$150 band; rarer reverses jump quickly.",
    marketLow: 55,
    marketMid: 95,
    marketHigh: 480,
    grades: [
      { grade: "Fine", price: 55 },
      { grade: "VF", price: 95 },
      { grade: "EF", price: 185 },
      { grade: "Choice EF", price: 480 },
    ],
    comps: [
      { date: "2026-06-04", venue: "VCoins", grade: "VF", price: 110, kind: "listed" },
      { date: "2026-02-17", venue: "CNG eAuction", grade: "VF+", price: 132, kind: "sold" },
    ],
    population: [
      { grade: "Fine", count: 4 },
      { grade: "VF+", count: 3 },
    ],
    accent: "#a08968",
  },
  {
    id: "1935a-silver-certificate",
    type: "note",
    category: "us-paper",
    name: "1935-A $1 Silver Certificate",
    shortName: "1935-A $1 Silver Cert",
    year: 1935,
    country: "United States",
    denomination: "$1",
    series: "Silver Certificate",
    rarity: "common",
    keywords: ["silver certificate", "1935", "blue seal", "one dollar", "funny back"],
    description:
      "Blue-seal $1 still redeemable in silver when issued. Common in circulated grades; star notes, mule varieties, and high-grade examples (especially 65+ EPQ) are the chase.",
    marketLow: 4,
    marketMid: 12,
    marketHigh: 95,
    grades: [
      { grade: "VG", price: 4 },
      { grade: "VF", price: 8 },
      { grade: "EF", price: 12 },
      { grade: "CU-63", price: 28 },
      { grade: "Gem-65", price: 95 },
    ],
    comps: [
      { date: "2026-08-06", venue: "eBay", grade: "VF", price: 7.5, kind: "sold" },
      { date: "2026-05-29", venue: "Heritage", grade: "65 EPQ", price: 84, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 24 },
      { grade: "Uncirculated", count: 6 },
    ],
    accent: "#3d6ea8",
  },
  {
    id: "1953-two-dollar-red-seal",
    type: "note",
    category: "us-paper",
    name: "1953 $2 United States Note (Red Seal)",
    shortName: "1953 $2 Red Seal",
    year: 1953,
    country: "United States",
    denomination: "$2",
    series: "United States Note",
    rarity: "common",
    keywords: ["two dollar", "red seal", "1953", "united states note", "jefferson"],
    description:
      "Small-size red-seal deuce. Most circulated notes trade a few dollars over face. Crisp uncirculated packs and stars are where the money is.",
    marketLow: 5,
    marketMid: 9,
    marketHigh: 75,
    grades: [
      { grade: "VG", price: 5 },
      { grade: "VF", price: 7 },
      { grade: "EF", price: 9 },
      { grade: "CU", price: 22 },
      { grade: "Gem", price: 75 },
    ],
    comps: [
      { date: "2026-07-14", venue: "eBay", grade: "EF", price: 8.25, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 19 },
      { grade: "CU", count: 4 },
    ],
    accent: "#c23b3b",
  },
  {
    id: "1914-five-frn",
    type: "note",
    category: "us-paper",
    name: "1914 $5 Federal Reserve Note",
    shortName: "1914 $5 FRN",
    year: 1914,
    country: "United States",
    denomination: "$5",
    series: "Large Size Federal Reserve Note",
    rarity: "scarce",
    keywords: ["1914", "five dollar", "large size", "federal reserve", "lincoln"],
    description:
      "Large-size (“horse blanket”) $5 FRN. District, signature combo, and red vs blue seals matter. A solid type note in Fine–VF for collectors stepping into large size.",
    marketLow: 38,
    marketMid: 85,
    marketHigh: 650,
    grades: [
      { grade: "G", price: 38 },
      { grade: "F", price: 58 },
      { grade: "VF", price: 85 },
      { grade: "EF", price: 175 },
      { grade: "CU", price: 650 },
    ],
    comps: [
      { date: "2026-04-21", venue: "Heritage", grade: "VF-25", price: 96, kind: "sold" },
      { date: "2026-01-08", venue: "eBay", grade: "F-15", price: 54, kind: "sold" },
    ],
    population: [
      { grade: "Good–Fine", count: 6 },
      { grade: "VF+", count: 3 },
    ],
    accent: "#5c6b4a",
  },
  {
    id: "1899-black-eagle",
    type: "note",
    category: "us-paper",
    name: "1899 $1 Silver Certificate “Black Eagle”",
    shortName: "1899 Black Eagle $1",
    year: 1899,
    country: "United States",
    denomination: "$1",
    series: "Silver Certificate",
    rarity: "scarce",
    keywords: ["black eagle", "1899", "silver certificate", "large size", "one dollar"],
    description:
      "Iconic large-size design with a spread-wing eagle over portraits of Lincoln and Grant. One of the most collected U.S. type notes. Condition and original paper quality swing the price hard.",
    marketLow: 95,
    marketMid: 185,
    marketHigh: 1400,
    grades: [
      { grade: "G", price: 95 },
      { grade: "F", price: 140 },
      { grade: "VF", price: 185 },
      { grade: "EF", price: 340 },
      { grade: "CU-63", price: 1400 },
    ],
    comps: [
      { date: "2026-05-16", venue: "Stack’s Bowers", grade: "VF-30", price: 216, kind: "sold" },
      { date: "2026-03-02", venue: "eBay", grade: "F-12", price: 128, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 7 },
      { grade: "EF+", count: 2 },
    ],
    accent: "#2c3a4a",
  },
  {
    id: "1934-hundred-gold-cert",
    type: "note",
    category: "us-paper",
    name: "1934 $100 Gold Certificate",
    shortName: "1934 $100 Gold Cert",
    year: 1934,
    country: "United States",
    denomination: "$100",
    series: "Gold Certificate",
    rarity: "rare",
    keywords: ["gold certificate", "1934", "hundred", "gold seal", "small size"],
    description:
      "Small-size gold certificate. Never released to the public in the usual sense; most surviving notes come from holdings that entered the collector market later. Gold seal and serials, not a circulating souvenir.",
    marketLow: 220,
    marketMid: 385,
    marketHigh: 2800,
    grades: [
      { grade: "VG", price: 220 },
      { grade: "F", price: 285 },
      { grade: "VF", price: 385 },
      { grade: "EF", price: 720 },
      { grade: "CU", price: 2800 },
    ],
    comps: [
      { date: "2026-02-11", venue: "Heritage", grade: "VF-20", price: 410, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 3 },
      { grade: "EF+", count: 1 },
    ],
    accent: "#c9a227",
  },
  {
    id: "1864-confederate-10",
    type: "note",
    category: "us-paper",
    name: "1864 Confederate States $10",
    shortName: "1864 CSA $10",
    year: 1864,
    country: "Confederate States",
    denomination: "$10",
    series: "T-68 Confederate Currency",
    rarity: "common",
    keywords: ["confederate", "csa", "civil war", "1864", "ten dollar", "horses"],
    description:
      "Late-war T-68 $10 with artillery horsemen. Printed in huge numbers; genuine circulated notes are affordable. Watch for reprints and fantasy pieces sold as “authentic.”",
    marketLow: 22,
    marketMid: 42,
    marketHigh: 180,
    grades: [
      { grade: "G", price: 22 },
      { grade: "F", price: 32 },
      { grade: "VF", price: 42 },
      { grade: "EF", price: 75 },
      { grade: "CU", price: 180 },
    ],
    comps: [
      { date: "2026-06-09", venue: "eBay", grade: "VF", price: 39, kind: "sold" },
    ],
    population: [{ grade: "Circulated", count: 12 }],
    accent: "#8b5a2b",
  },
  {
    id: "1976-two-dollar-frn",
    type: "note",
    category: "us-paper",
    name: "1976 $2 Federal Reserve Note",
    shortName: "1976 $2 FRN",
    year: 1976,
    country: "United States",
    denomination: "$2",
    series: "Federal Reserve Note",
    rarity: "common",
    keywords: ["two dollar", "1976", "bicentennial", "jefferson", "green seal"],
    description:
      "Bicentennial deuce with the Signing of the Declaration reverse. Face value plus a small collector bump unless it is a star, fancy serial, or gem pack.",
    marketLow: 2,
    marketMid: 3.5,
    marketHigh: 45,
    grades: [
      { grade: "Circulated", price: 2 },
      { grade: "CU", price: 3.5 },
      { grade: "Star CU", price: 12 },
      { grade: "Fancy serial", price: 45 },
    ],
    comps: [
      { date: "2026-08-18", venue: "eBay", grade: "CU", price: 3.25, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 30 },
      { grade: "CU", count: 10 },
    ],
    accent: "#2f6b46",
  },
  {
    id: "1923-german-100000-mark",
    type: "note",
    category: "world-paper",
    name: "1923 Germany 100,000 Mark",
    shortName: "1923 100,000 Mark",
    year: 1923,
    country: "Germany",
    denomination: "100,000 Mark",
    series: "Weimar hyperinflation",
    rarity: "common",
    keywords: ["germany", "weimar", "hyperinflation", "mark", "1923", "notgeld"],
    description:
      "Weimar high-denomination note from the 1923 inflation spiral. Common types are inexpensive; uncirculated, scarce overprints, and earlier 1922 dates can do better.",
    marketLow: 3,
    marketMid: 8,
    marketHigh: 40,
    grades: [
      { grade: "VG", price: 3 },
      { grade: "VF", price: 8 },
      { grade: "EF", price: 14 },
      { grade: "Unc", price: 40 },
    ],
    comps: [
      { date: "2026-07-01", venue: "eBay", grade: "VF", price: 6.5, kind: "sold" },
    ],
    population: [{ grade: "Circulated", count: 14 }],
    accent: "#6b4f3a",
  },
  {
    id: "boeing-polymer-five",
    type: "note",
    category: "world-paper",
    name: "Bank of England £5 Polymer (Winston Churchill)",
    shortName: "UK £5 Polymer",
    year: 2016,
    country: "United Kingdom",
    denomination: "£5",
    series: "Bank of England polymer",
    rarity: "common",
    keywords: ["england", "five pound", "churchill", "polymer", "bank of england"],
    description:
      "First Bank of England polymer fiver. Circulating notes are face. Fancy serials, first-run AA01, and error notes are the collector market.",
    marketLow: 6.5,
    marketMid: 8,
    marketHigh: 120,
    grades: [
      { grade: "Circulated", price: 6.5 },
      { grade: "Unc", price: 8 },
      { grade: "AA01 Unc", price: 35 },
      { grade: "Radar / fancy", price: 120 },
    ],
    comps: [
      { date: "2026-08-10", venue: "eBay UK", grade: "Unc", price: 7.5, kind: "sold" },
    ],
    population: [
      { grade: "Circulated", count: 11 },
      { grade: "Unc", count: 5 },
    ],
    accent: "#5b8c6a",
  },
];

export function formatMoney(n: number) {
  if (n >= 100) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export function getItem(id: string) {
  return catalog.find((item) => item.id === id);
}

export function searchCatalog(query: string, category: string = "all") {
  const q = query.trim().toLowerCase();
  return catalog.filter((item) => {
    if (category !== "all" && item.category !== category && item.type !== category) {
      return false;
    }
    if (!q) return true;
    const hay = [
      item.name,
      item.shortName,
      item.country,
      item.denomination,
      item.series,
      item.mint ?? "",
      item.metal ?? "",
      item.year?.toString() ?? "",
      ...item.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return q.split(/\s+/).every((part) => hay.includes(part));
  });
}

export function relatedItems(item: CatalogItem, limit = 4) {
  return catalog
    .filter((other) => other.id !== item.id)
    .map((other) => {
      let score = 0;
      if (other.type === item.type) score += 2;
      if (other.category === item.category) score += 3;
      if (other.country === item.country) score += 2;
      if (other.series === item.series) score += 4;
      return { other, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.other);
}

export function featuredItems() {
  return catalog.filter((item) =>
    [
      "1909-s-vdb-lincoln-cent",
      "1881-s-morgan-dollar",
      "1899-black-eagle",
      "1900-gold-sovereign",
      "1916-d-mercury-dime",
      "1935a-silver-certificate",
    ].includes(item.id),
  );
}

export function recentSales() {
  return catalog
    .flatMap((item) =>
      item.comps
        .filter((comp) => comp.kind === "sold")
        .map((comp) => ({ item, comp })),
    )
    .sort((a, b) => b.comp.date.localeCompare(a.comp.date))
    .slice(0, 8);
}
