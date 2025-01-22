import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { supabase } from "@/integrations/supabase/client"
import { loadSession, setSession } from "@/store/authSlice"
import { AppDispatch } from "@/store"
import { useToast } from "@/components/ui/use-toast"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()
  const { toast } = useToast()

  useEffect(() => {
    console.log("AuthProvider - Initializing...")
    
    // Initial session load
    dispatch(loadSession())
      .then((action) => {
        console.log("AuthProvider - Initial session loaded successfully", action)
        // Log the actual session data
        const session = action.payload
        if (session) {
          console.log("AuthProvider - Session details:", {
            userId: session.user?.id,
            email: session.user?.email,
            lastSignInAt: session.user?.last_sign_in_at
          })
        } else {
          console.log("AuthProvider - No session found")
        }
      })
      .catch((error) => {
        console.error("AuthProvider - Failed to load session:", error)
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Failed to load user session. Please try logging in again.",
        })
      })

    // Subscribe to auth changes
    console.log("AuthProvider - Setting up auth state change listener")
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthProvider - Auth state changed:", { 
        event, 
        userId: session?.user?.id,
        email: session?.user?.email
      })
      console.log("AuthProvider - Full session state:", session)
      
      if (event === 'SIGNED_OUT') {
        console.log("AuthProvider - User signed out, clearing session")
        dispatch(setSession(null))
      } else if (session) {
        console.log("AuthProvider - New session detected, checking profile data...")
        
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error("AuthProvider - Error fetching profile:", profileError)
        } else {
          console.log("AuthProvider - Profile found:", profile)
        }
        
        console.log("AuthProvider - Updating store with session")
        dispatch(setSession(session))
      }
    })

    return () => {
      console.log("AuthProvider - Cleaning up auth state listener")
      subscription.unsubscribe()
    }
  }, [dispatch, toast])

  return children
}