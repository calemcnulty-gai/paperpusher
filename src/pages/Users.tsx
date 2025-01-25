import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { columns } from "@/components/users/UserColumns"
import { InviteUserDialog } from "@/components/users/InviteUserDialog"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export default function Users() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const role = searchParams.get("role") || "client"

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", role],
    queryFn: async () => {
      console.log("Fetching users with role:", role)
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", role)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching users:", error)
        throw error
      }

      console.log("Fetched users:", profiles)
      return profiles
    },
  })

  const roleDisplayName = role.charAt(0).toUpperCase() + role.slice(1) + "s"

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{roleDisplayName}</h1>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite {roleDisplayName.slice(0, -1)}
        </Button>
      </div>

      <DataTable columns={columns} data={users || []} />

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        defaultRole={role}
      />
    </div>
  )
}