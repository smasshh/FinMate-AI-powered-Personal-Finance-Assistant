
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Send, Bot, UserCircle } from 'lucide-react';
import { useTradingAssistant, ChatMessage } from '@/hooks/useTradingAssistant';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const AiTradingAssistant = () => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    sendMessage,
    chatMessages,
    chatLoading,
    fetchPortfolioPositions,
    loading
  } = useTradingAssistant();

  // Format timestamp to show only time
  const formatMessageTime = (timestamp: Date) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || chatLoading) return;
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Quick prompt buttons
  const quickPrompts = [
    "Buy 5 shares of AAPL",
    "Sell 3 shares of MSFT",
    "Show my portfolio",
    "How is the market today?"
  ];

  // Track which tab is active
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Assistant</h1>
          <p className="text-muted-foreground">
            Ask questions, get market data, or execute trades with text commands
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'bg-secondary' : ''}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            History
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              fetchPortfolioPositions();
            }}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3">
          <Card className="h-[calc(100vh-240px)]">
            <CardContent className="p-0 flex flex-col h-full">
              <ScrollArea className="flex-grow p-6">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Bot size={48} className="mb-4" />
                    <h3 className="text-lg font-medium">AI Trading Assistant</h3>
                    <p className="max-w-md mt-2">
                      Ask me to buy or sell stocks, check your portfolio, or get market information.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      {quickPrompts.map((prompt, index) => (
                        <Button 
                          key={index} 
                          variant="outline" 
                          className="text-left justify-start"
                          onClick={() => {
                            setInputMessage(prompt);
                          }}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-4">
                    {chatMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`flex max-w-[80%] rounded-lg p-4 ${
                            message.role === 'user' 
                              ? 'bg-primary text-primary-foreground ml-12' 
                              : 'bg-muted mr-12'
                          }`}
                        >
                          <div className="flex-shrink-0 mr-3">
                            {message.role === 'user' ? (
                              <UserCircle className="h-6 w-6" />
                            ) : (
                              <Bot className="h-6 w-6" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </div>
                            <div className="text-xs opacity-70 mt-1 text-right">
                              {formatMessageTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="resize-none"
                    rows={1}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={chatLoading || inputMessage.trim() === ''}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                  {quickPrompts.map((prompt, index) => (
                    <Button 
                      key={index} 
                      variant="secondary" 
                      size="sm"
                      className="text-xs whitespace-nowrap"
                      onClick={() => {
                        setInputMessage(prompt);
                      }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1">
          <Card className="h-[calc(100vh-240px)]">
            <CardHeader>
              <CardTitle>Paper Trading Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-600 dark:text-amber-400">
                This is a paper trading environment. No real money is being used. Practice trading without risk.
              </p>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Quick Tips</h3>
                  <ul className="text-sm space-y-2 list-disc pl-4">
                    <li>Say "Buy [quantity] shares of [symbol]" to purchase stocks</li>
                    <li>Ask "What's my portfolio value?" to check performance</li>
                    <li>Request "Show me market news for [symbol]" for updates</li>
                    <li>Type "Help" for more commands</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Market Hours</h3>
                  <p className="text-sm">Trading available 9:30 AM - 4:00 PM ET, Monday-Friday</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AiTradingAssistant;
