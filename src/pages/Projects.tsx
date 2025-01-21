import { MainLayout } from "@/components/layout/MainLayout"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { columns } from "@/components/projects/ProjectColumns"

const Projects = () => {
  const { toast } = useToast()
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load projects",
        })
        throw error
      }

      return data
    },
  })

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Button>Create Project</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={projects || []} />
        )}
      </div>
    </MainLayout>
  )
}

export default Projects