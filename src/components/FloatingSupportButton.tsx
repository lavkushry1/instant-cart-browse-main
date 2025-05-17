import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'react-hot-toast';

export const FloatingSupportButton = () => {
  const isMobile = useIsMobile();

  const handleClick = () => {
    toast.success('Support chat clicked! (Placeholder)', { duration: 3000 });
    console.log('Floating Support Button clicked');
  };

  if (!isMobile) {
    return null;
  }

  return (
    <Button
      variant="default"
      size="icon"
      className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
      onClick={handleClick}
      aria-label="Chat with support"
    >
      <MessageSquare className="h-7 w-7" />
    </Button>
  );
}; 