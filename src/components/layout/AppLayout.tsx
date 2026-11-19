import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { markClick, pulseBusy } from "../../lib/loading";
import Sidebar from "./Sidebar";
import BusyOverlay from "../common/BusyOverlay";
import AnnouncementBar from "../common/AnnouncementBar";

/** Signed-in shell: green sidebar, a banner strip fed by the server, then the page. */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  // Every page change (and the first load) shows the content-area loader briefly, so a page never flashes empty states.
  useEffect(() => { markClick(); pulseBusy(500); }, [pathname]);
  return (
  <div className="layout">
    <Sidebar />
    <main className="layout-content">
      <BusyOverlay />
      <AnnouncementBar view="banners" />
      <div className="page-body">{children}</div>
    </main>
  </div>
  );
};

export default AppLayout;
