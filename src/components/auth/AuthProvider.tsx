import { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"

type Profile = {
  id: string
  full_name: string | null
  role: string | null
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

function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export { useAuth }

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

      if (error) {
        console.error("Error fetching profile:", error)
        throw error
      }

      console.log("Profile data received:", data)
      return data
    } catch (error) {
      console.error("Exception in fetchProfile:", error)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...")
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Error getting session:", sessionError)
          return
        }

        if (!mounted) return

        console.log("Session retrieved:", currentSession)
        
        if (currentSession?.user) {
          setSession(currentSession)
          setUser(currentSession.user)
          
          const userProfile = await fetchProfile(currentSession.user.id)
          if (mounted && userProfile) {
            console.log("Setting profile:", userProfile)
            setProfile(userProfile)
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        if (mounted) {
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

      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      
      if (currentSession?.user) {
        const userProfile = await fetchProfile(currentSession.user.id)
        if (mounted && userProfile) {
          console.log("Setting profile after auth change:", userProfile)
          setProfile(userProfile)
        } else {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}