'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Loader2,
  Bot,
  User,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { extractKeywords, highlightText, getHighlightedExcerpt } from '@/lib/text-highlighter';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  userQuery?: string; // Original user question for highlighting
  citations?: Array<{
    source: string;
    excerpt: string;
    score: number;
  }>;
}

interface AIChatWidgetProps {
  projectId?: string;
  supplierId?: string;
  className?: string;
}

export function AIChatWidget({ projectId, supplierId, className }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    setIsLoading(true);

    try {
      const response = await fetch('/api/framework-b/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId,
          context: {
            projectId,
            supplierId,
          },
          ragOptions: {
            minScore: 0.6,
            topK: 5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      if (data.success) {
        // Update conversation ID
        if (!conversationId) {
          setConversationId(data.conversationId);
        }

        // Add AI message
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message.content,
            timestamp: data.message.timestamp,
            userQuery: userMessage, // Store user query for highlighting
            citations: data.message.citations,
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConversationId(null);
    toast.success('Chat cleared');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg',
          className
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'fixed bottom-6 right-6 w-96 shadow-2xl border-2 z-50',
        isMinimized && 'h-14',
        !isMinimized && 'h-[600px]',
        className
      )}
    >
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(600px-65px)]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Ask me anything about your documents!</p>
                  <p className="text-xs mt-2">
                    I can help you find information, summarize content, and answer questions.
                  </p>
                </div>
              )}

              {messages.map((message, index) => {
                // Extract keywords from user query for highlighting
                const keywords = message.userQuery ? extractKeywords(message.userQuery) : [];

                return (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' && 'justify-end'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 max-w-[80%]',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.role === 'assistant' && keywords.length > 0
                          ? highlightText(message.content, keywords, {
                              className: 'bg-yellow-200/50 dark:bg-yellow-800/30 font-medium rounded px-0.5',
                            })
                          : message.content}
                      </p>

                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                          <p className="text-xs font-semibold opacity-70">Sources:</p>
                          {message.citations.map((citation, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 text-xs bg-background/50 rounded p-2"
                            >
                              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{citation.source}</div>
                                <div className="text-muted-foreground line-clamp-2 mt-1">
                                  {keywords.length > 0
                                    ? getHighlightedExcerpt(citation.excerpt, keywords, 200, {
                                        className: 'bg-yellow-200 dark:bg-yellow-800 font-medium rounded px-0.5',
                                      })
                                    : citation.excerpt}
                                </div>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {Math.round(citation.score * 100)}% match
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs opacity-50 mt-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            {messages.length > 0 && (
              <div className="mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  className="text-xs"
                >
                  Clear chat
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your documents..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
