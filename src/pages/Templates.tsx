import { MainLayout } from "@/components/layout/MainLayout"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { CreateTemplateModal } from "@/components/templates/CreateTemplateModal"
import { format } from "date-fns"
import MDEditor from '@uiw/react-md-editor'

export default function Templates() {
  const { data: templates } = useQuery({
    queryKey: ["response-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("response_templates")
        .select(`
          *,
          creator:profiles!response_templates_created_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Response Templates</h1>
          <CreateTemplateModal />
        </div>

        <div className="grid gap-4">
          {templates?.map((template) => (
            <div
              key={template.id}
              className="p-4 rounded-lg border bg-card text-card-foreground"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{template.title}</h3>
                <div className="text-sm text-muted-foreground">
                  Created by {template.creator.full_name} on{" "}
                  {format(new Date(template.created_at), "MMM d, yyyy")}
                </div>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MDEditor.Markdown source={template.content} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}