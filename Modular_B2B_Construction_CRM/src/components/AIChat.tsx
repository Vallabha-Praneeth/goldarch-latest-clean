import React, { useState } from 'react';
import { Sparkles, X, Send, ChevronDown, FileText, Building2, Briefcase } from 'lucide-react';
import { Button } from './Button';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  citations?: Array<{ text: string; page: number }>;
  timestamp: Date;
}

interface AIChatProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ isExpanded, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I can help you find information across your documents, suppliers, and deals. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState<'all' | 'documents' | 'suppliers' | 'deals'>('all');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Based on your documents, I found relevant information about the construction project timeline. The latest updates show progress is on track.',
        citations: [
          { text: 'Project Timeline Q1 2026', page: 3 },
          { text: 'Budget Report', page: 7 },
        ],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-14 px-6 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white rounded-full shadow-ai-glow hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-medium z-50"
      >
        <Sparkles className="h-5 w-5" />
        <span>Ask AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-xl shadow-dropdown border border-[#E5E7EB] flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-t-xl">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-white hover:bg-white/20 rounded transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Context Selector */}
      <div className="px-6 py-3 border-b border-[#E5E7EB]">
        <div className="relative">
          <select
            value={context}
            onChange={(e) => setContext(e.target.value as any)}
            className="w-full h-9 pl-3 pr-8 text-sm bg-[#F9FAFB] border border-[#E5E7EB] rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
          >
            <option value="all">Search all sources</option>
            <option value="documents">Documents only</option>
            <option value="suppliers">Suppliers only</option>
            <option value="deals">Deals only</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280] pointer-events-none" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              <div
                className={`
                  px-4 py-3 rounded-lg text-sm
                  ${message.type === 'user'
                    ? 'bg-[#2563EB] text-white rounded-br-none'
                    : 'bg-[#F9FAFB] text-[#111827] rounded-bl-none'
                  }
                `}
              >
                {message.content}
              </div>
              
              {message.citations && message.citations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {message.citations.map((citation, index) => (
                    <button
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#FEF3C7] text-[#92400E] rounded-full text-xs font-medium hover:bg-[#FDE68A] transition-colors"
                    >
                      <FileText className="h-3 w-3" />
                      <span>p.{citation.page}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#F9FAFB] px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[#E5E7EB]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 h-10 px-3 text-sm border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
          />
          <Button
            variant="primary"
            size="md"
            icon={<Send className="h-4 w-4" />}
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          />
        </div>
      </div>
    </div>
  );
};
