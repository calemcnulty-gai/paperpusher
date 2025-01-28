import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "./ImageUpload"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { BasicInfoFields } from "./form/BasicInfoFields"
import { DetailsFields } from "./form/DetailsFields"
import { PricingFields } from "./form/PricingFields"

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  wholesale_price: z.string()
    .transform(val => val ? parseFloat(val) : null)
    .optional()
    .nullable(),
  retail_price: z.string()
    .transform(val => val ? parseFloat(val) : null)
    .optional()
    .nullable(),
  season: z.string().optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  onSuccess: () => void
  userId: string | undefined
}

export function ProductForm({ onSuccess, userId }: ProductFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      brand: "",
      color: "",
      material: "",
      wholesale_price: "",
      retail_price: "",
      season: "all",
    },
  })

  const onSubmit = async (data: ProductFormValues) => {
    try {
      console.log('Submitting product data:', { ...data, supplier_id: userId })
      
      const { error } = await supabase
        .from("products")
        .insert({
          ...data,
          supplier_id: userId,
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Product created successfully",
      })
      
      queryClient.invalidateQueries({ queryKey: ["products"] })
      onSuccess()
      form.reset()
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <BasicInfoFields form={form} />
        <DetailsFields form={form} />
        <PricingFields form={form} />
        <div className="grid grid-cols-2 gap-4">
          <ImageUpload />
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  )
}