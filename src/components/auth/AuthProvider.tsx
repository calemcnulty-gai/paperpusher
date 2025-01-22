import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { supabase } from "@/integrations/supabase/client"
import { loadSession, setSession, fetchProfile } from "@/store/authSlice"
import { AppDispatch } from "@/store"
import { useToast } from "@/components/ui/use-toast"
import type { Session } from "@supabase/supabase-js"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()
  const { toast } = useToast()

  useEffect(() => {
    console.log("AuthProvider - Initializing...")
    
    // Initial session load
    dispatch(loadSession())
      .unwrap()
      .then((session) => {
        console.log("AuthProvider - Initial session loaded successfully", session)
        if (session?.user) {
          console.log("AuthProvider - Session details:", {
            userId: session.user.id,
            email: session.user.email,
            lastSignInAt: session.user.last_sign_in_at
          })
          dispatch(fetchProfile(session.user.id))
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
        dispatch(setSession(session))
        if (session.user) {
          dispatch(fetchProfile(session.user.id))
        }
      }
    })

    return () => {
      console.log("AuthProvider - Cleaning up auth state listener")
      subscription.unsubscribe()
    }
  }, [dispatch, toast])

  return children
}