import { StrictMode } from "react";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ShopContextProvider from "./context/ShopContext.jsx";
import { createRoot } from "react-dom/client"; // Correct import
import { LoadingProvider } from "./context/LoadingContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// Use createRoot from react-dom/client
const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LoadingProvider>
          <ShopContextProvider>
            <App />
          </ShopContextProvider>
        </LoadingProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
