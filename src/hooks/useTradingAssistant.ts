
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useTradingAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioPositions, setPortfolioPositions] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

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
        description: error || 'Unable to execute trade',
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

  return {
    executeTrade,
    fetchPortfolioPositions,
    portfolioPositions,
    loading,
    error
  };
};
