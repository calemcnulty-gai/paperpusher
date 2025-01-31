import { createClient } from 'npm:@supabase/supabase-js'
import { Action, AgentResponse, UserProfile, UpdateProductPayload } from '../../shared/types.ts'
import { getSupabaseClient } from '../config/supabase.ts'

export interface ProductExecutor {
  execute(action: Action, userProfile: UserProfile): Promise<AgentResponse>
}

class ProductExecutorImpl implements ProductExecutor {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = getSupabaseClient()
  }

  private isUpdateProductPayload(payload: any): payload is UpdateProductPayload {
    return payload && 'id' in payload && 'updates' in payload
  }

  async execute(action: Action, userProfile: UserProfile): Promise<AgentResponse> {
    if (action.type !== 'UPDATE_PRODUCT') {
      throw new Error(`ProductExecutor cannot handle action type: ${action.type}`)
    }

    if (userProfile.role !== 'principal') {
      throw new Error('Only principal users can update products')
    }

    return this.updateProduct(action, userProfile)
  }

  private async updateProduct(action: Action, userProfile: UserProfile): Promise<AgentResponse> {
    if (!this.isUpdateProductPayload(action.payload)) {
      throw new Error('Invalid payload for UPDATE_PRODUCT')
    }

    console.log('🔄 Updating product', {
      productId: action.payload.id,
      updates: action.payload.updates
    })

    const { data, error } = await this.supabase
      .from('products')
      .update(action.payload.updates)
      .eq('id', action.payload.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Product update failed', error)
      throw error
    }

    console.log('✅ Product updated successfully', {
      productId: data.id,
      updatedFields: Object.keys(action.payload.updates)
    })

    return {
      message: `Product updated successfully.`,
      action: {
        type: 'UPDATE_PRODUCT',
        status: 'success',
        data,
        links: {
          product: `/products/${data.id}`
        }
      }
    }
  }
}

export async function createProductExecutor(): Promise<ProductExecutor> {
  return new ProductExecutorImpl()
} 