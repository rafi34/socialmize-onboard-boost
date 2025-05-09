
import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StrategyChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  sessionStarted: boolean;
}

export const StrategyChatInput = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isLoading,
  sessionStarted
}: StrategyChatInputProps) => {
  const isMobile = useIsMobile();
  
  if (!sessionStarted) return null;
  
  return (
    <div className="border-t border-border/20 p-3 md:p-6 bg-gradient-to-t from-background/95 to-background/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto">
        <div className="relative glass-panel rounded-lg shadow-lg">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none min-h-[60px] md:min-h-[80px] premium-input border-0 focus-visible:ring-1 focus-visible:ring-[#0540F2]/50 bg-transparent rounded-tl-lg rounded-tr-lg"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <div className="absolute bottom-3 right-3">
            <Button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-br from-[#1FBF57] to-[#1CB955] hover:opacity-90 transition-all shadow-md"
              size={isMobile ? "sm" : "default"}
            >
              <Send className={`h-4 w-4 ${isMobile ? 'mr-0' : 'mr-2'}`} />
              {!isMobile && "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
