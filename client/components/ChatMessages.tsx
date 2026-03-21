"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/app/store/chat-slice/chat";
import { Bot, Copy, Check, User } from "lucide-react";
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
function PersistentImage({ imageId, prompt }: { imageId: string; prompt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/images/${imageId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.image?.imageUrl) setSrc(d.image.imageUrl); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [imageId]);

  if (loading) return <div className="w-64 h-64 rounded-xl bg-white/5 animate-pulse border border-white/10" />;

  if (!src) return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-muted-foreground text-sm max-w-sm">
      <span>🖼️</span><span>Image unavailable — check Gallery</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 my-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={prompt} className="rounded-xl max-w-md w-full shadow-lg border border-white/10" />
      <p className="text-xs text-muted-foreground">Prompt: {prompt}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PDF download button
// ─────────────────────────────────────────────────────────────
function PDFDownload({ content }: { content: string }) {
  const pdfMatch = content.match(/^\[pdf-ready\|\|\|([\s\S]+?)\|\|\|([\s\S]+)\]$/s);
  if (!pdfMatch) return null;

  const base64 = pdfMatch[1];
  const topic = pdfMatch[2];

  const handleDownload = () => {
    const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${topic.slice(0, 30).replace(/\s+/g, "_")}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3 my-2">
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 max-w-sm">
        <span className="text-2xl">📄</span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-white">{topic}</p>
          <p className="text-xs text-gray-400">PDF document ready</p>
        </div>
      </div>
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-xl transition max-w-fit"
      >
        ↓ Download PDF
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PDF stripped after refresh
// ─────────────────────────────────────────────────────────────
function PDFStripped({ topic }: { topic: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 max-w-sm">
      <span className="text-2xl">📄</span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-white">{topic}</p>
        <p className="text-xs text-gray-400">
          Type <code className="bg-white/10 px-1 rounded">/pdf {topic}</code> to regenerate
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Code block with syntax highlighting + copy
// ─────────────────────────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-white/10 text-sm">
      <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2 border-b border-white/10">
        <span className="text-xs text-muted-foreground font-mono">{lang ?? "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang || "text"}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.82rem", lineHeight: "1.65", background: "#1e1e1e" }}
        showLineNumbers
        lineNumberStyle={{ color: "#4a4a4a", minWidth: "2.5em" }}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Markdown-aware text renderer — handles bold, italic, headers, lists
// ─────────────────────────────────────────────────────────────
function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        // H3
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-1">{renderInline(line.slice(4))}</h3>;
        }
        // H2
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-lg font-semibold text-foreground mt-5 mb-1.5">{renderInline(line.slice(3))}</h2>;
        }
        // H1
        if (line.startsWith("# ")) {
          return <h1 key={i} className="text-xl font-bold text-foreground mt-5 mb-2">{renderInline(line.slice(2))}</h1>;
        }
        // Bullet list
        if (line.match(/^[-*•]\s/)) {
          return (
            <div key={i} className="flex gap-2  my-0.5">
              <span className="text-muted-foreground  shrink-0">•</span>
              <span className="leading-relaxed">{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        // Numbered list
        if (line.match(/^\d+\.\s/)) {
          const match = line.match(/^(\d+)\.\s(.*)$/);
          if (match) {
            return (
              <div key={i} className="flex gap-2 my-0.5">
                <span className="text-muted-foreground shrink-0 min-w-[1.2rem]">{match[1]}.</span>
                <span className="leading-relaxed">{renderInline(match[2])}</span>
              </div>
            );
          }
        }
        // Horizontal rule
        if (line.match(/^---+$/)) {
          return <hr key={i} className="border-white/10 my-3" />;
        }
        // Empty line — spacing
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }
        // Regular paragraph
        return (
          <p key={i} className="leading-relaxed my-0.5">
            {renderInline(line)}
          </p>
        );
      })}
    </>
  );
}

