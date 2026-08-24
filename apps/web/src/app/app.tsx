// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { Routes, Route, Navigate } from 'react-router'
import { LoginPage } from '../pages/login-page'
import { RegisterPage } from '../pages/register-page'
import { AuthCallbackPage} from '../pages/auth-callback-page'
import { HomePage } from '../pages/home-page'
import { ProtectedRoute } from '../components/protected-route'
import { TicketsPage } from '@/pages/tickets-page'
import { CreateTicketPage } from '@/pages/create-ticket-page'
import { TicketDetailPage } from '@/pages/ticket-detail-page'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage /> } />
      <Route path='/auth/callback' element={<AuthCallbackPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/new" element={<CreateTicketPage />} />
        <Route path='/tickets/:ticketId' element={<TicketDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;
