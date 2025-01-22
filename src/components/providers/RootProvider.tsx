import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider } from "react-redux"
import { store } from "@/store"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BrowserRouter } from "react-router-dom"

const queryClient = new QueryClient()

interface RootProviderProps {
  children: React.ReactNode
}

export const RootProvider = ({ children }: RootProviderProps) => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  )
}