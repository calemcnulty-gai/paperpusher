import { Link } from "react-router-dom"
import { Home, Package, ListTodo, Users } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu as BaseSidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", icon: Home, url: "/" },
  { title: "Products", icon: Package, url: "/products" },
  { title: "Tasks", icon: ListTodo, url: "/tasks" },
]

export function SidebarMenu() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
      <SidebarGroupContent>
        <BaseSidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </BaseSidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}