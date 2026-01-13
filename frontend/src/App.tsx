import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { 
  HomePage, 
  LoginPage, 
  AdminDashboard, 
  ServerFormPage, 
  NotFoundPage 
} from './pages'
import ServerDetailsPage from './components/ServerDetailsPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with Layout */}
        <Route path="/" element={<Layout />}>
          {/* Home page */}
          <Route index element={<HomePage />} />
          
          {/* Server details page */}
          <Route path="server/:id" element={<ServerDetailsPage />} />
          
          {/* Admin login (no auth required) */}
          <Route path="admin/login" element={<LoginPage />} />
          
          {/* Protected Admin Routes */}
          <Route path="admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="admin/servers/new" element={
            <ProtectedRoute>
              <ServerFormPage />
            </ProtectedRoute>
          } />
          
          <Route path="admin/servers/:id/edit" element={
            <ProtectedRoute>
              <ServerFormPage />
            </ProtectedRoute>
          } />
          
          {/* 404 Page */}
          <Route path="404" element={<NotFoundPage />} />
          
          {/* Catch all - redirect to 404 */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
