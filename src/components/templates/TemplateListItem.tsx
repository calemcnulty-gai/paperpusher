import { Button } from "@/components/ui/button"
import { MessageSquare, Edit, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Template = {
  id: string
  title: string
  content: string
  created_at: string
  category: string | null
  category_id: string | null
  usage_count: number
}

type TemplateListItemProps = {
  template: Template
  onSelect?: (content: string) => void
  onEdit: (template: Template) => void
  onDelete: (id: string) => void
  showActions?: boolean
}

export function TemplateListItem({ 
  template, 
  onSelect, 
  onEdit, 
  onDelete, 
  showActions = true 
}: TemplateListItemProps) {
  return (
    <div className="flex items-center justify-between group">
      <Button
        variant="ghost"
        className="w-full justify-start mr-2"
        onClick={() => onSelect?.(template.content)}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        <span className="truncate">{template.title}</span>
        {template.usage_count > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">
            Used {template.usage_count} times
          </span>
        )}
      </Button>
      
      {showActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
              <Edit className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onEdit(template)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(template.id)}
              className="text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}