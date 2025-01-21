import { Home, Inbox, Users, Settings, BarChart3, FolderKanban, UserSquare2 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

const menuItems = [
  { title: "Dashboard", icon: Home, url: "/" },
  { title: "Tickets", icon: Inbox, url: "/tickets" },
  { title: "Teams", icon: UserSquare2, url: "/teams", adminOnly: true },
  { title: "Customers", icon: Users, url: "/customers" },
  { title: "Projects", icon: FolderKanban, url: "/projects" },
  { title: "Reports", icon: BarChart3, url: "/reports" },
  { title: "Settings", icon: Settings, url: "/settings" },
]

export function AppSidebar() {
  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      
      return profile?.role
    }
  })

  // Filter out Projects menu item for customers and Teams for non-admins
  const filteredMenuItems = menuItems.filter(item => {
    if (item.title === "Projects" && userRole === "customer") {
      return false
    }
    if (item.adminOnly && userRole !== "admin") {
      return false
    }
    return true
  })

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-bold">AutoCRM</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}