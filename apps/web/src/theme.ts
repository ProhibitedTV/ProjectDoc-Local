import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    primary: {
      main: "#30435c"
    },
    secondary: {
      main: "#8b6f47"
    },
    background: {
      default: "#f3f1ec",
      paper: "#ffffff"
    }
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif'
  }
});
