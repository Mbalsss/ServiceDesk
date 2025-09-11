import React, { ReactNode } from 'react';
import TechnicianHeader from './TechnicianHeader';

interface LayoutProps {
  currentUser: { id: string; name: string; email: string; role: string };
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  currentUser,
  title = "",      // Default empty string for consistency
  subtitle = "",   // Default empty string for consistency
  children,
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <TechnicianHeader
        currentUser={currentUser}
        title={title}
        subtitle={subtitle}
      />

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
