import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./utils/store";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./components/middleware/AuthContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </StrictMode>
);
