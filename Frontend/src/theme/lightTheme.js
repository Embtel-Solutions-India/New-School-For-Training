import { createTheme } from "@mui/material/styles";

// ── Centralized light theme design tokens ──────────────────────
export const lt = {
  text: {
    primary:   "#0F172A",
    secondary: "#334155",
    muted:     "#475569",
    disabled:  "rgba(15, 23, 42, 0.38)",
  },
  border: {
    default: "#E2E8F0",
    strong:  "rgba(15, 23, 42, 0.20)",
    subtle:  "rgba(15, 23, 42, 0.08)",
  },
  bg: {
    page:    "#F1F5F9",
    card:    "#FFFFFF",
    subtle:  "#F8FAFC",
    overlay: "rgba(15, 23, 42, 0.04)",
    hover:   "rgba(15, 23, 42, 0.06)",
  },
  chart: {
    axis:    "#334155",
    grid:    "#CBD5E1",
    tick:    "#475569",
    tooltip: "#FFFFFF",
  },
};

// ── MUI light theme (full override) ────────────────────────────
export const lightMuiTheme = createTheme({
  palette: {
    mode: "light",
    primary:   { main: "#16a34a", contrastText: "#ffffff" },
    secondary: { main: "#ea580c", contrastText: "#ffffff" },
    text: {
      primary:   lt.text.primary,
      secondary: lt.text.secondary,
      disabled:  lt.text.disabled,
    },
    background: { default: lt.bg.page, paper: lt.bg.card },
    divider:    lt.border.default,
    action: {
      hover:           lt.bg.hover,
      selected:        "rgba(22, 163, 74, 0.10)",
      disabledBackground: "rgba(15, 23, 42, 0.06)",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    allVariants: { color: lt.text.primary },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        outlined: { borderColor: lt.border.default,  color: lt.text.secondary },
        text:     { color: lt.text.secondary },
        contained:{ color: "#ffffff" },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { color: lt.text.muted },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { color: lt.text.secondary, fontWeight: 600,
                backgroundColor: "rgba(15,23,42,0.04)",
                borderColor: lt.border.default },
        body: { color: lt.text.primary,  borderColor: lt.border.default },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&:hover td": { backgroundColor: lt.bg.overlay } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root:       { backgroundColor: "rgba(15,23,42,0.07)" },
        label:      { color: lt.text.secondary },
        deleteIcon:  { color: lt.text.muted },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: "#1e293b", color: "#ffffff",
                   fontSize: "0.75rem", borderRadius: "8px" },
        arrow:   { color: "#1e293b" },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { color: lt.text.muted,
                "&.Mui-selected": { color: "#16a34a" } },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root:      { borderBottomColor: lt.border.subtle },
        indicator: { backgroundColor: "#16a34a" },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: lt.border.default } },
    },
    MuiInputBase: {
      styleOverrides: {
        root:  { color: lt.text.primary },
        input: { color: lt.text.primary,
                 "&::placeholder": { color: lt.text.muted, opacity: 1 } },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: lt.border.default },
      },
    },
    MuiFormLabel: {
      styleOverrides: { root: { color: lt.text.secondary } },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { color: lt.text.muted } },
    },
    MuiSelect: {
      styleOverrides: {
        select: { color: lt.text.primary },
        icon:   { color: lt.text.muted },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { color: lt.text.primary,
                "&:hover": { backgroundColor: lt.bg.hover } },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary:   { color: lt.text.primary },
        secondary: { color: lt.text.muted },
      },
    },
    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: "rgba(15,23,42,0.08)" } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { backgroundColor: "rgba(15,23,42,0.10)" } },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: { color: lt.text.secondary, borderColor: lt.border.strong,
                "&.Mui-selected": { backgroundColor: "#16a34a", color: "#ffffff" } },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundColor: lt.bg.card, color: lt.text.primary },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { color: lt.text.primary } },
    },
    MuiDialogContent: {
      styleOverrides: { root: { color: lt.text.secondary } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { color: lt.text.secondary } },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: lt.bg.subtle, color: lt.text.primary },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: { backgroundColor: lt.bg.card, color: lt.text.primary,
                 border: `1px solid ${lt.border.default}` },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        colorDefault: { backgroundColor: "rgba(15,23,42,0.12)",
                        color: lt.text.primary },
      },
    },
  },
});
