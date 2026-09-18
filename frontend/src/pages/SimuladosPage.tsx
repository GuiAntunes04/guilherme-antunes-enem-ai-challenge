import { Navigate, Route, Routes } from 'react-router-dom'
import { SimuladosHome } from './simulados/SimuladosHome'
import { SimulationQuizPage } from './simulados/SimulationQuizPage'
import { SimulationResultPage } from './simulados/SimulationResultPage'

export function SimuladosPage() {
  return (
    <Routes>
      <Route index element={<SimuladosHome />} />
      <Route path=":attemptId/resultado" element={<SimulationResultPage />} />
      <Route path=":attemptId" element={<SimulationQuizPage />} />
      <Route path="*" element={<Navigate to="/simulados" replace />} />
    </Routes>
  )
}
