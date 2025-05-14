import * as React from "react";
import type { ToastActionElement, ToastProps as BaseToastProps } from "./toast"; // Assuming toast.tsx is in the same directory

// Hook implementation logic
// Keep types and constants related to the hook logic here.

export const TOAST_LIMIT = 5;
export const TOAST_REMOVE_DELAY = 5000;

export type ToasterToast = Omit<BaseToastProps, "id" | "onOpenChange" | "open"> & {
  id: string;
  title?: React.ReactNode; // Allow ReactNode for title
  description?: React.ReactNode;
  action?: ToastActionElement | React.ReactNode; // Allow ReactNode for broader action types
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
  // Add any other props you need for a toast, like `variant` from the original useToast
};

export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

export type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: string;
    };

export interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId));
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId: toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
       // Ensure toasts are added to the removal queue if they are not manually dismissed
      // However, the original code added timeout in the toast function itself based on open state.
      // We might need to adjust how dismiss and auto-removal interacts.
      // For now, let's stick to the original logic structure as much as possible.
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;
      if (toastId === undefined) {
        state.toasts.forEach(t => {
            if(toastTimeouts.has(t.id)) clearTimeout(toastTimeouts.get(t.id));
        });
        return {
          ...state,
          toasts: state.toasts.map((t) => ({
            ...t,
            open: false,
          })),
        };
      }

      if(toastTimeouts.has(toastId)) clearTimeout(toastTimeouts.get(toastId));
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST: {
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    }
    default: return state;
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// The main toast function
export function toast({ ...props }: Omit<ToasterToast, "id" | "open" | "onOpenChange">) { // Adjusted props
  const id = genId();

  const update = (newProps: Partial<Omit<ToasterToast, "id">>) => // Adjusted props
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...newProps, id },
    });

  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });
  
  // Add to removal queue only if not dismissed by onOpenChange
  // This part needs to be careful as onOpenChange might be called for various reasons
  // The original implementation relied on this onOpenChange to eventually dismiss.
  // Let's ensure the auto-dismissal logic from the original useToast is preserved.
  setTimeout(() => {
      // Check if toast is still open and in memoryState before removing
      const currentToast = memoryState.toasts.find(t => t.id === id);
      if(currentToast && currentToast.open) {
         // This might be redundant if onOpenChange always leads to dismiss then REMOVE_TOAST
         // but it acts as a fallback for auto-removal.
         dispatch({ type: actionTypes.REMOVE_TOAST, toastId: id });
      }
  }, TOAST_REMOVE_DELAY + count * 500); // Stagger removal slightly if many toasts are added at once

  return {
    id: id,
    dismiss,
    update,
  };
}

// The hook that components will use
export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]); // state dependency is fine here as it's meant to re-subscribe if state instance changes

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}