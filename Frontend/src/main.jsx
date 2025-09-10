import { StrictMode } from "react";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ShopContextProvider from "./context/ShopContext.jsx";
import { createRoot } from "react-dom/client"; // Correct import
import { LoadingProvider } from "./context/LoadingContext.jsx";

// Use createRoot from react-dom/client
const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <BrowserRouter>
      <LoadingProvider>
        <ShopContextProvider>
          <App />
        </ShopContextProvider>
      </LoadingProvider>
    </BrowserRouter>
  </StrictMode>
);
