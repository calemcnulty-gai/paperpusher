import { Routes, Route } from "react-router-dom"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store"
import { setupRealtimeSubscriptions } from "@/store/realtimeSlice"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { RequireAuth } from "@/components/auth/RequireAuth"
import Index from "@/pages/Index"
import Users from "@/pages/Users"
import Tasks from "@/pages/Tasks"
import { MainLayout } from "@/components/layout/MainLayout"

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
              <MainLayout>
                <Index />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/users"
          element={
            <RequireAuth>
              <MainLayout>
                <Users />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/tasks"
          element={
            <RequireAuth>
              <MainLayout>
                <Tasks />
              </MainLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  )
}