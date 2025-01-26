import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  CheckSquare,
} from "lucide-react"

export function SidebarMenu() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="space-y-1">
      <Link to="/">
        <Button
          variant="sidebar"
          className={cn(
            "w-full justify-start",
            isActive("/") && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link to="/products">
        <Button
          variant="sidebar"
          className={cn(
            "w-full justify-start",
            isActive("/products") && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Products
        </Button>
      </Link>
      <Link to="/documents">
        <Button
          variant="sidebar"
          className={cn(
            "w-full justify-start",
            isActive("/documents") && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <FileText className="mr-2 h-4 w-4" />
          Documents
        </Button>
      </Link>
      <Link to="/tasks">
        <Button
          variant="sidebar"
          className={cn(
            "w-full justify-start",
            isActive("/tasks") && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <CheckSquare className="mr-2 h-4 w-4" />
          Tasks
        </Button>
      </Link>
    </div>
  )
}