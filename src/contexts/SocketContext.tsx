// src/contexts/SocketContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
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

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = React.useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};