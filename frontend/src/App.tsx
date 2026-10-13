import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './components/DashboardLayout'
import { GuestRoute } from './components/GuestRoute'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { RedacaoPage } from './pages/RedacaoPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SimuladosPage } from './pages/SimuladosPage'
import { TutorPage } from './pages/TutorPage'

function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/simulados/*" element={<SimuladosPage />} />
          <Route path="/tutor" element={<TutorPage />} />
          <Route path="/redacao" element={<RedacaoPage />} />
        </Route>
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
