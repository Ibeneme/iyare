import React, { useEffect, useRef } from "react";
import { BASE_URL } from "../../lib/baseUrl";
import { getCookie } from "../../utils/cookies";
import { useSocket } from "../../contexts/SocketContext";
import { defineYareAnnouncements, type YareAnnouncements } from "../../webcomponents/yare-announcements";

defineYareAnnouncements();

/** Thin React wrapper around the <yare-announcements> custom element. */
const AnnouncementBar: React.FC<{ view?: "banners" | "feed"; signedIn?: boolean; className?: string }> = ({ view = "banners", signedIn = true, className }) => {
  const ref = useRef<YareAnnouncements>(null);
  const { socket } = useSocket();
  const token = signedIn ? getCookie("token") || "" : "";

  useEffect(() => {
    if (ref.current) ref.current.socket = socket;
  }, [socket]);

  return React.createElement("yare-announcements", {
    ref,
    className,
    "api-base": BASE_URL,
    view,
    ...(token ? { token } : {}),
  });
};

export default AnnouncementBar;
