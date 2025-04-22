
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useStockData = () => {
  const [stockPrices, setStockPrices] = useState(null);
  const [stockNews, setStockNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStockData = async (symbol: string) => {
    setLoading(true);
    try {
      const pricesResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action: 'DAILY_PRICES', symbol })
      });

      if (pricesResponse.error) throw new Error(pricesResponse.error.message);

      setStockPrices(pricesResponse.data);
    } catch (err: any) {
      setError(err);
      toast({
        title: 'Error fetching stock data',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStockNews = async (symbol?: string) => {
    setLoading(true);
    try {
      const newsResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ 
          action: 'NEWS', 
          symbol: symbol || '' // If no symbol provided, get general market news
        })
      });

      if (newsResponse.error) throw new Error(newsResponse.error.message);

      setStockNews(newsResponse.data);
    } catch (err: any) {
      setError(err);
      toast({
        title: 'Error fetching stock news',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string) => {
    if (!user) {
      setError(new Error('You must be logged in to add to watchlist'));
      return { error: 'You must be logged in to add to watchlist' };
    }
    
    const { data, error } = await supabase
      .from('stock_watchlist')
      .insert({ 
        stock_symbol: symbol,
        user_id: user.id 
      });
      
    return { data, error };
  };

  return { 
    stockPrices, 
    stockNews, 
    loading, 
    error, 
    fetchStockData,
    fetchStockNews,
    addToWatchlist 
  };
};
