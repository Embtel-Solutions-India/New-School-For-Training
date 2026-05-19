import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#22c55e", // green
    },
    secondary: {
      main: "#f97316", // orange
    },
    background: {
      default: "#0b1120", // deep dark
      paper: "#111827",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
});

export default theme;