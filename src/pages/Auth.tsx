import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect } from "react"

export default function AuthPage() {
  useEffect(() => {
    // Listen for auth state changes to debug
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", { event, session })
      if (event === 'SIGNED_IN') {
        console.log("User signed in successfully:", session?.user)
      }
      if (event === 'SIGNED_OUT') {
        console.log("User signed out")
      }
      if (event === 'USER_DELETED') {
        console.log("User was deleted")
      }
      if (event === 'USER_UPDATED') {
        console.log("User was updated:", session?.user)
      }
      // Log any error events
      if (event === 'TOKEN_REFRESHED') {
        console.log("Token was refreshed")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome to AutoCRM</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "rgb(var(--primary))",
                    brandAccent: "rgb(var(--primary))",
                  },
                },
              },
            }}
            providers={["google"]}
            redirectTo={window.location.origin}
            onError={(error) => {
              console.error("Auth error:", error)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}