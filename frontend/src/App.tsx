import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/sales/Sales";
import Forecasts from "./pages/forecasts/Forecasts";
import Products from "./pages/products/Products";
import Reports from "./pages/reports/Reports";
import MarketBasket from "./pages/marketBasket/MarketBasket";
import Settings from "./pages/settings/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Users from "./pages/users/Users";

function App() {
  const { isAuthenticated, userRole } = useAuth();

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login />
              ) : userRole === "planner" ? (
                <Navigate to="/products" />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/register"
            element={
              !isAuthenticated ? (
                <Register />
              ) : userRole === "planner" ? (
                <Navigate to="/products" />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/sales"
                element={
                  <RoleRoute
                    requiredRoles={["Manager", "Planner", "Owner", "Admin"]}
                  >
                    <Sales />
                  </RoleRoute>
                }
              />
              <Route
                path="/forecasts"
                element={
                  <RoleRoute requiredRoles={["Manager", "Owner", "Admin"]}>
                    <Forecasts />
                  </RoleRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <RoleRoute
                    requiredRoles={["Planner", "Owner", "Admin", "Manager"]}
                  >
                    <Products />
                  </RoleRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <RoleRoute requiredRoles={["Manager", "Planner", "Owner"]}>
                    <Reports />
                  </RoleRoute>
                }
              />
              <Route
                path="/marketbasket"
                element={
                  <RoleRoute requiredRoles={["Manager", "Owner", "Admin"]}>
                    <MarketBasket />
                  </RoleRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <RoleRoute requiredRoles={["Owner", "Admin"]}>
                    <Settings />
                  </RoleRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <RoleRoute requiredRoles={["Owner", "Admin"]}>
                    <Users />
                  </RoleRoute>
                }
              />
            </Route>
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
