// Layout.tsx
import React, { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "./Layout.css";

interface LayoutProps {
  children: ReactNode;
  currentUser: string; // must be a string to match Header
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser }) => {
  return (
    <div className="layout-container">
      {/* Top Header */}
      <Header currentUser={currentUser} />

      <div className="layout-body">
        {/* Sidebar on the left */}
        <Sidebar />

        {/* Main content */}
        <main className="layout-main">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
