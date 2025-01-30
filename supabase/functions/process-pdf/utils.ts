import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { encode } from "https://deno.land/std@0.208.0/encoding/base64.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { ProductData } from './types.ts'

// Re-export utilities from their respective modules
export { corsHeaders, initSupabaseClient } from './supabaseClient.ts'
export { downloadAndConvertPDF, updateDocumentContent } from './documentProcessing.ts'
export { storeProductImage } from './imageProcessing.ts'
export { createProduct } from './productProcessing.ts'

// Utility functions for common operations

/**
 * Sleep for a specified number of milliseconds
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Retry a function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> => {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === maxRetries) break
      
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`)
}

/**
 * Safely parse JSON with error handling
 */
export const safeJsonParse = <T>(str: string, fallback: T): T => {
  try {
    return JSON.parse(str)
  } catch (e) {
    console.error('Failed to parse JSON:', e)
    return fallback
  }
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export const truncate = (str: string, maxLength: number = 100): string => {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Clean and normalize SKUs
 */
export const normalizeSkuFormat = (sku: string): string => {
  return sku.trim().toUpperCase().replace(/\s+/g, '-')
}

/**
 * Validate a URL is well-formed
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}