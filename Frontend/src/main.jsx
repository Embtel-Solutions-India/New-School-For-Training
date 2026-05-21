import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./services/i18n.js";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { Toaster } from "react-hot-toast";
import theme from "./theme";

ReactDOM.createRoot(document.getElementById("root")).render(
  
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </ThemeProvider>
  
);
