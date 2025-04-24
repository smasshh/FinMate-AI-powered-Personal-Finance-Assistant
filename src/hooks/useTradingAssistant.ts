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
  const [simulationMode, setSimulationMode] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<{
    symbol: string;
    quantity: number;
    side: 'buy' | 'sell';
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Detect if we're in simulation mode whenever an error contains certain keywords
  useEffect(() => {
    if (error && (
        error.includes('403 Forbidden') || 
        error.includes('forbidden') || 
        error.includes('simulation')
      )) {
      setSimulationMode(true);
    }
  }, [error]);

  // Also check trade history for simulation-based trades
  useEffect(() => {
    // Look for trades with IDs starting with "local-" which indicates simulation
    if (tradeHistory.some(trade => trade.alpaca_order_id?.startsWith('local-'))) {
      setSimulationMode(true);
    }
  }, [tradeHistory]);

  // Automatically check if we need to use simulation mode on first load
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Try to fetch portfolio to see if Alpaca API is working
        const response = await supabase.functions.invoke('trade-assistant', {
          body: JSON.stringify({
            action: 'GET_PORTFOLIO',
            userId: user?.id || 'not-logged-in'
          })
        });
        
        if (response.error) {
          console.log('API error on initial check, using simulation mode', response.error);
          setSimulationMode(true);
          setError('403 Forbidden - Running in simulation mode');
        }
      } catch (err) {
        console.error('Error checking API status:', err);
        setSimulationMode(true);
      }
    };
    
    if (user) {
      checkApiStatus();
    }
  }, [user]);

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

      // Handle trade confirmation locally if Alpaca API fails with 403/forbidden
      if (response.error && (response.error.message?.includes('403 Forbidden') || 
                            response.error.message?.includes('forbidden')) && 
          pendingTrade && 
          message.toLowerCase().includes('yes')) {
        
        console.log('Alpaca API error, handling trade confirmation locally');
        
        // Get current stock price
        const priceResponse = await supabase.functions.invoke('stock-data', {
          body: JSON.stringify({ 
            action: 'CURRENT_PRICE', 
            symbol: pendingTrade.symbol
          })
        });
        
        // Use fallback price if API failed
        const price = priceResponse.data?.price || 100.00;
        
        // Generate a unique ID
        const tradeId = `local-${Date.now()}`;
        
        // Insert trade record directly to Supabase
        const { error: tradeError } = await supabase
          .from('user_trades')
          .insert({
            user_id: user.id,
            symbol: pendingTrade.symbol,
            quantity: pendingTrade.quantity,
            trade_type: pendingTrade.side,
            price_at_execution: price,
            status: 'filled',
            via_chatbot: true,
            alpaca_order_id: tradeId
          });
          
        if (tradeError) {
          throw new Error(`Failed to record trade: ${tradeError.message}`);
        }
        
        // Get existing portfolio 
        const { data: existingPosition, error: posError } = await supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', user.id)
          .eq('stock_symbol', pendingTrade.symbol)
          .single();
          
        if (posError && posError.code !== 'PGRST116') { // Not found is ok
          throw new Error(`Failed to check portfolio: ${posError.message}`);
        }
        
        // Update portfolio
        if (existingPosition) {
          // Calculate new position
          let newQuantity = existingPosition.quantity;
          let newAvgPrice = existingPosition.purchase_price;
          
          if (pendingTrade.side === 'buy') {
            // Update average price only when buying
            const totalValue = (existingPosition.quantity * existingPosition.purchase_price) + (pendingTrade.quantity * price);
            newQuantity = existingPosition.quantity + pendingTrade.quantity;
            newAvgPrice = totalValue / newQuantity;
          } else {
            // For selling, just reduce quantity
            newQuantity = Math.max(0, existingPosition.quantity - pendingTrade.quantity);
          }
          
          if (newQuantity > 0) {
            // Update existing position
            const { error: updateError } = await supabase
              .from('portfolio')
              .update({
                quantity: newQuantity,
                purchase_price: newAvgPrice,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPosition.id);
              
            if (updateError) {
              throw new Error(`Failed to update position: ${updateError.message}`);
            }
          } else {
            // Remove position if quantity is 0
            const { error: deleteError } = await supabase
              .from('portfolio')
              .delete()
              .eq('id', existingPosition.id);
              
            if (deleteError) {
              throw new Error(`Failed to delete position: ${deleteError.message}`);
            }
          }
        } else if (pendingTrade.side === 'buy') {
          // Create new position if buying
          const { error: insertError } = await supabase
            .from('portfolio')
            .insert({
              user_id: user.id,
              stock_symbol: pendingTrade.symbol,
              quantity: pendingTrade.quantity,
              purchase_price: price,
              purchase_date: new Date().toISOString()
            });
            
          if (insertError) {
            throw new Error(`Failed to create position: ${insertError.message}`);
          }
        } else {
          throw new Error(`Cannot sell ${pendingTrade.symbol} as you don't own any shares`);
        }
        
        // Create success response for the user
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          content: `✅ Trade executed successfully in simulation mode! I've ${pendingTrade.side === 'buy' ? 'bought' : 'sold'} ${pendingTrade.quantity} shares of ${pendingTrade.symbol} at $${price.toFixed(2)} per share.`,
          role: 'assistant',
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, assistantMessage]);
        setPendingTrade(null);
        
        // Refresh portfolio data
        await fetchPortfolioPositions();
        await fetchTradeHistory();
        
        setChatLoading(false);
        return {
          messageResponse: assistantMessage.content,
          intent: 'EXECUTE_TRADE',
          tradeInfo: pendingTrade
        };
      }

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
        // Check if error contains Alpaca 403 error message
        if (response.error.message?.includes('403 Forbidden') || 
            response.error.message?.includes('forbidden')) {
          console.log('Alpaca API error, using local simulation instead');
          
          // Get current stock price (using Alpha Vantage through our edge function)
          const priceResponse = await supabase.functions.invoke('stock-data', {
            body: JSON.stringify({ 
              action: 'CURRENT_PRICE', 
              symbol: symbol
            })
          });
          
          // Use fallback price if API failed
          const price = priceResponse.data?.price || 100.00;
          
          // Generate a unique ID
          const tradeId = `local-${Date.now()}`;
          
          // Insert trade record directly to Supabase
          const { error: tradeError } = await supabase
            .from('user_trades')
            .insert({
              user_id: user.id,
              symbol: symbol,
              quantity: quantity,
              trade_type: tradeType,
              price_at_execution: price,
              status: 'filled',
              via_chatbot: false,
              alpaca_order_id: tradeId
            });
            
          if (tradeError) {
            throw new Error(`Failed to record trade: ${tradeError.message}`);
          }
          
          // Get existing portfolio 
          const { data: existingPosition, error: posError } = await supabase
            .from('portfolio')
            .select('*')
            .eq('user_id', user.id)
            .eq('stock_symbol', symbol)
            .single();
            
          if (posError && posError.code !== 'PGRST116') { // Not found is ok
            throw new Error(`Failed to check portfolio: ${posError.message}`);
          }
          
          // Update portfolio
          if (existingPosition) {
            // Calculate new position
            let newQuantity = existingPosition.quantity;
            let newAvgPrice = existingPosition.purchase_price;
            
            if (tradeType === 'buy') {
              // Update average price only when buying
              const totalValue = (existingPosition.quantity * existingPosition.purchase_price) + (quantity * price);
              newQuantity = existingPosition.quantity + quantity;
              newAvgPrice = totalValue / newQuantity;
            } else {
              // For selling, just reduce quantity
              newQuantity = Math.max(0, existingPosition.quantity - quantity);
            }
            
            if (newQuantity > 0) {
              // Update existing position
              const { error: updateError } = await supabase
                .from('portfolio')
                .update({
                  quantity: newQuantity,
                  purchase_price: newAvgPrice,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingPosition.id);
                
              if (updateError) {
                throw new Error(`Failed to update position: ${updateError.message}`);
              }
            } else {
              // Remove position if quantity is 0
              const { error: deleteError } = await supabase
                .from('portfolio')
                .delete()
                .eq('id', existingPosition.id);
                
              if (deleteError) {
                throw new Error(`Failed to delete position: ${deleteError.message}`);
              }
            }
          } else if (tradeType === 'buy') {
            // Create new position if buying
            const { error: insertError } = await supabase
              .from('portfolio')
              .insert({
                user_id: user.id,
                stock_symbol: symbol,
                quantity: quantity,
                purchase_price: price,
                purchase_date: new Date().toISOString()
              });
              
            if (insertError) {
              throw new Error(`Failed to create position: ${insertError.message}`);
            }
          } else {
            throw new Error(`Cannot sell ${symbol} as you don't own any shares`);
          }
          
          // Store the error message for other components to detect simulation mode
          setError(`403 Forbidden - Running in simulation mode`);
          
          toast({
            title: 'Trade Executed (Simulation)',
            description: `Successfully ${tradeType}d ${quantity} shares of ${symbol} at $${price.toFixed(2)}`,
            variant: 'default'
          });
          
          // Refresh portfolio and trades
          await fetchPortfolioPositions();
          await fetchTradeHistory();
          
          return {
            success: true,
            orderId: tradeId,
            filledPrice: price,
            status: 'filled',
            simulation: true
          };
        }
        
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
      let alpacaError = false;
      let alpacaPositions = [];
      
      try {
        // First, try to get positions from Alpaca via the edge function
        const response = await supabase.functions.invoke('trade-assistant', {
          body: JSON.stringify({
            action: 'GET_PORTFOLIO',
            userId: user.id
          })
        });
  
        if (response.error) {
          console.log("Error from Alpaca:", response.error);
          alpacaError = true;
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          alpacaPositions = response.data;
          setPortfolioPositions(alpacaPositions);
          console.log("Portfolio positions updated from Alpaca:", alpacaPositions);
          
          // Sync Alpaca positions with the local database
          syncAlpacaPositionsToLocalDB(alpacaPositions);
          
          return alpacaPositions;
        }
      } catch (alpacaErr) {
        console.error("Alpaca API request failed:", alpacaErr);
        alpacaError = true;
      }
      
      // If Alpaca failed or returned no positions, check our database's portfolio table
      console.log("Using local portfolio data");
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
        
        // If we had an API error, show a message to the user
        if (alpacaError) {
          toast({
            title: 'Using Simulated Portfolio',
            description: 'Alpaca API connection failed. Using local portfolio data instead.',
            variant: 'default'
          });
        }
        
        return enrichedPortfolio;
      }
      
      // No positions found anywhere
      console.log("No portfolio positions found");
      setPortfolioPositions([]);
      
      // If we had an API error but no local data, inform the user
      if (alpacaError) {
        toast({
          title: 'Trading Simulation Mode',
          description: 'Alpaca API connection failed. Running in local simulation mode.',
          variant: 'default'
        });
      }
      
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
  
  // Function to sync Alpaca positions with local database
  const syncAlpacaPositionsToLocalDB = async (positions: PortfolioPosition[]) => {
    if (!user || positions.length === 0) return;
    
    try {
      // Get current portfolio from database
      const { data: currentPortfolio } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id);
      
      // For each Alpaca position, update or create in local DB
      for (const position of positions) {
        const existingPosition = currentPortfolio?.find(
          p => p.stock_symbol === position.symbol
        );
        
        if (existingPosition) {
          // Update existing position
          await supabase
            .from('portfolio')
            .update({
              quantity: position.qty,
              purchase_price: position.avg_entry_price,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPosition.id);
        } else {
          // Create new position
          await supabase
            .from('portfolio')
            .insert({
              user_id: user.id,
              stock_symbol: position.symbol,
              quantity: position.qty,
              purchase_price: position.avg_entry_price,
              purchase_date: new Date().toISOString()
            });
        }
      }
      
      // Remove positions that are no longer in Alpaca
      const alpacaSymbols = positions.map(p => p.symbol);
      const localSymbols = currentPortfolio?.map(p => p.stock_symbol) || [];
      
      // Find symbols that are in local DB but not in Alpaca anymore
      const symbolsToRemove = localSymbols.filter(
        symbol => !alpacaSymbols.includes(symbol)
      );
      
      if (symbolsToRemove.length > 0) {
        for (const symbol of symbolsToRemove) {
          await supabase
            .from('portfolio')
            .delete()
            .eq('user_id', user.id)
            .eq('stock_symbol', symbol);
        }
      }
      
      console.log("Successfully synced Alpaca positions to local database");
    } catch (err) {
      console.error("Error syncing positions to local DB:", err);
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
    syncAlpacaPositionsToLocalDB,
    portfolioPositions,
    tradeHistory,
    chatMessages,
    pendingTrade,
    loading,
    chatLoading,
    error,
    simulationMode
  };
};
