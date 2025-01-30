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

// Helper function to transform string to number
const stringToNumber = (val: string | null | undefined) => {
  if (!val) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  wholesale_price: z.string()
    .transform(stringToNumber)
    .pipe(z.number().nullable()),
  retail_price: z.string()
    .transform(stringToNumber)
    .pipe(z.number().nullable()),
  season: z.string().optional(),
})

// Define the input type (what the form accepts)
export type ProductFormInput = z.input<typeof productSchema>
// This is what the form components need
export type ProductFormValues = ProductFormInput

// Define the output type (after transformation)
export type ProductFormOutput = z.output<typeof productSchema>

export interface Product extends ProductFormOutput {
  id: string
  supplier_id: string
  created_at: string
  image_url?: string
}

interface ProductFormProps {
  onSuccess: () => void
  userId: string | undefined
  product?: Product
}

export function ProductForm({ onSuccess, userId, product }: ProductFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      brand: product?.brand ?? "",
      color: product?.color ?? "",
      material: product?.material ?? "",
      wholesale_price: product?.wholesale_price?.toString() ?? "",
      retail_price: product?.retail_price?.toString() ?? "",
      season: product?.season ?? "all",
    },
  })

  const onSubmit = async (data: ProductFormInput) => {
    try {
      // Transform the data using the schema
      const transformedData = productSchema.parse(data)
      const productData = {
        name: transformedData.name,
        sku: transformedData.sku,
        brand: transformedData.brand,
        color: transformedData.color,
        material: transformedData.material,
        wholesale_price: transformedData.wholesale_price,
        retail_price: transformedData.retail_price,
        season: transformedData.season,
        supplier_id: userId,
      }

      console.log('Submitting product data:', productData)
      
      let error;
      if (product) {
        // Update existing product
        ({ error } = await supabase
          .from("products")
          .update(productData)
          .eq('id', product.id))
      } else {
        // Create new product
        ({ error } = await supabase
          .from("products")
          .insert(productData))
      }

      if (error) throw error

      toast({
        title: "Success",
        description: `Product ${product ? 'updated' : 'created'} successfully`,
      })
      
      queryClient.invalidateQueries({ queryKey: ["products"] })
      onSuccess()
      if (!product) form.reset() // Only reset form for new products
    } catch (error) {
      console.error(`Error ${product ? 'updating' : 'creating'} product:`, error)
      toast({
        title: "Error",
        description: `Failed to ${product ? 'update' : 'create'} product`,
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
          <Button type="submit">{product ? 'Update' : 'Save'}</Button>
        </div>
      </form>
    </Form>
  )
}
