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
      .then(() => {
        console.log("AuthProvider - Initial session loaded successfully")
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthProvider - Auth state changed:", { event, sessionId: session?.user?.id })
      console.log("AuthProvider - Full session state:", session)
      
      if (event === 'SIGNED_OUT') {
        console.log("AuthProvider - User signed out, clearing session")
        dispatch(setSession(null))
      } else if (session) {
        console.log("AuthProvider - New session detected, updating store")
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