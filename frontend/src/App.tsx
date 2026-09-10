import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import LocationsPage from './pages/LocationsPage';
import AdminPage from './pages/AdminPage';

const FullPageSpinner = () => (
  <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="assets/:id" element={<AssetDetailPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;
