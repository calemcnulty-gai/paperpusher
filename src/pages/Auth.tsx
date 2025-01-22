import { useEffect, useState } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/store"
import { setSession, signOut } from "@/store/authSlice"

type InvitationDetails = {
  email: string
  role: string
  invitedBy: string
  teamName?: string
}

type InvitationResponse = {
  email: string
  role: string
  status: string
  expires_at: string
  teams: { name: string } | null
  profiles: { full_name: string } | null
}

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const from = location.state?.from?.pathname || "/"
  const invitationId = searchParams.get("invitation")

  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redux session state
  const dispatch = useAppDispatch()
  const { session } = useAppSelector((state) => state.auth)

  // Load the invitation details if any
  useEffect(() => {
    async function loadInvitation() {
      if (!invitationId) {
        setLoading(false)
        return
      }
      try {
        // If we have an invitation, sign out previous user to allow new sign-up flow
        await dispatch(signOut()).unwrap()

        const { data: invitation, error: invitationError } = await supabase
          .from("invitations")
          .select(`
            email,
            role,
            status,
            expires_at,
            teams:team_id (name),
            profiles!invitations_invited_by_fkey (full_name)
          `)
          .eq("id", invitationId)
          .single()

        if (invitationError) throw invitationError
        if (!invitation) {
          setError("Invalid invitation link.")
          setLoading(false)
          return
        }

        const typedInv = invitation as unknown as InvitationResponse
        if (typedInv.status !== "pending") {
          setError("This invitation has already been used.")
          setLoading(false)
          return
        }
        if (new Date(typedInv.expires_at) < new Date()) {
          setError("This invitation has expired.")
          setLoading(false)
          return
        }

        setInvitationDetails({
          email: typedInv.email,
          role: typedInv.role,
          invitedBy: typedInv.profiles?.full_name || "Someone",
          teamName: typedInv.teams?.name,
        })
      } catch (err: any) {
        console.error("Error verifying invitation:", err)
        setError("Failed to verify invitation.")
      } finally {
        setLoading(false)
      }
    }
    loadInvitation()
  }, [invitationId, dispatch])

  // If user is already signed in and there's no invitation, redirect
  useEffect(() => {
    if (session && !invitationId) {
      navigate(from, { replace: true })
    }
  }, [session, invitationId, from, navigate])

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
          <CardTitle className="text-2xl font-bold">
            {invitationDetails ? "Accept Invitation" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {invitationDetails
              ? `${invitationDetails.invitedBy} invited you to join ${
                  invitationDetails.teamName
                    ? `the ${invitationDetails.teamName} team`
                    : "AutoCRM"
                } as ${
                  invitationDetails.role === "admin"
                    ? "an administrator"
                    : `a ${invitationDetails.role}`
                }`
              : "Sign in to your account or create a new one."}
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
            providers={invitationDetails ? [] : ["google", "github"]}
            redirectTo={window.location.origin}
            // If invitation is present, show sign up view
            view={invitationDetails ? "sign_up" : "sign_in"}
            magicLink={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}