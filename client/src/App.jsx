import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PropertyManagement from './pages/PropertyManagement';
import CustomerManagement from './pages/CustomerManagement';
import UserManagement from './pages/UserManagement';
import AgentManagement from './pages/AgentManagement';
import TaskManager from './pages/TaskManager';
import NotificationsPage from './pages/NotificationsPage';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const { isAuthenticated, user } = useAuth();

  // Redirect to dashboard if already authenticated
  const getDefaultRedirect = () => {
    if (!user) return '/admin-login';
    return '/dashboard';
  };

  return (
    <Routes>
      {/* Default route - redirect to admin login or dashboard */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Navigate to={getDefaultRedirect()} replace /> : 
            <Navigate to="/admin-login" replace />
        } 
      />
      
      {/* Admin Login - redirect to dashboard if already authenticated */}
      <Route 
        path="/admin-login" 
        element={isAuthenticated ? <Navigate to={getDefaultRedirect()} replace /> : <AdminLogin />} 
      />

      {/* Dashboard routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'agent']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/super-admin" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/admin" 
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/agent" 
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'agent']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Property Management Routes */}
      <Route 
        path="/dashboard/properties" 
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <PropertyManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/my-properties" 
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <PropertyManagement />
          </ProtectedRoute>
        } 
      />

      {/* Task Management Routes */}
      <Route 
        path="/dashboard/tasks" 
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'agent']}>
            <TaskManager />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/my-tasks" 
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <TaskManager />
          </ProtectedRoute>
        } 
      />

      {/* Customer Management Routes */}
      <Route 
        path="/dashboard/customers" 
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'agent']}>
            <CustomerManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/my-customers" 
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <CustomerManagement />
          </ProtectedRoute>
        } 
      />

      {/* Agent Management Routes */}
      <Route 
        path="/dashboard/agents" 
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <AgentManagement />
          </ProtectedRoute>
        } 
      />

      {/* User Management Routes */}
      <Route 
        path="/dashboard/users" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <UserManagement />
          </ProtectedRoute>
        } 
      />

      {/* Notifications Route */}
      <Route 
        path="/dashboard/notifications" 
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'agent']}>
            <NotificationsPage />
          </ProtectedRoute>
        } 
      />

      {/* Profile Route */}
      <Route 
        path="/dashboard/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
