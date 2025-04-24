import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '../../components/Spinner';
import { Bot, Send, User, RefreshCw, TrendingUp, Info, BarChart, ChevronUp, ChevronDown } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Message types
type ChatRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  content: string;
  role: ChatRole;
  timestamp: Date;
  stockData?: any;
}

interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: string;
}

const API_KEY = import.meta.env.VITE_NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

const ChatBot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      content: 'Hello! I\'m your financial assistant. You can ask me about stocks, market data, company information, or get recommendations. Try asking about top stocks, historical data, or specific company details.',
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    fetchStockData, 
    fetchStockNews, 
    fetchMarketIndices 
  } = useStockData();
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process user messages
  const processMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: userInput.trim(),
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Parse the query to identify the intent
      const lowerInput = userInput.toLowerCase();
      
      // Check for market overview / top stocks requests
      if (lowerInput.includes('top stocks') || 
          lowerInput.includes('best stocks') || 
          lowerInput.includes('trending stocks') || 
          lowerInput.includes('market overview')) {
        await handleTopStocksRequest();
        return;
      }
      
      // Check for historical data requests
      if (lowerInput.includes('historical data') || 
          lowerInput.includes('history') || 
          lowerInput.includes('chart') || 
          lowerInput.includes('performance') || 
          lowerInput.includes('trend')) {
        // Extract the stock symbol/name
        const stockName = extractStockName(lowerInput);
        if (stockName) {
          const stockSymbol = getStockSymbol(stockName);
          await handleHistoricalDataRequest(stockSymbol);
          return;
        }
      }
      
      // Check for specific stock data request
      // Improved regex pattern to catch more variations
      const stockPattern = /(?:price|data|info|chart|about|details|stock|share|price of|check|show|get|tell me about)\s+(?:of\s+|for\s+|on\s+)?([A-Za-z0-9\s\.]+)(?:\s+stock)?/i;
      const stockMatch = userInput.match(stockPattern);
      
      if (stockMatch && stockMatch[1]) {
        const stockName = stockMatch[1].trim();
        // Don't process common words that might be falsely matched
        if (!['a', 'the', 'is', 'are', 'was', 'were', 'will', 'would', 'should'].includes(stockName.toLowerCase())) {
          const stockSymbol = getStockSymbol(stockName);
          await handleStockInfoRequest(stockSymbol);
          return;
        }
      }
      
      // Direct company name check
      const companies = [
        'reliance', 'tata', 'infosys', 'hdfc', 'sbi', 'apple', 'microsoft', 
        'amazon', 'google', 'facebook', 'meta', 'tesla', 'netflix', 'nvidia'
      ];
      
      for (const company of companies) {
        if (lowerInput.includes(company)) {
          const stockSymbol = getStockSymbol(company);
          await handleStockInfoRequest(stockSymbol);
          return;
        }
      }
      
      // Check for known stock symbols directly
      const symbolMatch = userInput.match(/\b([A-Z]{2,5}(?:\.NS)?)\b/);
      if (symbolMatch && symbolMatch[1]) {
        await handleStockInfoRequest(symbolMatch[1]);
        return;
      }
      
      // For other queries, combine AI with market context
      await handleHybridQuery(userInput);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Extract stock name from query
  const extractStockName = (query: string): string | null => {
    // Check for "of X" or "for X" patterns
    const ofPattern = /(?:of|for|about)\s+([A-Za-z0-9\s\.]+)(?:\s+stock)?/i;
    const ofMatch = query.match(ofPattern);
    if (ofMatch && ofMatch[1]) {
      return ofMatch[1].trim();
    }
    
    // Check for known company names
    const companies = {
      'reliance': 'reliance',
      'tata': 'tata',
      'infosys': 'infosys',
      'hdfc': 'hdfc',
      'sbi': 'sbi',
      'apple': 'apple',
      'microsoft': 'microsoft',
      'amazon': 'amazon',
      'google': 'google',
      'facebook': 'facebook',
      'meta': 'meta',
      'tesla': 'tesla',
      'netflix': 'netflix',
      'nvidia': 'nvidia'
    };
    
    for (const [name, value] of Object.entries(companies)) {
      if (query.includes(name)) {
        return value;
      }
    }
    
    return null;
  };

  // Handle top stocks request
  const handleTopStocksRequest = async () => {
    try {
      // Fetch real-time market indices using Alpha Vantage
      const response = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action: 'MARKET_INDICES' })
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // If there's market data
      if (response.data && response.data.indices) {
        const marketData = response.data.indices;
        
        // Create a message with actual market data
        const stocksMessage: ChatMessage = {
          id: `stocks-${Date.now()}`,
          content: 'Here are the current top market indices based on real-time data:',
          role: 'assistant',
          timestamp: new Date(),
          stockData: marketData
        };
        
        setMessages(prev => [...prev, stocksMessage]);
        
        // Also fetch some general market news
        const newsResponse = await fetchStockNews();
        if (newsResponse && newsResponse.feed) {
          const newsMessage: ChatMessage = {
            id: `news-${Date.now()}`,
            content: 'Here are some recent market news from Alpha Vantage:',
            role: 'assistant',
            timestamp: new Date(),
            stockData: { type: 'news', data: newsResponse.feed.slice(0, 3) }
          };
          
          setMessages(prev => [...prev, newsMessage]);
        }
      } else {
        throw new Error('No market data available');
      }
    } catch (error) {
      console.error('Error fetching top stocks:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I couldn\'t fetch the top stocks data at the moment. The Alpha Vantage API might be rate-limited. Please try again later.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle historical data request
  const handleHistoricalDataRequest = async (symbol: string) => {
    try {
      // Fetch daily historical data using Alpha Vantage
      const historyResponse = await fetchStockData(symbol, 'daily');
      
      if (!historyResponse || historyResponse.error) {
        throw new Error(`Failed to fetch historical data for ${symbol}`);
      }
      
      // Get current price
      const priceResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action: 'CURRENT_PRICE', symbol })
      });
      
      // Format a response with the historical data
      const historyMessage: ChatMessage = {
        id: `history-${Date.now()}`,
        content: `Here's the historical data for ${symbol}:`,
        role: 'assistant',
        timestamp: new Date(),
        stockData: {
          type: 'history',
          symbol,
          price: priceResponse.data?.price,
          history: historyResponse,
          timestamp: new Date().toISOString()
        }
      };
      
      setMessages(prev => [...prev, historyMessage]);
      
      // Add a data interpretation
      if (historyResponse['Time Series (Daily)']) {
        const timeSeriesData = historyResponse['Time Series (Daily)'];
        const dates = Object.keys(timeSeriesData).sort();
        
        if (dates.length > 1) {
          const latestDate = dates[0];
          const earliestDate = dates[dates.length - 1];
          const latestClose = parseFloat(timeSeriesData[latestDate]['4. close']);
          const earliestClose = parseFloat(timeSeriesData[earliestDate]['4. close']);
          const percentChange = ((latestClose - earliestClose) / earliestClose) * 100;
          
          const interpretationMessage: ChatMessage = {
            id: `interpretation-${Date.now()}`,
            content: `Based on the historical data, ${symbol} has ${percentChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(2)}% from ${earliestDate} to ${latestDate}. The latest closing price was $${latestClose.toFixed(2)}.`,
            role: 'assistant',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, interpretationMessage]);
        }
      }
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: `Sorry, I couldn't fetch historical data for ${symbol} from Alpha Vantage. The API might be rate-limited or the symbol might be incorrect.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle specific stock info request
  const handleStockInfoRequest = async (symbol: string) => {
    try {
      // Fetch current price from Alpha Vantage
      const priceResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action: 'CURRENT_PRICE', symbol })
      });

      if (priceResponse.error) {
        throw new Error(priceResponse.error.message);
      }

      // Fetch basic historical data for context
      const historyResponse = await fetchStockData(symbol, 'daily');
      
      // Fetch news related to the stock
      const newsResponse = await fetchStockNews(symbol);

      // Create a real-time data response
      const stockMessage: ChatMessage = {
        id: `stock-${Date.now()}`,
        content: `Here's the real-time information for ${symbol} from Alpha Vantage:`,
        role: 'assistant',
        timestamp: new Date(),
        stockData: {
          type: 'stock',
          symbol,
          price: priceResponse.data?.price,
          history: historyResponse,
          timestamp: priceResponse.data?.timestamp
        }
      };
      
      setMessages(prev => [...prev, stockMessage]);

      // Calculate some basic metrics if historical data is available
      if (historyResponse && historyResponse['Time Series (Daily)']) {
        try {
          const timeSeriesData = historyResponse['Time Series (Daily)'];
          const dates = Object.keys(timeSeriesData).sort();
          
          if (dates.length > 1) {
            const latestDate = dates[0];
            const previousDate = dates[1];
            const latestClose = parseFloat(timeSeriesData[latestDate]['4. close']);
            const previousClose = parseFloat(timeSeriesData[previousDate]['4. close']);
            const dailyChange = ((latestClose - previousClose) / previousClose) * 100;
            
            // Add an analysis message
            const analysisMessage: ChatMessage = {
              id: `analysis-${Date.now()}`,
              content: `${symbol} is currently trading at $${priceResponse.data?.price.toFixed(2)}. Based on historical data, the stock ${dailyChange >= 0 ? 'rose' : 'fell'} by ${Math.abs(dailyChange).toFixed(2)}% in the most recent trading day.`,
              role: 'assistant',
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, analysisMessage]);
          }
        } catch (error) {
          console.error('Error analyzing historical data:', error);
        }
      }

      // Add news if available
      if (newsResponse && newsResponse.feed && newsResponse.feed.length > 0) {
        const newsMessage: ChatMessage = {
          id: `news-${Date.now()}`,
          content: `Here are some recent news related to ${symbol} from Alpha Vantage:`,
          role: 'assistant',
          timestamp: new Date(),
          stockData: { type: 'news', data: newsResponse.feed.slice(0, 3) }
        };
        
        setMessages(prev => [...prev, newsMessage]);
      }
    } catch (error) {
      console.error(`Error fetching stock info for ${symbol}:`, error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: `Sorry, I couldn't fetch real-time information for ${symbol} from Alpha Vantage. The API might be rate-limited or the symbol might be incorrect.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle hybrid queries - combining AI with market data
  const handleHybridQuery = async (query: string) => {
    try {
      // First fetch some market context to provide to Gemini
      const marketResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action: 'MARKET_INDICES' })
      });

      let marketContext = "";
      if (marketResponse.data && marketResponse.data.indices) {
        marketContext = "Current market indices:\n" + 
          marketResponse.data.indices.map((idx: any) => 
            `${idx.symbol}: ${idx.price} (${idx.changePercent})`
          ).join("\n");
      }

      // Use Gemini with real-time market context
      if (!API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      // Create context-aware prompt with real-time data
      const prompt = `
        You are a financial assistant AI specializing in stock market information and analysis.
        
        CURRENT MARKET CONTEXT:
        ${marketContext || "Market data is currently unavailable."}
        
        USER QUERY: ${query}
        
        Provide a helpful, concise response about the query based on the current market context.
        If the query is about specific stocks or market trends, reference the market context provided.
        If appropriate, suggest the user ask about specific stocks to get real-time data.
        
        Keep your response under 250 words, focused, and easy to understand for someone new to investing.
      `;
      
      // Generate response with real-time context
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: text,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error with hybrid query:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'I apologize, but I had trouble processing your query with real-time market data. Please try asking specifically about a stock symbol for real-time information.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Helper function to convert company name to stock symbol
  const getStockSymbol = (name: string): string => {
    // Enhanced mapping for common stocks
    const symbolMap: {[key: string]: string} = {
      'apple': 'AAPL',
      'microsoft': 'MSFT',
      'amazon': 'AMZN',
      'google': 'GOOGL',
      'alphabet': 'GOOGL',
      'facebook': 'META',
      'meta': 'META',
      'tesla': 'TSLA',
      'netflix': 'NFLX',
      'nvidia': 'NVDA',
      'tata': 'TCS.NS',
      'tcs': 'TCS.NS',
      'infosys': 'INFY.NS',
      'reliance': 'RELIANCE.NS',
      'hdfc': 'HDFCBANK.NS',
      'sbi': 'SBIN.NS',
    };
    
    const lowerName = name.toLowerCase();
    
    // Check if we have a direct mapping
    for (const [key, value] of Object.entries(symbolMap)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    
    // If no mapping found, assume it's already a symbol
    return name.toUpperCase();
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processMessage(inputMessage);
    }
  };

  // Render message content
  const renderMessageContent = (message: ChatMessage) => {
    if (!message.stockData) {
      return <p className="whitespace-pre-wrap">{message.content}</p>;
    }

    // Render market indices
    if (Array.isArray(message.stockData)) {
      return (
        <div>
          <p className="mb-2">{message.content}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {message.stockData.map((index, i) => (
              <div key={i} className="bg-muted p-2 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium">{index.symbol}</p>
                  <p className="text-sm text-muted-foreground">Price: {index.price}</p>
                </div>
                <div className={index.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {index.isPositive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {index.changePercent}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Render news data
    if (message.stockData.type === 'news') {
      return (
        <div>
          <p className="mb-2">{message.content}</p>
          <div className="space-y-2 mt-2">
            {message.stockData.data.map((news: any, i: number) => (
              <div key={i} className="bg-muted p-2 rounded-md">
                <a href={news.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                  {news.title}
                </a>
                <p className="text-sm text-muted-foreground">{news.summary.substring(0, 100)}...</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(news.time_published).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Render stock data
    if (message.stockData.type === 'stock') {
      return (
        <div>
          <p className="mb-2">{message.content}</p>
          <div className="bg-muted p-3 rounded-md mt-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-lg">{message.stockData.symbol}</p>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(message.stockData.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="text-xl font-bold">
                ${typeof message.stockData.price === 'number' ? message.stockData.price.toFixed(2) : message.stockData.price}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render historical data
    if (message.stockData.type === 'history') {
      return (
        <div>
          <p className="mb-2">{message.content}</p>
          <div className="bg-muted p-3 rounded-md mt-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-lg">{message.stockData.symbol} Historical Data</p>
                <p className="text-sm text-muted-foreground">
                  From Alpha Vantage API
                </p>
              </div>
            </div>
            {message.stockData.history && message.stockData.history['Time Series (Daily)'] && (
              <div className="mt-3 max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Open</th>
                      <th className="text-right py-2">High</th>
                      <th className="text-right py-2">Low</th>
                      <th className="text-right py-2">Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(message.stockData.history['Time Series (Daily)'])
                      .slice(0, 10)
                      .map(date => {
                        const data = message.stockData.history['Time Series (Daily)'][date];
                        return (
                          <tr key={date} className="border-b border-gray-100">
                            <td className="py-2">{date}</td>
                            <td className="text-right py-2">${parseFloat(data['1. open']).toFixed(2)}</td>
                            <td className="text-right py-2">${parseFloat(data['2. high']).toFixed(2)}</td>
                            <td className="text-right py-2">${parseFloat(data['3. low']).toFixed(2)}</td>
                            <td className="text-right py-2">${parseFloat(data['4. close']).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    return <p>{message.content}</p>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Assistant</h1>
          <p className="text-muted-foreground">
            Ask about stocks, market trends, and real-time investment information
          </p>
        </div>
      </div>
      
      <Card className="h-[calc(100vh-240px)]">
        <CardHeader>
          <CardTitle>Stock Market ChatBot</CardTitle>
          <CardDescription>
            Powered by Gemini AI and Alpha Vantage real-time data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
          <ScrollArea className="flex-grow p-6">
            <div className="flex flex-col space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`flex max-w-[85%] rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-12' 
                        : 'bg-muted mr-12'
                    }`}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {message.role === 'user' ? (
                        <User className="h-6 w-6" />
                      ) : (
                        <Bot className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-grow">
                      {renderMessageContent(message)}
                      <div className="text-xs opacity-70 mt-2 text-right">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
              {loading && (
                <div className="flex justify-center my-2">
                  <Spinner size="md" />
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="border-t p-4 mt-auto">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about stocks, market data, or investment information..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                className="flex-grow"
              />
              <Button 
                onClick={() => processMessage(inputMessage)} 
                disabled={loading || !inputMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => processMessage("Show me the top stocks today")}
                disabled={loading}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Top Stocks
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => processMessage("Reliance historical data")}
                disabled={loading}
              >
                <BarChart className="h-3 w-3 mr-1" />
                Reliance History
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => processMessage("Tell me about Apple stock")}
                disabled={loading}
              >
                <Info className="h-3 w-3 mr-1" />
                Apple Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => processMessage("MSFT data")}
                disabled={loading}
              >
                <BarChart className="h-3 w-3 mr-1" />
                Microsoft Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatBot;
