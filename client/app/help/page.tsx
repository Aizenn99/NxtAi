"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  BrainCircuit,
  ShieldAlert,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Video,
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-neutral-950 to-black text-white font-geist-mono selection:bg-purple-500/30">
      {/* ✅ FIXED CONTAINER */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-10 py-12 space-y-20">
        {/* Header */}
        <header className="space-y-6 max-w-3xl">
          <Button
            variant="ghost"
            asChild
            className="mb-4 hover:bg-white/5 -ml-2 transition"
          >
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </Link>
          </Button>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-blue-400 via-purple-500 to-orange-400 bg-clip-text text-transparent">
            Help & Documentation
          </h1>

          <p className="text-gray-400 text-lg">
            Everything you need to know about navigating NxtAi, using AI models,
            and understanding your data.
          </p>
        </header>

        {/* Models Section */}
        <section className="space-y-10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-3xl font-semibold">
              Which Model Should I Use?
            </h2>
          </div>

          {/* ✅ GRID FIXED */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
            {[
              {
                icon: Zap,
                color: "text-orange-400",
                title: "Groq (Llama 3)",
                description: "Best for Speed & General Chat",
                content: (
                  <>
                    <p>
                      Lightning-fast responses for chat, coding, and quick
                      tasks.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      <li>Instant responses</li>
                      <li>Great for coding & writing</li>
                    </ul>
                  </>
                ),
              },
              {
                icon: BrainCircuit,
                color: "text-blue-400",
                title: "Cohere (Command-A)",
                description: "Best for Reasoning",
                content: (
                  <>
                    <p>
                      Ideal for structured outputs, logic, and summarization.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      <li>Strong instruction following</li>
                      <li>Great for long text tasks</li>
                    </ul>
                  </>
                ),
              },
              {
                icon: ImageIcon,
                color: "text-pink-400",
                title: "Hugging Face",
                description: "Text-to-Image",
                content: (
                  <p>
                    Use{" "}
                    <code className="bg-white/10 px-2 py-1 rounded text-sm">
                      /image
                    </code>{" "}
                    to generate images.
                  </p>
                ),
              },
              {
                icon: Video,
                color: "text-green-400",
                title: "Fal AI (Kling)",
                description: "Text-to-Video",
                content: (
                  <p>
                    Use{" "}
                    <code className="bg-white/10 px-2 py-1 rounded text-sm">
                      /video
                    </code>{" "}
                    to create videos.
                  </p>
                ),
              },
            ].map(
              ({ icon: Icon, color, title, description, content }, index) => (
                <Card
                  key={index}
                  className="group bg-white/[0.03] border border-white/10 backdrop-blur-xl
                  hover:bg-white/[0.05] hover:border-white/20
                  transition-all duration-300 rounded-2xl"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition">
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <CardTitle className="text-lg">{title}</CardTitle>
                    </div>
                    <CardDescription className="text-gray-400">
                      {description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="text-gray-300 text-sm">
                    {content}
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Privacy Section */}
        <section className="space-y-10 max-w-4xl">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            <h2 className="text-3xl font-semibold">Privacy Policy</h2>
          </div>

          <p className="text-gray-400">
            NxtAi prioritizes security and transparency. Your data flows through
            selected AI providers based on your chosen model.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Local Credentials",
                content:
                  "Your API keys are securely handled on the server and never exposed to the browser.",
              },
              {
                title: "Chat History",
                content:
                  "Chats are stored in MongoDB so you can access them anytime.",
              },
              {
                title: "Third-Party Processing",
                content:
                  "Prompts are sent to selected providers. Their policies apply to your data.",
              },
            ].map(({ title, content }, index) => (
              <div
                key={index}
                className="p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition"
              >
                <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-400">{content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-10 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} NxtAi. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
