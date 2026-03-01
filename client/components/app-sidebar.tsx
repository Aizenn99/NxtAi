"use client";

import { Plus, MessageSquare, Settings, CircleHelp, Gem, History } from "lucide-react";
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

// Dummy data for recent chats
const recentChats = [
  { id: "1", title: "React Component Help" },
  { id: "2", title: "Generate landing page" },
  { id: "3", title: "Write a python script" },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r-0 ">
      <SidebarHeader className="p-4 pt-6">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 rounded-full h-11 px-4 bg-transparent border-border hover:bg-muted/50"
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">New chat</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2 py-4">
            Recent
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton 
                    variant="default" 
                    className="w-full justify-start gap-3 rounded-xl px-3 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
