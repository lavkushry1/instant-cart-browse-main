import * as React from "react";

// Keep constants that are used by SidebarProvider here or move to a shared constants file
export const SIDEBAR_COOKIE_NAME = "sidebar:state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextValue = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean | ((prevState: boolean) => boolean)) => void; // Adjusted setOpen type
  openMobile: boolean;
  setOpenMobile: (open: boolean | ((prevState: boolean) => boolean)) => void; // Adjusted setOpenMobile type
  isMobile: boolean;
  toggleSidebar: () => void;
};

export const SidebarContext = React.createContext<SidebarContextValue | null>(
  null
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}