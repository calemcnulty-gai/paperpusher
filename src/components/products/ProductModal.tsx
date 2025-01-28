import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProductForm, Product } from "./ProductForm"

interface ProductModalProps {
  product?: Product | null // Optional product for editing
  isOpen: boolean
  onClose: () => void
  userId: string | undefined
}

export function ProductModal({ product, isOpen, onClose, userId }: ProductModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Create Product'}</DialogTitle>
        </DialogHeader>
        <ProductForm 
          onSuccess={onClose}
          userId={userId}
          product={product ?? undefined}
        />
      </DialogContent>
    </Dialog>
  )
} 