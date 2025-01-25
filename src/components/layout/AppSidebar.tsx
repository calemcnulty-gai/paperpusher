import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { SidebarMenu } from "@/components/sidebar/SidebarMenu"
import { UserMenu } from "@/components/sidebar/UserMenu"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-bold">Inventory</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu />
        <UserMenu />
      </SidebarContent>
    </Sidebar>
  )
}