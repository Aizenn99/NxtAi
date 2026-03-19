"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/app/store/chat-slice/chat";
import { Bot, Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

// ─────────────────────────────────────────────────────────────
// Loads image from MongoDB by ID — persists across refreshes
// ─────────────────────────────────────────────────────────────
function PersistentImage({
  imageId,
  prompt,
}: {
  imageId: string;
  prompt: string;
}) {
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

  if (loading) {
    return (
      <div className="w-64 h-64 rounded-xl bg-white/5 animate-pulse border border-white/10" />
    );
  }

  if (!src) {
    return (
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-muted-foreground text-sm max-w-sm">
        <span>🖼️</span>
        <span>Image unavailable — check Gallery</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 my-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={prompt}
        className="rounded-lg max-w-md w-full shadow-lg border border-white/10"
      />
      <p className="text-xs text-muted-foreground">Prompt: {prompt}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Code block with syntax highlighting + copy button
// ─────────────────────────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-2 rounded-xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between bg-[#1e1e1e] px-4 py-1.5">
        <span className="text-xs text-muted-foreground font-mono">
          {lang ?? "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang || "text"}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.85rem",
          lineHeight: "1.6",
          background: "#1e1e1e",
        }}
        showLineNumbers
        lineNumberStyle={{ color: "#555", minWidth: "2.5em" }}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Renders assistant message content
// Handles: persisted images, base64 images, videos, code, text
// ─────────────────────────────────────────────────────────────
function AssistantContent({ content }: { content: string }) {
  // ✅ New format: [image|||ID|||prompt] — loads from MongoDB on refresh
  const persistedMatchNew = content.match(
    /^\[image\|\|\|([a-f0-9]+)\|\|\|([\s\S]+)\]$/,
  );
  if (persistedMatchNew) {
    return (
      <PersistentImage
        imageId={persistedMatchNew[1]}
        prompt={persistedMatchNew[2]}
      />
    );
  }

  // ✅ Old format fallback: [image:ID:prompt] — handles already saved messages
  const persistedMatchOld = content.match(
    /^\[image:([a-f0-9]{24}):([\s\S]+)\]$/,
  );
  if (persistedMatchOld) {
    return (
      <PersistentImage
        imageId={persistedMatchOld[1]}
        prompt={persistedMatchOld[2]}
      />
    );
  }

  // ✅ Base64 image — in memory before refresh
  const base64Match = content.match(/^!\[(.+?)\]\((data:image[^)]+)\)$/);
  if (base64Match) {
    return (
      <div className="flex flex-col gap-2 my-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={base64Match[2]}
          alt={base64Match[1]}
          className="rounded-lg max-w-md w-full shadow-lg border border-white/10"
        />
        <p className="text-xs text-muted-foreground">
          Prompt: {base64Match[1]}
        </p>
      </div>
    );
  }

  // ✅ Regular text with code blocks, inline code, images, and videos
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0].trim();
          const code = lines.slice(1).join("\n");
          return <CodeBlock key={i} code={code} lang={lang || undefined} />;
        }

        const segments = part.split(/(`[^`]+`|!\[[^\]]*\]\([^)]+\))/g);
        return (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {segments.map((seg, j) => {
              // Inline code
              if (seg.startsWith("`") && seg.endsWith("`")) {
                return (
                  <code
                    key={j}
                    className="bg-white/10 rounded px-1 py-0.5 text-sm font-mono text-blue-300"
                  >
                    {seg.slice(1, -1)}
                  </code>
                );
              }

              // Inline image or video
              if (seg.startsWith("![") && seg.endsWith(")")) {
                const match = seg.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                if (match) {
                  const alt = match[1];
                  const url = match[2];

                  if (alt.startsWith("video:")) {
                    return (
                      <video
                        key={j}
                        src={url}
                        controls
                        className="rounded-lg max-w-md w-full my-4 shadow-lg border border-white/10"
                      />
                    );
                  }

                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={j}
                      src={url}
                      alt={alt}
                      className="rounded-lg max-w-md w-full my-4 shadow-lg border border-white/10"
                    />
                  );
                }
              }

              return seg;
            })}
          </p>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Typing indicator animation
// ─────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-muted/40 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5 h-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main ChatMessages component
// ─────────────────────────────────────────────────────────────
export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 w-full overflow-y-auto px-4 pt-6 pb-36 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {messages.map((msg) => {
        if (msg.role === "user") {
          return (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[75%] bg-muted/60 border border-white/5 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[85%] overflow-x-auto text-sm text-foreground">
              <AssistantContent content={msg.content} />
            </div>
          </div>
        );
      })}

      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
