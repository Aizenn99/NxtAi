"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, Paperclip, Send, UserCircle, Menu, Settings, Code, Image as ImageIcon, Video, Music, FileText } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export default function Home() {
  // Placeholder authentication state
  const isLoggedIn = false;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${e.currentTarget.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Handle send logic here
      console.log("Send message");
    }
  };

  return (
    <div className="flex flex-col font-geist-mono h-screen w-full bg-black text-foreground overflow-hidden">
      {/* ... [Header and Main Content Area - kept exactly the same to avoid unnecessary diffs] ... */}
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-6 h-6" />
          </Button>
          <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            NxtAi
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="hidden md:flex">Settings</Button>
          <Button variant="ghost" className="hidden md:flex">Help</Button>
          
          {isLoggedIn ? (
            <Avatar className="w-9 h-9 ml-2 cursor-pointer ring-2 ring-transparent transition-all hover:ring-primary/50">
              <AvatarImage src="" />
              <AvatarFallback className="bg-muted">
                <UserCircle className="w-6 h-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <Button variant="outline" asChild className="ml-2">
              <Link href="/auth/login">Login</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full relative">
        <div className="w-full flex-1 flex flex-col justify-center mb-28">
          
          {/* Greeting String */}
          <div className="space-y-2 mb-12 flex flex-col pt-8">
             <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-orange-400 bg-clip-text text-transparent pb-2">
               Hello, Human
             </h1>
             <h2 className="text-4xl md:text-5xl font-semibold text-muted-foreground">
               How can I help you today?
             </h2>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <Card className="p-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer border flex flex-col gap-4 rounded-2xl">
              <Code className="w-6 h-6 text-blue-400" />
              <div className="text-sm font-medium">Write a React component</div>
            </Card>
            <Card className="p-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer border flex flex-col gap-4 rounded-2xl">
              <ImageIcon className="w-6 h-6 text-purple-400" />
              <div className="text-sm font-medium">Generate a logo</div>
            </Card>
            <Card className="p-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer border flex flex-col gap-4 rounded-2xl hidden md:flex">
              <Video className="w-6 h-6 text-green-400" />
              <div className="text-sm font-medium">Create a short video</div>
            </Card>
            <Card className="p-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer border flex flex-col gap-4 rounded-2xl hidden md:flex">
              <FileText className="w-6 h-6 text-orange-400" />
              <div className="text-sm font-medium">Draft a project proposal</div>
            </Card>
          </div>
        </div>

        {/* Input Area (Floating at bottom) */}
        <div className="w-full max-w-3xl absolute bottom-8 px-4 bg-black pb-2">
          <div className="relative flex items-end rounded-3xl border bg-muted/30 shadow-sm p-1 pr-4 transition-all focus-within:ring-1 focus-within:ring-border focus-within:bg-muted/50">
            <Button variant="ghost" size="icon" className="mb-0.5 cursor-pointer  rounded-full text-muted-foreground hover:text-foreground shrink-0">
               <Paperclip className="w-5 h-5" />
            </Button>
            <Textarea 
              ref={textareaRef}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Enter a prompt here..." 
              className="flex-1 border-none shadow-none focus-visible:ring-0 text-base md:text-md px-2 resize-none min-h-[40px] max-h-[100px] py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
              rows={1}
            />
            <div className="flex items-center gap-2 shrink-0 mb-0.5">
              <Button variant="ghost" size="icon" className="rounded-full cursor-pointer text-muted-foreground hover:text-foreground">
                 <Mic className="w-5 h-5" />
              </Button>
              <Button size="icon" className="rounded-full cursor-pointer bg-foreground text-background hover:bg-foreground/90">
                 <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-3">
            NxtAi may display inaccurate info, so double-check its responses.
          </p>
        </div>
      </main>
    </div>
  );
}