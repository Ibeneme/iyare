import React from "react";
import "./Layout.css";
import Sidebar from "../Sidebar/Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      <div style={{ marginTop: 0 }}>
    
      </div>
      <div className="layout">
        <Sidebar />
        <div className="layout-content">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
