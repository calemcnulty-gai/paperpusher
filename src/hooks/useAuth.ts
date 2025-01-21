import { useSelector } from "react-redux"
import { RootState } from "@/store"

export function useAuth() {
  const session = useSelector((state: RootState) => state.auth.session)
  const user = session?.user ?? null
  
  return {
    user,
    isAuthenticated: !!user,
    loading: useSelector((state: RootState) => state.auth.loading)
  }
}