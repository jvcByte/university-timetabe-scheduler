"use client";

import { BookOpen, Building, Calendar, LayoutDashboard, Settings, Sparkles, TrendingUp, Users, UsersRound } from "lucide-react"
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sidebarData: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Analytics",
        href: "/admin/analytics",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Courses",
        href: "/admin/courses",
        icon: BookOpen,
      },
      {
        title: "Instructors",
        href: "/admin/instructors",
        icon: Users,
      },
      {
        title: "Rooms",
        href: "/admin/rooms",
        icon: Building,
      },
      {
        title: "Student Groups",
        href: "/admin/groups",
        icon: UsersRound,
      },
    ],
  },
  {
    title: "Scheduling",
    items: [
      {
        title: "Timetables",
        href: "/admin/timetables",
        icon: Calendar,
      },
      {
        title: "Generate",
        href: "/admin/timetables/generate",
        icon: Sparkles,
        highlight: true,
      },
      {
        title: "Constraints",
        href: "/admin/constraints",
        icon: Settings,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarContent>
        {sidebarData.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}