import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Get the hash from the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get("access_token")
    
    if (accessToken) {
      console.log("AuthCallback - Found access token, setting session...")
      // The session will be automatically handled by Supabase's internal listeners
      // Just navigate to home
      navigate("/", { replace: true })
    } else {
      console.log("AuthCallback - No access token found, redirecting to auth...")
      navigate("/auth", { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
} 