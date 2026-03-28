import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderCopyOutlinedIcon from "@mui/icons-material/FolderCopyOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";

import { webEnv } from "./config/web-env";

const drawerWidth = 248;

const navigationItems = [
  { title: "Dashboard", to: "/", icon: HomeOutlinedIcon },
  { title: "Upload", to: "/upload", icon: UploadFileOutlinedIcon },
  { title: "Documents", to: "/documents", icon: DescriptionOutlinedIcon },
  { title: "Projects", to: "/projects", icon: FolderCopyOutlinedIcon },
  { title: "Review Queue", to: "/review", icon: PendingActionsOutlinedIcon },
  { title: "Search", to: "/search", icon: ManageSearchOutlinedIcon },
  { title: "Admin", to: "/admin", icon: SettingsOutlinedIcon }
];

export function AppShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const isSelected = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ ml: { md: `${drawerWidth}px` }, width: { md: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar sx={{ justifyContent: "space-between", borderBottom: "1px solid #e3ddd4" }}>
          <div>
            <Typography variant="h6">{webEnv.VITE_APP_NAME}</Typography>
            <Typography variant="body2" color="text.secondary">
              Local-first document operations
            </Typography>
          </div>
          <Chip label="MVP Foundation" color="secondary" />
        </Toolbar>
        <Box
          sx={{
            display: { xs: "block", md: "none" },
            px: 2,
            py: 1.5,
            borderBottom: "1px solid #e3ddd4",
            overflowX: "auto"
          }}
        >
          <Stack direction="row" spacing={1}>
            {navigationItems.map((item) => (
              <Button
                key={item.to}
                variant={isSelected(item.to) ? "contained" : "outlined"}
                color="inherit"
                onClick={() => {
                  void navigate({ to: item.to });
                }}
                sx={{ whiteSpace: "nowrap" }}
              >
                {item.title}
              </Button>
            ))}
          </Stack>
        </Box>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #e3ddd4",
            backgroundColor: "#ebe6dc"
          }
        }}
      >
        <Toolbar />
        <Stack spacing={1} sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Workspace
          </Typography>
          <List disablePadding>
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <ListItemButton
                  key={item.to}
                  onClick={() => {
                    void navigate({ to: item.to });
                  }}
                  selected={isSelected(item.to)}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemIcon>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item.title} />
                </ListItemButton>
              );
            })}
          </List>
        </Stack>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          ml: { md: `${drawerWidth}px` },
          mt: { xs: "124px", md: "64px" }
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
