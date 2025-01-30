import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns, useUserRowProps } from "@/components/users/UserColumns"
import { supabase } from "@/integrations/supabase/client"

export default function Clients() {
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      console.log("Fetching clients from Supabase")
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching clients:", error)
        throw error
      }

      console.log("Fetched clients:", data)
      return data
    },
  })

  const rowProps = useUserRowProps()

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Clients</h1>
      </div>

      <DataTable 
        columns={columns} 
        data={clients || []} 
      />
    </div>
  )
}