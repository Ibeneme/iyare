import React from "react";
import "../Landing.css";
import AnnouncementBar from "../../components/common/AnnouncementBar";

/** Wraps every public page so the green + yellow landing theme applies (and the signed-in app is untouched). */
const LandingShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="landing min-h-screen flex flex-col">
    <AnnouncementBar signedIn={false} />
    {children}
  </div>
);

export default LandingShell;
