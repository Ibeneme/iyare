// src/contexts/SocketContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../Redux/baseurl";

const SOCKET_URL = BASE_URL;

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Connected to Socket.IO server:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("⚠️ Disconnected from Socket.IO server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};
