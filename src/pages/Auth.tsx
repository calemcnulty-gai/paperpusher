import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

export default function AuthPage() {
  const { toast } = useToast()

  useEffect(() => {
    console.log("Auth component mounted")
    console.log("Current origin:", window.location.origin)
    console.log("Current URL:", window.location.href)
    
    // Listen for auth state changes to debug
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", { event, session })
      
      if (event === 'SIGNED_IN') {
        console.log("User signed in successfully:", session?.user)
        toast({
          title: "Signed in successfully",
          description: `Welcome ${session?.user.email}!`
        })
      }
      if (event === 'SIGNED_OUT') {
        console.log("User signed out")
      }
      if (event === 'USER_UPDATED') {
        console.log("User was updated:", session?.user)
      }
      if (event === 'TOKEN_REFRESHED') {
        console.log("Token was refreshed")
      }
    })

    // Test Supabase connection and configuration
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        console.log("Current session test:", { data, error })

        // Log Supabase configuration using the public URL from the client
        console.log("Auth callback URL:", `${window.location.origin}/auth/callback`)
      } catch (err) {
        console.error("Error testing Supabase connection:", err)
      }
    }
    
    testConnection()

    // Function to handle Google sign in
    const handleGoogleSignIn = async (e: MouseEvent) => {
      console.log("Google sign-in button clicked")
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          }
        })
        console.log("SignInWithOAuth response:", { data, error })
        if (error) {
          console.error("OAuth error:", error)
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message
          })
        }
      } catch (err) {
        console.error("Error during OAuth flow:", err)
      }
    }

    // Add click event listener to Google button with mutation observer
    const observer = new MutationObserver((mutations, obs) => {
      const googleButton = document.querySelector('button[data-provider="google"]')
      if (googleButton) {
        console.log("Found Google sign-in button, adding click listener")
        googleButton.addEventListener('click', handleGoogleSignIn)
        obs.disconnect() // Stop observing once we find the button
        return
      }
    })

    // Start observing the document with the configured parameters
    observer.observe(document, {
      childList: true,
      subtree: true
    })

    return () => {
      console.log("Auth component unmounting, cleaning up subscription")
      subscription.unsubscribe()
      observer.disconnect()
      
      // Clean up click listener
      const googleButton = document.querySelector('button[data-provider="google"]')
      if (googleButton) {
        googleButton.removeEventListener('click', handleGoogleSignIn)
        console.log("Removed Google button click listener")
      }
    }
  }, [toast])

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
              className: {
                button: "bg-primary hover:bg-primary/90",
              },
            }}
            providers={["google"]}
            redirectTo={`${window.location.origin}/auth/callback`}
            onlyThirdPartyProviders={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}