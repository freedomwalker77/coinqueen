"use client";

import { useRef, useState } from "react";

async function fileToAvatar(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that photo."));
      el.src = url;
    });
    const size = 320;
    const scale = Math.min(size / img.width, size / img.height, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AvatarDropzone({
  value,
  name,
  initial,
}: {
  value: string;
  name: string;
  initial: string;
}) {
  const [preview, setPreview] = useState(value);
  const [hover, setHover] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const hidden = useRef<HTMLInputElement>(null);

  async function apply(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choose a JPEG, PNG, or WebP photo.");
      return;
    }
    try {
      const data = await fileToAvatar(file);
      setPreview(data);
      setMessage(null);
      if (hidden.current) hidden.current.value = data;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not use that photo.");
    }
  }

  return (
    <div>
      <input ref={hidden} type="hidden" name={name} defaultValue={preview} />
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={(event) => {
          event.preventDefault();
          setHover(false);
          void apply(event.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center ${
          hover ? "border-gold bg-gold/10" : "border-money/25 bg-queen-deep"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="mb-3 h-24 w-24 rounded-full object-cover" />
        ) : (
          <span className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-money font-serif text-3xl text-white">
            {initial}
          </span>
        )}
        <p className="text-sm text-cream/70">Drag a photo here, or</p>
        <label className="mt-2 cursor-pointer rounded-full bg-gold px-4 py-2 text-sm font-medium text-queen-ink hover:bg-gold-bright">
          Upload photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void apply(file);
            }}
          />
        </label>
        <p className="mt-2 text-xs text-cream/45">JPEG, PNG, or WebP. We’ll resize it for your profile.</p>
      </div>
      {message ? <p className="mt-2 text-sm text-red-700">{message}</p> : null}
    </div>
  );
}
