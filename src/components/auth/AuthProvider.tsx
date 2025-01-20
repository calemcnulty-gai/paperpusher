import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { supabase } from "@/integrations/supabase/client"
import { loadSession, setSession } from "@/store/authSlice"
import { AppDispatch } from "@/store"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // Initial session load
    dispatch(loadSession())

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        dispatch(setSession(null))
      } else if (session) {
        dispatch(setSession(session))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch])

  return children;
}