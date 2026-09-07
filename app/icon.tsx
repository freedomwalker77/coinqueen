import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#143528",
          color: "#c9a227",
          fontSize: 110,
          fontWeight: 700,
        }}
      >
        V
      </div>
    ),
    { ...size },
  );
}
