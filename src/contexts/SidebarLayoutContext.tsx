import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'livnow-community-sidebar-collapsed';

const SIDEBAR_WIDTH_EXPANDED = 'max(256px, 17.78vw)';
const SIDEBAR_WIDTH_COLLAPSED = '72px';

interface SidebarLayoutContextValue {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  sidebarWidth: string;
}

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null);

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function SidebarLayoutProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
  }, []);

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <SidebarLayoutContext.Provider value={{ collapsed, setCollapsed, sidebarWidth }}>
      {children}
    </SidebarLayoutContext.Provider>
  );
}

export function useSidebarLayout(): SidebarLayoutContextValue {
  const ctx = useContext(SidebarLayoutContext);
  if (!ctx) {
    throw new Error('useSidebarLayout must be used within SidebarLayoutProvider');
  }
  return ctx;
}

export { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED };
