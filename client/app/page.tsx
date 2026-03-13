"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mic,
  Paperclip,
  Send,
  UserCircle,
  Code,
  Image as ImageIcon,
  Video,
  FileText,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useSelector, useDispatch } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  startNewChat,
  sendChatMessage,
  selectMessages,
  selectIsLoading,
  selectCurrentChat,
  fetchChatHistory,
} from "@/app/store/chat-slice/chat";
import { ChatMessages } from "@/components/ChatMessages";

const SUGGESTIONS = [
  {
    icon: <Code className="w-6 h-6 text-blue-400" />,
    text: "Write a React component",
  },
  {
    icon: <ImageIcon className="w-6 h-6 text-purple-400" />,
    text: "Generate a logo concept",
  },
  {
    icon: <Video className="w-6 h-6 text-green-400" />,
    text: "Create a short video script",
  },
  {
    icon: <FileText className="w-6 h-6 text-orange-400" />,
    text: "Draft a project proposal",
  },
];

export default function Home() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const messages = useSelector(selectMessages);
  const isLoading = useSelector(selectIsLoading);
  const currentChat = useSelector(selectCurrentChat);

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchChatHistory() as any);
    }
  }, [dispatch, isAuthenticated]);

  const resetTextarea = () => {
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    setInput(e.currentTarget.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${e.currentTarget.scrollHeight}px`;
    }
  };

  const handleSend = (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    resetTextarea();
    dispatch(sendChatMessage(trimmed) as any);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      <AppSidebar
        onNewChat={() => {
          // Only create a new chat if the current chat has been used
          const currentHasMessages =
            currentChat && currentChat.messages.length > 0;
          if (currentHasMessages || !currentChat) {
            dispatch(startNewChat());
          }
        }}
      />
      <SidebarInset className="bg-black cursor-pointer">
        <div className="flex flex-col font-geist-mono h-screen w-full text-foreground overflow-hidden">
          {/* Header */}
          <header className="flex justify-between items-center p-4 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                NxtAi
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="w-9 h-9 ml-2 cursor-pointer ring-2 ring-transparent transition-all hover:ring-primary/50 bg-transparent">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-transparent text-foreground border border-border">
                        {user?.name ? (
                          user.name.charAt(0).toUpperCase()
                        ) : (
                          <UserCircle className="w-6 h-6 text-muted-foreground" />
                        )}
                        <DropdownMenuContent
                          side="left"
                          className="w-40 mt-3 mr-2 p-2 rounded-2xl"
                        >
                          <DropdownMenuLabel className="flex justify-center items-center">
                            {user?.name}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Settings</DropdownMenuItem>
                          <DropdownMenuItem>Help</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            Logout
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                </DropdownMenu>
              ) : (
                <Button variant="outline" asChild className="ml-2">
                  <Link href="/auth/login">Login</Link>
                </Button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center overflow-hidden max-w-4xl mx-auto w-full relative">
            {hasMessages ? (
              <ChatMessages messages={messages} isLoading={isLoading} />
            ) : (
              /* Landing View */
              <div className="flex-1 flex flex-col justify-center p-4 md:p-8 mb-28 w-full">
                <div className="space-y-2 mb-12 flex flex-col pt-8">
                  <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-orange-400 bg-clip-text text-transparent pb-2">
                    Hello, Human
                  </h1>
                  <h2 className="text-4xl md:text-5xl font-semibold text-muted-foreground">
                    How can I help you today?
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {SUGGESTIONS.map((s) => (
                    <Card
                      key={s.text}
                      onClick={() => handleSend(s.text)}
                      className="p-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer border flex flex-col gap-4 rounded-2xl select-none"
                    >
                      {s.icon}
                      <div className="text-sm font-medium">{s.text}</div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="w-full max-w-3xl absolute md:mr-4  bottom-0 py-4 px-4 bg-black rounded-xl">
              <div className="relative flex items-end rounded-3xl border bg-muted/30 shadow-sm p-1 pr-4 transition-all focus-within:ring-1 focus-within:ring-border focus-within:bg-muted/50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mb-0.5 cursor-pointer rounded-full text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a prompt here..."
                  className="flex-1 border-none shadow-none focus-visible:ring-0 text-base px-2 resize-none min-h-[40px] max-h-[160px] py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  rows={1}
                />
                <div className="flex items-center gap-2 shrink-0 mb-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  {isLoading ? (
                    <Button
                      size="icon"
                      onClick={() => {
                        /* stop not supported with thunk, but UI shows correctly */
                      }}
                      className="rounded-full cursor-pointer bg-foreground text-background hover:bg-foreground/90"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      onClick={() => handleSend()}
                      disabled={!input.trim()}
                      className="rounded-full cursor-pointer bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">
                NxtAi may display inaccurate info, so double-check its
                responses.
              </p>
            </div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
}
