
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  tradeInfo?: {
    symbol: string;
    quantity: number;
    side: 'buy' | 'sell';
  };
};

export type PortfolioPosition = {
  symbol: string;
  qty: number;
  market_value: number;
  unrealized_pl: number;
  avg_entry_price: number;
  current_price: number;
  change_today: number;
};

export type TradeHistory = {
  id: string;
  symbol: string;
  quantity: number;
  trade_type: 'buy' | 'sell';
  price_at_execution: number;
  executed_at: string;
  status: string;
  user_id?: string;
  alpaca_order_id?: string;
  via_chatbot?: boolean;
};

export const useTradingAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingTrade, setPendingTrade] = useState<{
    symbol: string;
    quantity: number;
    side: 'buy' | 'sell';
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendMessage = async (message: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to use the trading assistant',
        variant: 'destructive'
      });
      return null;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: message,
      role: 'user',
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatLoading(true);

    try {
      const response = await supabase.functions.invoke('trade-assistant', {
        body: JSON.stringify({
          action: 'PROCESS_CHAT',
          userId: user.id,
          message,
          pendingTrade: pendingTrade // Pass the pending trade to maintain context
        })
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { messageResponse, intent, tradeInfo } = response.data;

      // If this is confirming a trade, clear the pending trade
      if (intent === 'EXECUTE_TRADE' && tradeInfo) {
        setPendingTrade(null);
        
        // After execution, refresh portfolio data
        await fetchPortfolioPositions();
        await fetchTradeHistory();
      } 
      // If this is a new trade request, set the pending trade
      else if (intent === 'TRADE_CONFIRMATION' && tradeInfo) {
        setPendingTrade(tradeInfo);
      }

      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: messageResponse,
        role: 'assistant',
        timestamp: new Date(),
        tradeInfo: tradeInfo
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      return response.data;
    } catch (err) {
      console.error('Chat processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred processing your request';
      
      // Add error response to chat
      const errorResponse: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        content: `I encountered an error: ${errorMessage}. Please try again.`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorResponse]);
      
      toast({
        title: 'Assistant Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setChatLoading(false);
    }
  };

  const executeTrade = async (symbol: string, quantity: number, tradeType: 'buy' | 'sell') => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to execute trades',
        variant: 'destructive'
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('trade-assistant', {
        body: JSON.stringify({
          action: 'EXECUTE_TRADE',
          userId: user.id,
          symbol,
          quantity,
          side: tradeType
        })
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const tradeResult = response.data;

      if (tradeResult.success) {
        toast({
          title: 'Trade Executed',
          description: `Successfully ${tradeType}d ${quantity} shares of ${symbol}`,
          variant: 'default'
        });
        
        // Refresh portfolio and trades after a successful trade
        await fetchPortfolioPositions();
        await fetchTradeHistory();
        
        return tradeResult;
      } else {
        toast({
          title: 'Trade Failed',
          description: tradeResult.error || 'Unable to execute trade',
          variant: 'destructive'
        });
        return null;
      }
    } catch (err) {
      console.error('Trade execution error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Trade Error',
        description: err instanceof Error ? err.message : 'Unable to execute trade',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioPositions = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to view portfolio',
        variant: 'destructive'
      });
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching portfolio positions from edge function");
      
      // First, try to get positions from Alpaca via the edge function
      const response = await supabase.functions.invoke('trade-assistant', {
        body: JSON.stringify({
          action: 'GET_PORTFOLIO',
          userId: user.id
        })
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (Array.isArray(response.data) && response.data.length > 0) {
        setPortfolioPositions(response.data);
        console.log("Portfolio positions updated from Alpaca:", response.data);
        return response.data;
      } 
      
      // If no positions from Alpaca, check our database's portfolio table
      console.log("No positions from Alpaca, checking database portfolio table");
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id);
      
      if (portfolioError) {
        throw new Error(portfolioError.message);
      }
      
      if (portfolioData && portfolioData.length > 0) {
        // We need to get current prices for these positions
        const enrichedPortfolio = await Promise.all(portfolioData.map(async (position) => {
          try {
            // Get current price from our stock data edge function
            const priceResponse = await supabase.functions.invoke('stock-data', {
              body: JSON.stringify({ 
                action: 'CURRENT_PRICE', 
                symbol: position.stock_symbol
              })
            });
            
            const currentPrice = priceResponse.data?.price || position.purchase_price;
            const marketValue = currentPrice * position.quantity;
            const unrealizedPL = marketValue - (position.purchase_price * position.quantity);
            
            return {
              symbol: position.stock_symbol,
              qty: position.quantity,
              market_value: marketValue,
              unrealized_pl: unrealizedPL,
              avg_entry_price: position.purchase_price,
              current_price: currentPrice,
              change_today: 0 // Not available from our DB
            };
          } catch (e) {
            console.error(`Error enriching position for ${position.stock_symbol}:`, e);
            // Return position with estimated data
            const marketValue = position.purchase_price * position.quantity;
            return {
              symbol: position.stock_symbol,
              qty: position.quantity,
              market_value: marketValue,
              unrealized_pl: 0,
              avg_entry_price: position.purchase_price,
              current_price: position.purchase_price,
              change_today: 0
            };
          }
        }));
        
        setPortfolioPositions(enrichedPortfolio);
        console.log("Portfolio positions updated from database:", enrichedPortfolio);
        return enrichedPortfolio;
      }
      
      // No positions found anywhere
      console.log("No portfolio positions found");
      setPortfolioPositions([]);
      return [];
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unable to fetch portfolio');
      toast({
        title: 'Portfolio Error',
        description: 'Unable to retrieve portfolio positions',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTradeHistory = async () => {
    if (!user) {
      return [];
    }

    try {
      console.log("Fetching trade history from database");
      const { data, error } = await supabase
        .from('user_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convert the trade data to the correct TradeHistory type
      const typedTradeHistory: TradeHistory[] = (data || []).map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        quantity: trade.quantity,
        trade_type: trade.trade_type === 'buy' ? 'buy' : 'sell',
        price_at_execution: Number(trade.price_at_execution) || 0,
        executed_at: trade.executed_at,
        status: trade.status,
        user_id: trade.user_id,
        alpaca_order_id: trade.alpaca_order_id,
        via_chatbot: trade.via_chatbot
      }));

      console.log("Trade history updated:", typedTradeHistory);
      setTradeHistory(typedTradeHistory);
      return typedTradeHistory;
    } catch (err) {
      console.error('Trade history fetch error:', err);
      toast({
        title: 'History Error',
        description: 'Unable to retrieve trade history',
        variant: 'destructive'
      });
      return [];
    }
  };

  // Load portfolio positions and trade history when user changes
  useEffect(() => {
    if (user) {
      fetchPortfolioPositions();
      fetchTradeHistory();
    }
  }, [user]);

  return {
    executeTrade,
    fetchPortfolioPositions,
    fetchTradeHistory,
    sendMessage,
    portfolioPositions,
    tradeHistory,
    chatMessages,
    pendingTrade,
    loading,
    chatLoading,
    error
  };
};
