import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"
import { useDispatch } from "react-redux"
import { setSession } from "@/store/authSlice"

export default function AuthCallback() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        
        if (accessToken) {
          console.log("AuthCallback - Found access token, setting session...")
          
          // Get the current session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error("AuthCallback - Error getting session:", error)
            throw error
          }
          
          if (session) {
            console.log("AuthCallback - Valid session found, setting in Redux...")
            dispatch(setSession(session))
            navigate("/", { replace: true })
          } else {
            console.error("AuthCallback - No session found after auth")
            navigate("/auth", { replace: true })
          }
        } else {
          console.log("AuthCallback - No access token found, redirecting to auth...")
          navigate("/auth", { replace: true })
        }
      } catch (error) {
        console.error("AuthCallback - Error handling callback:", error)
        navigate("/auth", { replace: true })
      }
    }

    handleCallback()
  }, [navigate, dispatch])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
} 