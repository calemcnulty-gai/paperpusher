import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"

export default function AuthPage() {
  console.log("AuthPage - Rendering with URL:", window.location.origin)
  
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