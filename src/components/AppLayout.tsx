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
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Desktop header: sidebar is static from lg — show same header from lg so it’s never missing */}
          <div className="hidden lg:block">
            <Header onMenuClick={() => setSidebarOpen((o) => !o)} variant="desktop" />
          </div>
          <div className="hidden md:block lg:hidden">
            <Header onMenuClick={() => setSidebarOpen((o) => !o)} variant="tablet" />
          </div>
          <div className="md:hidden">
            <Header onMenuClick={() => setSidebarOpen((o) => !o)} variant="mobile" />
          </div>
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[hsla(193,27%,94%,1)] pt-14 lg:pt-[110px]">
            <div className="main-section-padding-x flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarLayoutProvider>
  );
}
