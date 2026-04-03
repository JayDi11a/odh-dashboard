import * as React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import NotFound from './components/NotFound';
import InstanceListPage from './pages/InstanceListPage';
import DeployInstancePage from './pages/DeployInstancePage';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/openclaw/instances" replace />} />
    <Route path="/openclaw/instances" element={<InstanceListPage />} />
    <Route path="/openclaw/instances/deploy" element={<DeployInstancePage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
