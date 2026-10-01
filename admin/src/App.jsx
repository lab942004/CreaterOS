import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import { AdminWorkspaces, AdminHealth, AdminJobs } from './pages/AdminOps1';
import { AdminAIUsage, AdminStorage, AdminFeatureFlags, AdminAuditLogs } from './pages/AdminOps2';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
        <Route path="/workspaces" element={<AdminLayout><AdminWorkspaces /></AdminLayout>} />
        <Route path="/health" element={<AdminLayout><AdminHealth /></AdminLayout>} />
        <Route path="/jobs" element={<AdminLayout><AdminJobs /></AdminLayout>} />
        <Route path="/ai-usage" element={<AdminLayout><AdminAIUsage /></AdminLayout>} />
        <Route path="/storage" element={<AdminLayout><AdminStorage /></AdminLayout>} />
        <Route path="/feature-flags" element={<AdminLayout><AdminFeatureFlags /></AdminLayout>} />
        <Route path="/audit-logs" element={<AdminLayout><AdminAuditLogs /></AdminLayout>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

