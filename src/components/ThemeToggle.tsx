import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, updateThemeSettings } = useTheme();

  const toggleTheme = () => {
    if (!theme) return;
    
    const isDark = theme.settings.backgroundColor === '#121212';
    
    updateThemeSettings({
      backgroundColor: isDark ? '#ffffff' : '#121212',
      textColor: isDark ? '#333333' : '#f5f5f5',
      headerBackgroundColor: isDark ? '#f8f9fa' : '#1a1a1a',
      footerBackgroundColor: isDark ? '#f1f1f1' : '#1a1a1a',
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme?.settings.backgroundColor === '#121212' ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
} 