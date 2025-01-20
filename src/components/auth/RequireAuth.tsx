import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./AuthProvider"

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  console.log("RequireAuth - Current location:", location.pathname)
  console.log("RequireAuth - Auth state:", { user, loading })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    console.log("RequireAuth - No user, redirecting to /auth")
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  console.log("RequireAuth - User authenticated, rendering children")
  return <>{children}</>
}