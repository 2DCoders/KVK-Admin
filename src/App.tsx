import { Route, Routes, Navigate } from "react-router-dom"
import Login from "./pages/login"
import SettingsPage from "./pages/settings"
import AdminLayout from "./layouts/admin-layout"
import Dashboard from "./pages/dashboard"
import Memberships from "./pages/memberships"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Admin Dashboard Routes */}
      <Route element={<AdminLayout><Dashboard /></AdminLayout>} path="/main/dashboard" />
      <Route element={<AdminLayout><SettingsPage /></AdminLayout>} path="/main/settings" />
      <Route element={<AdminLayout><Memberships /></AdminLayout>} path="/main/memberships" />

      <Route element={<AdminLayout><Dashboard /></AdminLayout>} path="/gym/dashboard" />
      <Route element={<AdminLayout><Dashboard /></AdminLayout>} path="/gym/members" />
      <Route element={<AdminLayout><SettingsPage /></AdminLayout>} path="/gym/settings" />

      {/* Redirect to dashboard */}
      <Route path="*" element={<Navigate to="/main/dashboard" />} />
    </Routes>
  )
}

export default App
