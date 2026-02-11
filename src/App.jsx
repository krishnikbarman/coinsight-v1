import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import usePriceAlertChecker from './hooks/usePriceAlerts';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Market from './pages/Market';
import Settings from './pages/Settings';
import TransactionHistory from './pages/TransactionHistory';
import PriceAlerts from './pages/PriceAlerts';

// Root redirect component
const RootRedirect = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-primary">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />;
};

function App() {
  // Mount global price alert checker at top level
  // This runs automatically for authenticated users and checks alerts every 8 seconds
  usePriceAlertChecker();

  return (
    <>
      <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth routes (Login page - no sidebar/navbar) */}
      <Route
        path="/login"
        element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        }
      />

      {/* Protected routes (with sidebar/navbar) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Portfolio />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/market"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Market />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TransactionHistory />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PriceAlerts />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
