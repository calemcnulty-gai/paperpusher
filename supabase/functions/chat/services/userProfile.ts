import { createClient } from 'npm:@supabase/supabase-js'
import { UserProfile } from '../../shared/types.ts'
import { envConfig } from '../config/langchain.ts'

export async function getUserProfile(authHeader: string): Promise<UserProfile> {
  console.log('👤 Getting user profile from auth header')
  
  const supabase = createClient(
    envConfig.SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Get user from auth header
  console.log('🔑 Fetching user from auth')
  const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (userError) {
    console.error('❌ Auth user fetch failed', userError)
    throw userError
  }
  if (!user) {
    console.error('❌ User not found')
    throw new Error('User not found')
  }
  console.log('✅ Auth user found', {
    userId: user.id,
    email: user.email
  })

  // Get user's role from profiles table
  console.log('🔍 Fetching user profile')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (profileError) {
    console.error('❌ Profile fetch failed', profileError)
    throw profileError
  }
  console.log('✅ Profile found', {
    role: profile?.role || 'user'
  })

  const fullProfile: UserProfile = {
    ...user,
    role: profile?.role || 'user'
  }
  console.log('👤 Complete user profile assembled', {
    userId: fullProfile.id,
    role: fullProfile.role
  })
  
  return fullProfile
} 