import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import store from "./store/index.ts";
import { ToastProvider } from "./contexts/ToastContext.tsx";
import { SocketProvider } from "./contexts/SocketContext.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { ConfirmProvider } from "./contexts/ConfirmContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Provider store={store}>
            <SocketProvider>
              <App />
            </SocketProvider>
          </Provider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
