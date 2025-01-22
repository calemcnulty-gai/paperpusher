import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Provider } from "react-redux"
import { store, AppDispatch } from "@/store"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { setupRealtimeSubscriptions } from "@/store/realtimeSlice"
import Index from "./pages/Index"
import Auth from "./pages/Auth"
import Tickets from "./pages/Tickets"
import Customers from "./pages/Customers"
import Projects from "./pages/Projects"
import Teams from "./pages/Teams"
import TeamMembers from "./pages/TeamMembers"
import Users from "./pages/Users"
import ApiDocs from "./pages/ApiDocs"

const queryClient = new QueryClient()

const AppContent = () => {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(setupRealtimeSubscriptions())
  }, [dispatch])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
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
    </BrowserRouter>
  )
}

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
)

export default App