// Renders inline bold, italic, inline code
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-white/10 rounded px-1.5 py-0.5 text-[0.82rem] font-mono text-blue-300">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ─────────────────────────────────────────────────────────────
// Renders assistant message — handles all content types
// ─────────────────────────────────────────────────────────────
function AssistantContent({ content }: { content: string }) {

  // Persisted image — new format
  const persistedMatchNew = content.match(/^\[image\|\|\|([a-f0-9]+)\|\|\|([\s\S]+)\]$/);
  if (persistedMatchNew) {
    return <PersistentImage imageId={persistedMatchNew[1]} prompt={persistedMatchNew[2]} />;
  }

  // Persisted image — old format fallback
  const persistedMatchOld = content.match(/^\[image:([a-f0-9]{24}):([\s\S]+)\]$/);
  if (persistedMatchOld) {
    return <PersistentImage imageId={persistedMatchOld[1]} prompt={persistedMatchOld[2]} />;
  }

  // Base64 image — in memory before refresh
  const base64Match = content.match(/^!\[(.+?)\]\((data:image[^)]+)\)$/);
  if (base64Match) {
    return (
      <div className="flex flex-col gap-2 my-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={base64Match[2]} alt={base64Match[1]} className="rounded-xl max-w-md w-full shadow-lg border border-white/10" />
        <p className="text-xs text-muted-foreground">Prompt: {base64Match[1]}</p>
      </div>
    );
  }

  // PDF freshly generated
  if (content.startsWith("[pdf-ready|||")) {
    return <PDFDownload content={content} />;
  }

  // PDF stripped after refresh
  const pdfStrippedMatch = content.match(/^\[pdf:(.+)\]$/);
  if (pdfStrippedMatch) {
    return <PDFStripped topic={pdfStrippedMatch[1]} />;
  }

  // Split out fenced code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1 text-sm text-foreground leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0].trim();
          const code = lines.slice(1).join("\n");
          return <CodeBlock key={i} code={code} lang={lang || undefined} />;
        }

        // Check for inline video/image markdown before markdown text
        if (part.includes("![")) {
          const segments = part.split(/(!\[[^\]]*\]\([^)]+\))/g);
          return (
            <div key={i}>
              {segments.map((seg, j) => {
                if (seg.startsWith("![") && seg.endsWith(")")) {
                  const match = seg.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                  if (match) {
                    const alt = match[1];
                    const url = match[2];
                    if (alt.startsWith("video:")) {
                      return <video key={j} src={url} controls className="rounded-xl max-w-md w-full my-3 border border-white/10" />;
                    }
                    // eslint-disable-next-line @next/next/no-img-element
                    return <img key={j} src={url} alt={alt} className="rounded-xl max-w-md w-full my-3 border border-white/10" />;
                  }
                }
                return <MarkdownText key={j} text={seg} />;
              })}
            </div>
          );
        }

        return <MarkdownText key={i} text={part} />;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Typing indicator
// ─────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-muted/30 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
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
    <div className="flex-1 w-full overflow-y-auto overflow-x-hidden px-4 pt-6 pb-36 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {messages.map((msg) => {

        // ─── User message ───
        if (msg.role === "user") {
          return (
            <div key={msg.id} className="flex justify-end">
              <div className="flex items-start gap-2 max-w-[80%]">
                <div
                  className="bg-muted/60 border border-white/5 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-foreground leading-relaxed"
                  style={{
                    // ✅ Fix horizontal scroll on long code pastes
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                    minWidth: 0,
                  }}
                >
                  {msg.content}
                </div>
                <div className="shrink-0 w-7 h-7 rounded-full bg-muted/60 border border-white/10 flex items-center justify-center mt-0.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>
          );
        }

        // ─── Assistant message ───
        return (
          <div key={msg.id} className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mt-0.5">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div
              className="flex-1 min-w-0 text-sm text-foreground"
              style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
            >
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