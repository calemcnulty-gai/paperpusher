import { useEffect, useState } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

const Auth = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const from = location.state?.from?.pathname || "/"
  const invitationId = searchParams.get('invitation')
  const [invitationDetails, setInvitationDetails] = useState<{ email: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkInvitation = async () => {
      if (invitationId) {
        try {
          console.log("Checking invitation:", invitationId)
          const { data: invitation, error: invitationError } = await supabase
            .from("invitations")
            .select("email, role, status, expires_at")
            .eq("id", invitationId)
            .single()

          if (invitationError) throw invitationError

          if (!invitation) {
            setError("Invalid invitation link")
            setLoading(false)
            return
          }

          if (invitation.status !== 'pending') {
            setError("This invitation has already been used")
            setLoading(false)
            return
          }

          if (new Date(invitation.expires_at) < new Date()) {
            setError("This invitation has expired")
            setLoading(false)
            return
          }

          console.log("Valid invitation found:", invitation)
          setInvitationDetails({ email: invitation.email, role: invitation.role })
        } catch (error) {
          console.error("Error checking invitation:", error)
          setError("Failed to verify invitation")
        }
      }
      setLoading(false)
    }

    checkInvitation()
  }, [invitationId])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session)
        
        if (event === "SIGNED_IN") {
          console.log("User signed in, checking profile...")
          // Create profile if it doesn't exist
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select()
            .eq("id", session?.user.id)
            .single()

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Error checking profile:", profileError)
            toast({
              variant: "destructive",
              title: "Error checking profile",
              description: profileError.message,
            })
            return
          }

          // Navigate to the page they were trying to visit or home
          console.log("Redirecting to:", from)
          navigate(from, { replace: true })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate, toast, from])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            {invitationDetails 
              ? `Sign up with your invited email: ${invitationDetails.email}`
              : "Sign in to your account or create a new one"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
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
            view={invitationDetails ? "sign_up" : "sign_in"}
            // Remove defaultEmail prop as it's not supported
            magicLink={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default Auth