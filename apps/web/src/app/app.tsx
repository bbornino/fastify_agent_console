// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { Routes, Route, Navigate } from 'react-router'
import { LoginPage } from '../pages/login-page'
import { RegisterPage } from '../pages/register-page'
import { AuthCallbackPage} from '../pages/auth-callback-page'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage /> } />
      <Route path='/auth/callback' element={<AuthCallbackPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
