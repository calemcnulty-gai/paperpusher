import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns, useUserRowProps } from "@/components/users/UserColumns"
import { supabase } from "@/integrations/supabase/client"

export default function Principals() {
  const { data: principals, isLoading } = useQuery({
    queryKey: ["principals"],
    queryFn: async () => {
      console.log("Fetching principals from Supabase")
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "principal")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching principals:", error)
        throw error
      }

      console.log("Fetched principals:", data)
      return data
    },
  })

  const rowProps = useUserRowProps()

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Principals</h1>
      </div>

      <DataTable 
        columns={columns} 
        data={principals || []} 
        rowProps={rowProps}
      />
    </div>
  )
}