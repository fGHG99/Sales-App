import { useState } from 'react';
import Navbar from '../Layout/Navbar';
import Sidebar from '../Layout/SideBar';
import AccountManagement from './AccountManagement';
import RoleManagement from './RoleManagement';
import SystemConfiguration from './SystemConfiguration';
import AuditLog from './AuditLog';

export default function SupportDashboard() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'accounts':
        return <AccountManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'system':
        return <SystemConfiguration />;
      case 'audit':
        return <AuditLog />;
      case 'reports':
        return <div className="p-8 text-center text-gray-500">Reports functionality coming soon...</div>;
      default:
        return <AccountManagement />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        closeSidebar={closeSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar 
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};