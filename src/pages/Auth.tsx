import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const Auth = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const from = location.state?.from?.pathname || "/"

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session)
        if (event === "SIGNED_IN") {
          // Create profile if it doesn't exist
          const { data: profile } = await supabase
            .from("profiles")
            .select()
            .eq("id", session?.user.id)
            .single()

          if (!profile) {
            const { error: profileError } = await supabase
              .from("profiles")
              .insert({
                id: session?.user.id,
                email: session?.user.email,
                full_name: session?.user.user_metadata.full_name,
              })

            if (profileError) {
              toast({
                variant: "destructive",
                title: "Error creating profile",
                description: profileError.message,
              })
              return
            }
          }

          // Navigate to the page they were trying to visit or home
          navigate(from, { replace: true })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate, toast, from])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupabaseAuth
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
            providers={["google", "github"]}
            redirectTo={window.location.origin}
            view="sign_in"
            showLinks={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default Auth