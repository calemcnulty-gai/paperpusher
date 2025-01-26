import { Profile } from "@/types/profiles"
import { cn } from "@/lib/utils"

interface MentionDropdownProps {
  items: Array<Profile | Product>
  type: "user" | "product"
  onSelect: (item: Profile | Product) => void
  position: { x: number; y: number }
}

interface Product {
  id: string
  name: string
  sku: string
}

export function MentionDropdown({ items, type, onSelect, position }: MentionDropdownProps) {
  return (
    <div
      className="absolute z-50 w-64 bg-white border rounded-md shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="py-1">
        {items.map((item) => (
          <button
            key={item.id}
            className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground"
            onClick={() => onSelect(item)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {type === "user" ? (item as Profile).full_name : (item as Product).name}
              </span>
              <span className="text-muted-foreground">
                {type === "user" 
                  ? `@${(item as Profile).email?.split('@')[0]}`
                  : `#${(item as Product).sku}`
                }
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}