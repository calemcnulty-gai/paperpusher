import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns, useUserRowProps } from "@/components/users/UserColumns"
import { supabase } from "@/integrations/supabase/client"

export default function Users() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log("Fetching users from Supabase")
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching users:", error)
        throw error
      }

      console.log("Fetched users:", data)
      return data
    },
  })

  const rowProps = useUserRowProps()

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
      </div>

      <DataTable 
        columns={columns} 
        data={users || []} 
        rowProps={rowProps}
      />
    </div>
  )
}