import { useTheme } from "next-themes"
import { Toaster as Sonner, toast as sonnerToast } from "sonner" // Renamed import to avoid conflict

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

// It's generally better to import sonnerToast directly from 'sonner' in files that need it.
// However, if a project convention is to re-export it alongside Toaster, 
// this file would ideally be named something like `toast.ts` or `notifications.ts` 
// and not be treated as a component module by the linter for this specific rule.
// For now, to strictly adhere to the rule for this component file:
export { Toaster }

// If sonnerToast must be exported from here due to existing usage, 
// it might be better to move Toaster to its own file, e.g., ToasterComponent.tsx
// and have this file (sonner.tsx) re-export both from their respective sources if that was the intent.
// Or, projects using this Toaster can import sonnerToast directly:
// import { toast } from 'sonner';
// import { Toaster } from '@/components/ui/sonner'; 
// This is usually cleaner.
