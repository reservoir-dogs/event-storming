import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RequireParticipantName } from './components/RequireParticipantName'
import { HomePage } from './pages/HomePage'
import { WorkshopPage } from './pages/WorkshopPage'

export function App() {
  return (
    <BrowserRouter>
      <RequireParticipantName>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/atelier/:id" element={<WorkshopPage />} />
        </Routes>
      </RequireParticipantName>
    </BrowserRouter>
  )
}
