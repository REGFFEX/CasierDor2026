import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarState {
  mobileOpen: boolean;
  desktopCollapsed: boolean;
  sidebarHovered: boolean;
}

interface SidebarContextType {
  state: SidebarState;
  setMobileOpen: (open: boolean) => void;
  setDesktopCollapsed: (collapsed: boolean) => void;
  setSidebarHovered: (hovered: boolean) => void;
  toggleSidebar: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const toggleSidebar = () => {
    // We check window width to determine which state to toggle
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setDesktopCollapsed(prev => !prev);
    } else {
      setMobileOpen(prev => !prev);
    }
  };

  const closeMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileOpen(false);
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        state: { mobileOpen, desktopCollapsed, sidebarHovered },
        setMobileOpen,
        setDesktopCollapsed,
        setSidebarHovered,
        toggleSidebar,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
