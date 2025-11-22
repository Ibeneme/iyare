import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./assets/fonts/fonts.css";
import { Provider } from "react-redux";
import store from "./Redux/store.tsx";
import { ToastProvider } from "./Context/ToastProvider.tsx";
import { SocketProvider } from "./contexts/SocketContext.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <Provider store={store}>
        {/* <SocketProvider>
          <App />
        </SocketProvider> */}
            <App />
      </Provider>
    </ToastProvider>
  </StrictMode>
);
