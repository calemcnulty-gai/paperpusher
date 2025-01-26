import { forwardRef } from "react"
import { MentionsInput } from "@/components/ui/mentions-input/MentionsInput"
import { cn } from "@/lib/utils"

export interface EnhancedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  multiline?: boolean
  className?: string
  disableUserMentions?: boolean
  disableProductMentions?: boolean
}

const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className, 
    multiline = false, 
    value = "", 
    onChange,
    disableUserMentions = false,
    disableProductMentions = false,
    ...props 
  }, ref) => {
    return (
      <MentionsInput
        value={value}
        onChange={onChange || (() => {})}
        multiline={multiline}
        disableUserMentions={disableUserMentions}
        disableProductMentions={disableProductMentions}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          multiline && "min-h-[80px] h-auto",
          className
        )}
        {...props}
      />
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput }