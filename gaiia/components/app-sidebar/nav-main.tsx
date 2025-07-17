"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useAppFeature } from "@/lib/hooks/use-features";

export function NavMain() {
  const { currentFeature, currentMenu } = useAppFeature();

  return (
    <SidebarGroup className="">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {currentFeature.menus.map((menu) => (
          <SidebarMenuItem key={menu.name}>
            <SidebarMenuButton asChild isActive={currentMenu?.id === menu.id}>
              <a href={menu.url}>
                <menu.icon />
                <span>{menu.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
