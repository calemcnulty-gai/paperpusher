import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { ProductFormValues } from "../ProductForm"

interface PricingFieldsProps {
  form: UseFormReturn<ProductFormValues>
}

export function PricingFields({ form }: PricingFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <FormField
        control={form.control}
        name="material"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Material</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="wholesale_price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Wholesale Price</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="retail_price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Retail Price</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}