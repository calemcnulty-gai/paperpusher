import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { supabase } from "@/integrations/supabase/client"
import { loadSession, setSession, fetchProfile, setInitialized } from "@/store/authSlice"
import { AppDispatch, RootState } from "@/store"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()
  const { toast } = useToast()
  const { isInitializing, error } = useSelector((state: RootState) => state.auth)

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
          return dispatch(fetchProfile(session.user.id))
        } else {
          console.log("AuthProvider - No session found")
          dispatch(setInitialized())
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

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return children
}