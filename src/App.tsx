import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import AllResidents from '@/pages/AllResidents';
import AllCommunities from '@/pages/AllCommunities';
import ParentCompanyDetail from '@/pages/ParentCompanyDetail';
import ResidentDetail from '@/pages/ResidentDetail';
import ComingSoon from '@/pages/ComingSoon';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { DemoResidentsProvider } from '@/contexts/DemoResidentsContext';

function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 font-source-sans-3">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}

function App() {
  return (
    <BrowserRouter>
      <DemoResidentsProvider>
      <Routes>
        <Route path="/" element={<LoginRoute />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<ComingSoon />} />
          <Route path="residents/all" element={<AllResidents />} />
          <Route path="residents/:residentId" element={<ResidentDetail />} />
          <Route path="communities" element={<AllCommunities />} />
          <Route path="communities/parent-companies/:parentId" element={<ParentCompanyDetail />} />
          <Route path="knowledge-base" element={<ComingSoon />} />
          <Route path="team" element={<ComingSoon />} />
        </Route>
      </Routes>
      </DemoResidentsProvider>
    </BrowserRouter>
  );
}

export default App;
