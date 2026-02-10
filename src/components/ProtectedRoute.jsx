import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isLoading, isAdmin, user } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-primary">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but not admin email, show access denied
  if (isLoggedIn && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-primary px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-dark-secondary/80 backdrop-blur-xl rounded-xl border border-dark-tertiary p-8 shadow-2xl">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">
              This dashboard is restricted to admin access only.
            </p>
            <div className="bg-dark-tertiary/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">
                Logged in as: <span className="text-white">{user?.email || 'Unknown'}</span>
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-neon-blue/50 transition-all duration-300"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and is admin, render the protected content
  return children;
};

export default ProtectedRoute;
