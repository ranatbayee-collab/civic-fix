import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { api } from './api/client';

import Navbar from './components/common/Navbar';
import City3D from './components/3d/City3D';
import CivicMap from './components/map/CivicMap';
import ReportProblem from './pages/ReportProblem';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import WhatIfSimulator from './pages/WhatIfSimulator';
import CivicCopilotModal from './components/copilot/CivicCopilotModal';

function AppContent() {
  const { user, isAdmin, isWorker } = useAuth();
  const [activeTab, setActiveTab] = useState('city3d'); // Start with the 3D City "wow factor"!
  const [complaints, setComplaints] = useState([]);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const res = await api.getComplaints();
      setComplaints(res.complaints || []);
    } catch (err) {
      console.warn('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectComplaintFrom3D = (comp) => {
    // If admin is active, switch to admin or stay
    if (isAdmin) {
      setActiveTab('admin');
    } else if (isWorker) {
      setActiveTab('worker');
    } else {
      setActiveTab('citizen_dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setCopilotOpen={setCopilotOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {activeTab === 'city3d' && (
          <City3D
            complaints={complaints}
            onSelectComplaint={handleSelectComplaintFrom3D}
          />
        )}

        {activeTab === 'map' && (
          <CivicMap
            complaints={complaints}
            onSelectComplaint={handleSelectComplaintFrom3D}
          />
        )}

        {activeTab === 'report' && (
          <ReportProblem
            onReportSubmitted={() => {
              fetchComplaints();
              setActiveTab('citizen_dashboard');
            }}
            onViewReports={() => setActiveTab('citizen_dashboard')}
          />
        )}

        {activeTab === 'citizen_dashboard' && (
          <CitizenDashboard
            complaints={complaints}
            onRefresh={fetchComplaints}
            onNewReport={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            complaints={complaints}
            onRefresh={fetchComplaints}
          />
        )}

        {activeTab === 'worker' && (
          <WorkerDashboard
            complaints={complaints}
            onRefresh={fetchComplaints}
          />
        )}

        {activeTab === 'simulator' && (
          <WhatIfSimulator />
        )}
      </main>

      {/* AI Civic Copilot Chat Drawer */}
      <CivicCopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
