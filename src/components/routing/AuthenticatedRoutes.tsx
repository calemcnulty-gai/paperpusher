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
import Clients from "@/pages/Clients"
import ClientDetail from "@/pages/ClientDetail"
import SupplierDetail from "@/pages/SupplierDetail"
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
          path="/clients/:userId"
          element={
            <RequireAuth>
              <MainLayout>
                <ClientDetail />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/suppliers/:userId"
          element={
            <RequireAuth>
              <MainLayout>
                <SupplierDetail />
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
        <Route
          path="/clients"
          element={
            <RequireAuth>
              <MainLayout>
                <Clients />
              </MainLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  )
}