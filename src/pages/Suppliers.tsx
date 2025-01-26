import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns, useUserRowProps } from "@/components/users/UserColumns"
import { supabase } from "@/integrations/supabase/client"

export default function Suppliers() {
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      console.log("Fetching suppliers from Supabase")
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "supplier")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching suppliers:", error)
        throw error
      }

      console.log("Fetched suppliers:", data)
      return data
    },
  })

  const rowProps = useUserRowProps()

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Suppliers</h1>
      </div>

      <DataTable 
        columns={columns} 
        data={suppliers || []} 
        rowProps={rowProps}
      />
    </div>
  )
}