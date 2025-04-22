
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
          message
        })
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { messageResponse, intent, tradeInfo } = response.data;

      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: messageResponse,
        role: 'assistant',
        timestamp: new Date(),
        tradeInfo: tradeInfo
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // If this was a trade confirmation response, refresh the portfolio
      if (intent === 'EXECUTE_TRADE' && tradeInfo) {
        await fetchPortfolioPositions();
        await fetchTradeHistory();
      }

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
      const response = await supabase.functions.invoke('trade-assistant', {
        body: JSON.stringify({
          action: 'GET_PORTFOLIO',
          userId: user.id
        })
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setPortfolioPositions(response.data);
      return response.data;
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
        price_at_execution: trade.price_at_execution,
        executed_at: trade.executed_at,
        status: trade.status,
        user_id: trade.user_id,
        alpaca_order_id: trade.alpaca_order_id,
        via_chatbot: trade.via_chatbot
      }));

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
    loading,
    chatLoading,
    error
  };
};
