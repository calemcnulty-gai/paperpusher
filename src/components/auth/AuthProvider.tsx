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
    // Initial session load
    dispatch(loadSession()).catch((error) => {
      console.error("Failed to load session:", error)
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Failed to load user session. Please try logging in again.",
      })
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session)
      if (event === 'SIGNED_OUT') {
        dispatch(setSession(null))
      } else if (session) {
        dispatch(setSession(session))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch, toast])

  return children
}