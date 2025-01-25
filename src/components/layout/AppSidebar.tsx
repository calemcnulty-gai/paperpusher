import { Home, Package, Users, ListTodo, UserRound, UsersRound } from "lucide-react"
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
import { Link } from "react-router-dom"

const menuItems = [
  { title: "Dashboard", icon: Home, url: "/" },
  { title: "Products", icon: Package, url: "/products" },
  { title: "Tasks", icon: ListTodo, url: "/tasks" },
  { title: "Clients", icon: Users, url: "/users?role=client" },
  { title: "Suppliers", icon: UsersRound, url: "/users?role=supplier" },
  { title: "Principals", icon: UserRound, url: "/users?role=principal" },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-bold">Inventory</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}