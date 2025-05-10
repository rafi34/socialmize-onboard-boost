
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/strategy-chat/ChatBubble";
import { ConfettiExplosion } from "@/components/strategy-chat/ConfettiExplosion";
import { CompletionModal } from "@/components/strategy-chat/CompletionModal";
import { useStrategyChat } from "@/hooks/useStrategyChat";
import { StrategyChatHeader } from "@/components/strategy-chat/StrategyChatHeader";
import { StrategyChatInput } from "@/components/strategy-chat/StrategyChatInput";
import { StrategyChatError } from "@/components/strategy-chat/StrategyChatError";
import { StartSessionButton } from "@/components/strategy-chat/StartSessionButton";

const StrategyChat = () => {
  const {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    showConfetti,
    completionModalOpen,
    contentIdeas,
    errorMessage,
    sessionStarted,
    hasExistingChat,
    handleStartSession,
    handleSendMessage,
    handleViewContentIdeas,
    handleBackToDashboard,
    handleNewSession,
    setCompletionModalOpen,
    user
  } = useStrategyChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  if (!user) {
    // Redirect to auth if not logged in
    return <div className="p-6">Please log in to access this feature.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-background/90">
      {/* Header */}
      <StrategyChatHeader
        hasExistingChat={hasExistingChat}
        onBackToDashboard={handleBackToDashboard}
        onNewSession={handleNewSession}
      />
      
      {/* Chat area */}
      <div className="flex-1 overflow-auto p-4 md:p-6 chat-container bg-background/60">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              message={message.message}
              isLoading={isLoading && message.id.includes('temp-assistant')}
            />
          ))}
          
          {/* Start Session button */}
          <StartSessionButton
            onStartSession={handleStartSession}
            isLoading={isLoading}
            sessionStarted={sessionStarted}
            hasMessages={messages.length > 0}
          />
          
          {/* Error message display */}
          <StrategyChatError 
            errorMessage={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area - only shown after session has started */}
      <StrategyChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
        sessionStarted={sessionStarted}
      />
      
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
