
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useStockData = () => {
  const [stockPrices, setStockPrices] = useState<any>(null);
  const [stockNews, setStockNews] = useState<any>(null);
  const [marketIndices, setMarketIndices] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStockData = async (symbol: string, timeframe: string = 'daily') => {
    setLoading(true);
    setError(null);
    try {
      const action = timeframe === 'daily' ? 'DAILY_PRICES' : 
                   timeframe === 'weekly' ? 'WEEKLY_PRICES' : 'MONTHLY_PRICES';
                   
      const pricesResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action, symbol })
      });

      if (pricesResponse.error) throw new Error(pricesResponse.error.message);
      
      // Check if the response data contains an error from Alpha Vantage
      if (pricesResponse.data?.error) {
        toast({
          title: 'API Limit Notice',
          description: `Could not fetch data for ${symbol}: ${pricesResponse.data.error}`,
          variant: 'destructive',
        });
        return null;
      }

      setStockPrices(pricesResponse.data);
      return pricesResponse.data;
    } catch (err: any) {
      setError(err);
      toast({
        title: 'Error fetching stock data',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchStockNews = async (symbol?: string) => {
    setLoading(true);
    setError(null);
    try {
      const newsResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ 
          action: 'NEWS', 
          symbol: symbol || '' // If no symbol provided, get general market news
        })
      });

      if (newsResponse.error) throw new Error(newsResponse.error.message);
      
      // Check if the response data contains an error from Alpha Vantage
      if (newsResponse.data?.error) {
        toast({
          title: 'API Limit Notice',
          description: newsResponse.data.error,
          variant: 'destructive',
        });
        return null;
      }

      setStockNews(newsResponse.data);
      return newsResponse.data;
    } catch (err: any) {
      setError(err);
      toast({
        title: 'Error fetching stock news',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketIndices = async () => {
    setLoading(true);
    setError(null);
    try {
      const indicesResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action: 'MARKET_INDICES' })
      });

      if (indicesResponse.error) throw new Error(indicesResponse.error.message);
      
      if (indicesResponse.data?.error) {
        toast({
          title: 'API Limit Notice',
          description: indicesResponse.data.error,
          variant: 'destructive',
        });
        return null;
      }

      setMarketIndices(indicesResponse.data);
      return indicesResponse.data;
    } catch (err: any) {
      setError(err);
      toast({
        title: 'Error fetching market indices',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string) => {
    if (!user) {
      setError(new Error('You must be logged in to add to watchlist'));
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to add to watchlist',
        variant: 'destructive',
      });
      return { error: 'You must be logged in to add to watchlist' };
    }
    
    const { data, error } = await supabase
      .from('stock_watchlist')
      .insert({ 
        stock_symbol: symbol,
        user_id: user.id 
      });
      
    if (error) {
      toast({
        title: 'Error adding to watchlist',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Stock added',
        description: `${symbol} added to your watchlist`,
        variant: 'default',
      });
    }
      
    return { data, error };
  };

  const generatePrediction = async (symbol: string) => {
    if (!user) {
      setError(new Error('You must be logged in to generate predictions'));
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to generate predictions',
        variant: 'destructive',
      });
      return { error: 'You must be logged in to generate predictions' };
    }
    
    try {
      setLoading(true);
      
      const response = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ 
          action: 'GENERATE_PREDICTION', 
          symbol,
          userId: user.id
        })
      });

      if (response.error) throw new Error(response.error.message);
      
      if (response.data?.error) {
        toast({
          title: 'Prediction Error',
          description: response.data.error,
          variant: 'destructive',
        });
        return { error: response.data.error };
      }
      
      return { data: response.data };
    } catch (err: any) {
      console.error('Error generating prediction:', err);
      toast({
        title: 'Error generating prediction',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { 
    stockPrices, 
    stockNews,
    marketIndices, 
    loading, 
    error, 
    fetchStockData,
    fetchStockNews,
    fetchMarketIndices,
    addToWatchlist,
    generatePrediction
  };
};
