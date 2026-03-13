"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/app/store/chat-slice/chat";
import { Bot, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

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

function AssistantContent({ content }: { content: string }) {
  // Split by code blocks (```lang\n...\n```)
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
        // Render inline `code` spans and line breaks
        const segments = part.split(/(`[^`]+`)/g);
        return (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {segments.map((seg, j) =>
              seg.startsWith("`") && seg.endsWith("`") ? (
                <code
                  key={j}
                  className="bg-white/10 rounded px-1 py-0.5 text-sm font-mono text-blue-300"
                >
                  {seg.slice(1, -1)}
                </code>
              ) : (
                seg
              ),
            )}
          </p>
        );
      })}
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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
