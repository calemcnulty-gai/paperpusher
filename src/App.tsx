import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Routes, Route } from "react-router-dom"
import { RootProvider } from "@/components/providers/RootProvider"
import { AuthenticatedRoutes } from "@/components/routing/AuthenticatedRoutes"
import Auth from "./pages/Auth"

const App = () => (
  <RootProvider>
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/*" element={<AuthenticatedRoutes />} />
    </Routes>
    <Toaster />
    <Sonner />
  </RootProvider>
)

export default App