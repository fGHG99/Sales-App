import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./utils/store";
import App from "./App";
import "./index.css";
import AuthErrorBoundary from "./components/middleware/AuthErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <AuthErrorBoundary>
        <App />
      </AuthErrorBoundary>
    </Provider>
  </StrictMode>
);
