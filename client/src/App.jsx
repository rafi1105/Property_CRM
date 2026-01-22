import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Property from './pages/Property';
import PropertyDetails from './pages/PropertyDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
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
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes - only Home is accessible without login */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
      <Route path="/admin-login" element={isAuthenticated ? <Navigate to="/" /> : <AdminLogin />} />

      {/* Public routes - accessible without authentication */}
      <Route path="/property" element={<Property />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Dashboard routes */}
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
