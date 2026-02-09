'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

interface ResponsiveSidebarProps {
  children: React.ReactNode;
}

export default function ResponsiveSidebar({ children }: ResponsiveSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openMenu = () => setIsMobileMenuOpen(true);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar (slide-in) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={closeMenu}
        isMobile={true}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <MobileHeader onMenuClick={openMenu} />

        {/* Content */}
        <main className="flex-1 bg-gray-100 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
