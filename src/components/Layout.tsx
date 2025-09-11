// src/components/Layout.tsx
import React from "react";
import Header from "./Header";

interface LayoutProps {
  currentUser: string;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentUser, children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header currentUser={currentUser} />

      {/* Page Content */}
      <main className="flex-1 p-6 bg-gray-50">
        {children}
      </main>
    </div>
  );
};

export default Layout;
