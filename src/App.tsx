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
      <Route element={<AdminLayout><Dashboard /></AdminLayout>} path="/dashboard" />
      <Route element={<AdminLayout><SettingsPage /></AdminLayout>} path="/settings" />
      <Route element={<AdminLayout><Memberships /></AdminLayout>} path="/memberships" />
      
      {/* Redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
