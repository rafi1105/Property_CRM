import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDashboardLink = () => {
    if (user?.role === 'super_admin') return '/dashboard/super-admin';
    if (user?.role === 'admin') return '/dashboard/admin';
    if (user?.role === 'agent') return '/dashboard/agent';
    return '/';
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={getDashboardLink()} className="flex items-center space-x-3">
            <img 
              src="/image.png" 
              alt="Sintec Properties Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold text-gray-800">
              Sintec Properties CRM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Super Admin Links */}
            {user?.role === 'super_admin' && (
              <>
                <Link 
                  to="/dashboard/super-admin" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/dashboard/properties" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Properties
                </Link>
                <Link 
                  to="/dashboard/customers" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Customers
                </Link>
                <Link 
                  to="/dashboard/tasks" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Tasks
                </Link>
                {/* <Link 
                  to="/dashboard/agents" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Agents
                </Link> */}
                <Link 
                  to="/dashboard/users" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Users
                </Link>
              </>
            )}

            {/* Admin Links */}
            {user?.role === 'admin' && (
              <>
                <Link 
                  to="/dashboard/admin" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/dashboard/properties" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Properties
                </Link>
                <Link 
                  to="/dashboard/customers" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Customers
                </Link>
                <Link 
                  to="/dashboard/tasks" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Tasks
                </Link>
                <Link 
                  to="/dashboard/agents" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Agents
                </Link>
              </>
            )}

            {/* Agent Links */}
            {user?.role === 'agent' && (
              <>
                <Link 
                  to="/dashboard/agent" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/dashboard/my-properties" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  My Properties
                </Link>
                <Link 
                  to="/dashboard/my-customers" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  My Customers
                </Link>
                <Link 
                  to="/dashboard/my-tasks" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  My Tasks
                </Link>
              </>
            )}

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-blue-600 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold border-2 border-blue-600">
                    {getInitials(user?.name)}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg mb-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border-2 border-blue-600 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-lg">
                  {getInitials(user?.name)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Mobile Navigation Links */}
            {user?.role === 'super_admin' && (
              <>
                <Link to="/dashboard/super-admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
                <Link to="/dashboard/properties" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Properties</Link>
                <Link to="/dashboard/customers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Customers</Link>
                <Link to="/dashboard/tasks" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Tasks</Link>
                <Link to="/dashboard/agents" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Agents</Link>
                <Link to="/dashboard/users" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Users</Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link to="/dashboard/admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
                <Link to="/dashboard/properties" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Properties</Link>
                <Link to="/dashboard/customers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Customers</Link>
                <Link to="/dashboard/tasks" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Tasks</Link>
                <Link to="/dashboard/agents" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Agents</Link>
              </>
            )}

            {user?.role === 'agent' && (
              <>
                <Link to="/dashboard/agent" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
                <Link to="/dashboard/my-properties" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>My Properties</Link>
                <Link to="/dashboard/my-customers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>My Customers</Link>
                <Link to="/dashboard/my-tasks" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>My Tasks</Link>
              </>
            )}

            <Link to="/dashboard/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" onClick={() => setShowMobileMenu(false)}>Profile Settings</Link>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
