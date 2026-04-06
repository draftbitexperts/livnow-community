import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarLayoutProvider } from '@/contexts/SidebarLayoutContext';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarLayoutProvider>
      <div className="flex h-screen overflow-hidden bg-[#f5f5f5]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
          <main className="flex-1 overflow-y-auto bg-[hsla(193,27%,94%,1)]">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarLayoutProvider>
  );
}
