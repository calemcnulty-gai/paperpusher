import { Routes, Route } from "react-router-dom"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store"
import { setupRealtimeSubscriptions } from "@/store/realtimeSlice"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { RequireAuth } from "@/components/auth/RequireAuth"
import Index from "@/pages/Index"
import Tickets from "@/pages/Tickets"
import Customers from "@/pages/Customers"
import Projects from "@/pages/Projects"
import Teams from "@/pages/Teams"
import TeamMembers from "@/pages/TeamMembers"
import Users from "@/pages/Users"
import ApiDocs from "@/pages/ApiDocs"

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
          path="/tickets"
          element={
            <RequireAuth>
              <Tickets />
            </RequireAuth>
          }
        />
        <Route
          path="/customers"
          element={
            <RequireAuth>
              <Customers />
            </RequireAuth>
          }
        />
        <Route
          path="/teams"
          element={
            <RequireAuth>
              <Teams />
            </RequireAuth>
          }
        />
        <Route
          path="/teams/:teamId/members"
          element={
            <RequireAuth>
              <TeamMembers />
            </RequireAuth>
          }
        />
        <Route
          path="/projects"
          element={
            <RequireAuth>
              <Projects />
            </RequireAuth>
          }
        />
        <Route
          path="/users"
          element={
            <RequireAuth>
              <Users />
            </RequireAuth>
          }
        />
        <Route
          path="/api-docs"
          element={
            <RequireAuth>
              <ApiDocs />
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  )
}