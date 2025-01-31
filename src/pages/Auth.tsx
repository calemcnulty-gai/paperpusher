import { useEffect } from "react"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()
  
  console.log("AuthPage - Auth state:", { isAuthenticated, loading })
  
  useEffect(() => {
    if (isAuthenticated) {
      console.log("AuthPage - User is authenticated, redirecting to home")
      const from = location.state?.from?.pathname || "/"
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Use REDIRECT_URL from env, or construct it from SITE_URL, or use window.location.origin as last resort
  const redirectTo = process.env.REDIRECT_URL || 
    (process.env.SITE_URL ? `${process.env.SITE_URL}/auth/v1/callback` : new URL("/auth/v1/callback", window.location.origin).toString())
  console.log("AuthPage - Setting redirect URL to:", redirectTo)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google"]}
          redirectTo={redirectTo}
        />
      </div>
    </div>
  )
}