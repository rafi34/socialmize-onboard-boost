
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AIAssistant } from "@/components/strategy-chat/AIAssistant";
import { ConfettiExplosion } from "@/components/strategy-chat/ConfettiExplosion";
import { CompletionModal } from "@/components/strategy-chat/CompletionModal";

const StrategyChat = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [contentIdeas, setContentIdeas] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleStrategyComplete = (ideas: string[]) => {
    setContentIdeas(ideas);
    setShowConfetti(true);
    setCompletionModalOpen(true);
  };
  
  const handleViewContentIdeas = () => {
    navigate('/review-ideas');
    setCompletionModalOpen(false);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  if (!user) {
    return <div className="p-6">Please log in to access this feature.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-background/90">
      {/* Header */}
      <div className="premium-header p-4 md:p-6 sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/20 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-3" 
            onClick={handleBackToDashboard}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-[#0540F2] to-[#446FF2] bg-clip-text text-transparent flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-[#446FF2]" />
              Strategy Session
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Let's build your personalized content strategy</p>
          </div>
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto h-full">
          <AIAssistant 
            onComplete={handleStrategyComplete}
            onProgress={setProgress}
          />
        </div>
      </div>
      
      {/* Confetti effect on completion */}
      {showConfetti && <ConfettiExplosion />}
      
      {/* Completion modal */}
      <CompletionModal 
        open={completionModalOpen} 
        onClose={() => setCompletionModalOpen(false)}
        onViewIdeas={handleViewContentIdeas}
        ideasCount={contentIdeas.length}
      />
    </div>
  );
};

export default StrategyChat;
