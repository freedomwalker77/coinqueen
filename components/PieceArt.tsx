import { catalog } from "@/lib/catalog";

export function PieceArt({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const item = catalog.find((piece) => piece.id === id);
  if (!item) return null;
  const isCoin = item.type === "coin";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `radial-gradient(circle at 30% 20%, ${item.accent}55, #140c1f 70%)` }}
      aria-hidden
    >
      <svg viewBox="0 0 200 140" className="h-full w-full">
        {isCoin ? (
          <>
            <circle cx="100" cy="70" r="54" fill={item.accent} opacity="0.9" />
            <circle cx="100" cy="70" r="48" fill="none" stroke="#1a1024" strokeWidth="2" opacity="0.35" />
            <circle cx="100" cy="70" r="40" fill="none" stroke="#fff8e4" strokeWidth="1.2" opacity="0.45" />
            <text
              x="100"
              y="76"
              textAnchor="middle"
              fill="#1a1024"
              fontSize="22"
              fontFamily="serif"
              fontWeight="700"
            >
              {item.year ?? "★"}
            </text>
          </>
        ) : (
          <>
            <rect x="28" y="28" width="144" height="84" rx="6" fill={item.accent} opacity="0.92" />
            <rect x="36" y="36" width="128" height="68" rx="3" fill="none" stroke="#fff8e4" strokeWidth="1.2" opacity="0.5" />
            <circle cx="58" cy="70" r="16" fill="#fff8e4" opacity="0.25" />
            <text x="86" y="68" fill="#fff8e4" fontSize="16" fontFamily="serif" fontWeight="700">
              {item.denomination}
            </text>
            <text x="86" y="88" fill="#1a1024" fontSize="8" fontFamily="sans-serif" opacity="0.7">
              {item.year ?? item.country}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
