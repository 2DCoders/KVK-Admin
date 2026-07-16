import { Route, Routes, Navigate } from "react-router-dom"
import Login from "./pages/login"
import SettingsPage from "./pages/settings"
import AdminLayout from "./layouts/admin-layout"
import Dashboard from "./pages/dashboard"
import Memberships from "./pages/memberships"
import GymDashboard from "./pages/gym/dashboard"
import GymPayments from "./pages/gym/payments"
import GymStaff from "./pages/gym/staff"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Admin Dashboard Routes */}
      <Route element={<AdminLayout><Dashboard /></AdminLayout>} path="/main/dashboard" />
      <Route element={<AdminLayout><SettingsPage /></AdminLayout>} path="/main/settings" />
      <Route element={<AdminLayout><Memberships /></AdminLayout>} path="/main/memberships" />

      <Route path="/main" element={<Navigate to="/main/dashboard" />} />


      <Route element={<AdminLayout><GymDashboard /></AdminLayout>} path="/gym/dashboard" />
      <Route element={<AdminLayout><GymPayments /></AdminLayout>} path="/gym/payments" />
      <Route element={<AdminLayout><GymStaff /></AdminLayout>} path="/gym/staff" />

      <Route path="/gym" element={<Navigate to="/gym/dashboard" />} />
    </Routes>
  )
}

export default App
