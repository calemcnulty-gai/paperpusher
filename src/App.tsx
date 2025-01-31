import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { RootProvider } from "@/components/providers/RootProvider"
import { AuthenticatedRoutes } from "@/components/routing/AuthenticatedRoutes"
import Auth from "./pages/Auth"
import AuthCallback from "./pages/AuthCallback"

// Create router with future flags enabled
const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />
  },
  {
    path: "/auth/v1/callback",
    element: <AuthCallback />
  },
  {
    path: "/*",
    element: <AuthenticatedRoutes />
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
})

const App = () => (
  <RootProvider>
    <RouterProvider router={router} />
    <Toaster />
    <Sonner />
  </RootProvider>
)

export default App