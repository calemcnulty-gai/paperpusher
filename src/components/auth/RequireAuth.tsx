import { Navigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { Loader2 } from "lucide-react"
import { RootState } from "@/store"

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useSelector((state: RootState) => state.auth)
  const location = useLocation()

  console.log("RequireAuth - Current location:", location.pathname)
  console.log("RequireAuth - Auth state:", { user, loading })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    console.log("RequireAuth - No user, redirecting to /auth")
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  console.log("RequireAuth - User authenticated, rendering children")
  return <>{children}</>
}