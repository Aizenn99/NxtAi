"use client";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const PersistentImage = ({
  imageId,
  prompt,
}: {
  imageId: string;
  prompt: string;
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/images/${imageId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.image?.imageUrl) setSrc(d.image.imageUrl);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [imageId]);

  if (loading)
    return <div className="w-64 h-64 rounded-xl bg-gray-800 animate-pulse" />;
  if (!src)
    return (
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-400 text-sm">
        <span>🖼️</span>
        <span>Image unavailable — check Gallery</span>
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      <img
        src={src}
        alt={prompt}
        className="max-w-sm rounded-xl border border-gray-700"
      />
      <p className="text-xs text-gray-500">Prompt: {prompt}</p>
    </div>
  );
};

export const MessageContent = ({ content }: { content: string }) => {
  // ✅ New format: [image|||ID|||prompt]
  const persistedMatch =
    content.match(/^\[image\|\|\|([a-f0-9]+)\|\|\|([\s\S]+)\]$/) ||
    // ✅ Old format fallback: [image:ID:prompt] — handles already saved messages
    content.match(/^\[image:([a-f0-9]{24}):([\s\S]+)\]$/);

  if (persistedMatch) {
    return (
      <PersistentImage imageId={persistedMatch[1]} prompt={persistedMatch[2]} />
    );
  }

  // Base64 image — still in memory before refresh
  const base64Match = content.match(/^!\[(.+?)\]\((data:image[^)]+)\)$/);
  if (base64Match) {
    return (
      <div className="flex flex-col gap-2">
        <img
          src={base64Match[2]}
          alt={base64Match[1]}
          className="max-w-sm rounded-xl border border-gray-700"
        />
        <p className="text-xs text-gray-500">Prompt: {base64Match[1]}</p>
      </div>
    );
  }

  // Normal text
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
  );
};
