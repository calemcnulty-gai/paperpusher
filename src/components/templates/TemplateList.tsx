import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

type Template = {
  id: string
  title: string
  content: string
  created_at: string
}

type TemplateListProps = {
  onSelect: (content: string) => void
}

export function TemplateList({ onSelect }: TemplateListProps) {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["response-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("response_templates")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (error) throw error
      return data as Template[]
    }
  })

  if (isLoading) {
    return <div>Loading templates...</div>
  }

  if (!templates || templates.length === 0) {
    return <div className="text-sm text-muted-foreground">No templates available</div>
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onSelect(template.content)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {template.title}
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}