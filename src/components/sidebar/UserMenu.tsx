import { Link } from "react-router-dom"
import { Users } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const userMenuItems = [
  { title: "Clients", icon: Users, url: "/users?role=client" },
  { title: "Suppliers", icon: Users, url: "/users?role=supplier" },
  { title: "Principals", icon: Users, url: "/users?role=principal" },
]

export function UserMenu() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Users</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {userMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}