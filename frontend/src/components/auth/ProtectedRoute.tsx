import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import LoadingScreen from "../ui/LoadingScreen"

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />
}

export default ProtectedRoute
