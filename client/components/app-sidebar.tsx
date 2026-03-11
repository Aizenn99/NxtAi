"use client";

import {
  Plus,
  MessageSquare,
  Settings,
  CircleHelp,
  History,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useSelector, useDispatch } from "react-redux";
import {
  selectChats,
  selectCurrentChatId,
  switchChat,
} from "@/app/store/chat-slice/chat";

interface AppSidebarProps {
  onNewChat?: () => void;
}

export function AppSidebar({ onNewChat }: AppSidebarProps) {
  const dispatch = useDispatch();
  const chats = useSelector(selectChats);
  const currentChatId = useSelector(selectCurrentChatId);

  return (
    <Sidebar className="border-r-0 ">
      <SidebarHeader className="p-4 pt-6">
        <Button
          variant="outline"
          onClick={onNewChat}
          className="w-full justify-start  cursor-pointer gap-3 rounded-full h-11 px-4 bg-transparent border-border hover:bg-muted/50"
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">New chat</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs  font-semibold text-muted-foreground px-2 py-4">
            Recent
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.length === 0 ? (
                <p className="text-xs  text-muted-foreground px-3 py-2">
                  No chats yet
                </p>
              ) : (
                [...chats].reverse().map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      variant="default"
                      isActive={chat.id === currentChatId}
                      onClick={() => dispatch(switchChat(chat.id))}
                      className="w-full justify-start gap-3 rounded-xl cursor-pointer px-3 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors data-[active=true]:bg-muted/60 data-[active=true]:text-foreground"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="default"
              className="w-full justify-start gap-3 rounded-xl px-3 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <CircleHelp className="h-4 w-4 shrink-0" />
              <span>Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="default"
              className="w-full justify-start gap-3 rounded-xl px-3 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <History className="h-4 w-4 shrink-0" />
              <span>Activity</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="default"
              className="w-full justify-start gap-3 rounded-xl px-3 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
