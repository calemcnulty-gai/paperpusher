import { Routes, Route } from "react-router-dom"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store"
import { setupRealtimeSubscriptions } from "@/store/realtimeSlice"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { RequireAuth } from "@/components/auth/RequireAuth"
import Index from "@/pages/Index"
import Products from "@/pages/Products"

export const AuthenticatedRoutes = () => {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(setupRealtimeSubscriptions())
  }, [dispatch])

  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Index />
            </RequireAuth>
          }
        />
        <Route
          path="/products"
          element={
            <RequireAuth>
              <Products />
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  )
}