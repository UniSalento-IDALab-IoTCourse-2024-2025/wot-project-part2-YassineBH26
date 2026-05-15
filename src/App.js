import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Driver from "./pages/Driver";
import AdminRequests from "./pages/AdminRequests";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";
import School from "./pages/School";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import DeliveryReport from "./pages/DeliveryReport";

function App() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/delivery-report/:deliveryId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DeliveryReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <Driver />
            </ProtectedRoute>
          }
        />

        <Route
          path="/school"
          element={
            <ProtectedRoute allowedRoles={["school"]}>
              <School />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;