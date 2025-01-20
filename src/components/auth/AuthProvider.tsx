import { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"

type Profile = {
  id: string
  full_name: string | null
  role: string | null  // Explicitly mark as nullable
  email: string
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
})

// Export the hook as a named export directly
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    console.log("Fetching profile for user:", userId)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, email")
        .eq("id", userId)
        .single()

      console.log("Initial profile fetch result:", { data, error })

      if (error) {
        console.error("Error fetching profile:", error.message, error.details, error.hint)
        return null
      }

      if (!data) {
        console.log("No profile found, attempting to create one...")
        // Get current user details for profile creation
        const currentUser = user || (await supabase.auth.getUser()).data.user
        console.log("Current user for profile creation:", currentUser)

        if (!currentUser?.email) {
          console.error("Cannot create profile: no email available")
          return null
        }

        const profileData = {
          id: userId,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || null,
          role: 'customer' // Default role
        }
        console.log("Attempting to create profile with data:", profileData)

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert(profileData)
          .select()
          .single()

        if (createError) {
          console.error("Error creating profile:", createError.message, createError.details, createError.hint)
          return null
        }

        console.log("Successfully created new profile:", newProfile)
        return newProfile as Profile
      }

      console.log("Profile data received:", data)
      return data as Profile
    } catch (error) {
      console.error("Exception in fetchProfile:", error)
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack)
      }
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...")
        setLoading(true)
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Error getting session:", sessionError)
          if (mounted) setLoading(false)
          return
        }

        if (!mounted) return

        console.log("Session retrieved:", currentSession)
        
        if (currentSession?.user) {
          setSession(currentSession)
          setUser(currentSession.user)
          
          const userProfile = await fetchProfile(currentSession.user.id)
          if (mounted) {
            if (userProfile) {
              console.log("Setting profile:", userProfile)
              setProfile(userProfile)
            } else {
              console.log("No profile available")
              setProfile(null)
            }
          }
        } else {
          console.log("No active session")
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        if (mounted) {
          console.log("Setting loading to false")
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession)
      
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      
      if (currentSession?.user) {
        const userProfile = await fetchProfile(currentSession.user.id)
        if (mounted) {
          if (userProfile) {
            console.log("Setting profile after auth change:", userProfile)
            setProfile(userProfile)
          } else {
            console.log("No profile after auth change")
            setProfile(null)
          }
        }
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      console.log("Cleaning up auth effect")
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user,
    profile,
    loading
  }

  console.log("AuthProvider state:", value)

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}