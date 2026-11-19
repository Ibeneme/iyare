import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../lib/baseUrl";
import { getCookie } from "../utils/cookies";

type SocketContextType = { socket: Socket | null };
const SocketContext = createContext<SocketContextType>({ socket: null });
export const useSocket = () => useContext(SocketContext);

/**
 * One shared Socket.io connection. The server requires the JWT on connect
 * (`auth.token`), so we only connect while signed in and re-read the cookie on
 * every (re)connect.
 */
export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(BASE_URL, {
      transports: ["websocket"],
      autoConnect: false,
      auth: (cb) => cb({ token: getCookie("token") || "" }),
    });
    setSocket(s);

    const tryConnect = () => {
      if (getCookie("token") && !s.connected && !s.active) s.connect();
      if (!getCookie("token") && s.connected) s.disconnect();
    };
    tryConnect();
    // Picks the connection up right after sign-in (the page is not reloaded then).
    const timer = window.setInterval(tryConnect, 2500);
    return () => {
      window.clearInterval(timer);
      s.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};
