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

  const redirectTo = `${window.location.origin}/auth/v1/callback`
  console.log("AuthPage - Setting redirect URL to:", redirectTo)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome to AutoCRM</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google"]}
          redirectTo={redirectTo}
          onlyThirdPartyProviders={true}
        />
      </div>
    </div>
  )
}