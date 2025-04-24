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
                   
      console.log(`Fetching ${timeframe} stock data for ${symbol}`);
      
      const pricesResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action, symbol })
      });

      if (pricesResponse.error) {
        console.error(`Error from Supabase function:`, pricesResponse.error);
        throw new Error(pricesResponse.error.message);
      }
      
      // Check if the response data contains an error from Alpha Vantage
      if (pricesResponse.data?.error) {
        console.error(`Error from Alpha Vantage:`, pricesResponse.data.error);
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
      console.error(`Error in fetchStockData:`, err);
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
      console.log(`Fetching stock news${symbol ? ` for ${symbol}` : ''}`);
      
      const newsResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ 
          action: 'NEWS', 
          symbol: symbol || '' // If no symbol provided, get general market news
        })
      });

      if (newsResponse.error) {
        console.error(`Error from Supabase function:`, newsResponse.error);
        throw new Error(newsResponse.error.message);
      }
      
      // Check if the response data contains an error from Alpha Vantage
      if (newsResponse.data?.error) {
        console.error(`Error from Alpha Vantage:`, newsResponse.data.error);
        toast({
          title: 'API Limit Notice',
          description: newsResponse.data.error,
          variant: 'destructive',
        });
        
        // Return mock news data if API limit reached
        const mockNewsData = {
          feed: [
            {
              title: "Markets rally as technology stocks lead gains",
              summary: "Major indices closed higher as tech giants posted strong earnings, driving market sentiment upward.",
              url: "https://example.com/market-news-1",
              time_published: new Date().toISOString(),
              ticker_sentiment: [
                { ticker: "AAPL", relevance_score: 0.8 },
                { ticker: "MSFT", relevance_score: 0.7 }
              ]
            },
            {
              title: "Reserve Bank announces policy rate decision",
              summary: "The central bank kept interest rates unchanged, citing economic stability amid inflation concerns.",
              url: "https://example.com/market-news-2",
              time_published: new Date().toISOString(),
              ticker_sentiment: []
            },
            {
              title: "Indian IT sector shows resilience amid global challenges",
              summary: "Major IT companies reported better than expected results, showcasing sector strength.",
              url: "https://example.com/market-news-3",
              time_published: new Date().toISOString(),
              ticker_sentiment: [
                { ticker: "TCS.NS", relevance_score: 0.9 },
                { ticker: "INFY.NS", relevance_score: 0.8 }
              ]
            }
          ]
        };
        
        setStockNews(mockNewsData);
        return mockNewsData;
      }

      setStockNews(newsResponse.data);
      return newsResponse.data;
    } catch (err: any) {
      console.error(`Error in fetchStockNews:`, err);
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

  const fetchMarketIndices = async (useMockData: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching market indices with mock data:', useMockData);
      const response = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({
          action: 'MARKET_INDICES',
          useMockData: false // Always use real data
        })
      });

      if (response.error) {
        console.error('Error from Supabase function:', response.error);
        throw response.error;
      }

      if (response.data?.error) {
        console.error('Error in response:', response.data.error);
        throw new Error(response.data.error);
      }

      if (!response.data || !response.data.indices) {
        throw new Error('Invalid response format from market indices API');
      }

      console.log('Market indices data received:', response.data.indices);
      setMarketIndices(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching market indices:', error);
      setError(error);
      throw error;
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
    
    try {
      console.log(`Adding ${symbol} to watchlist for user ${user.id}`);
      
      // Check if already in watchlist
      const { data: existingData } = await supabase
        .from('stock_watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('stock_symbol', symbol)
        .single();
        
      if (existingData) {
        toast({
          title: 'Already in watchlist',
          description: `${symbol} is already in your watchlist`,
          variant: 'default',
        });
        return { data: existingData, error: null };
      }
        
      const { data, error } = await supabase
        .from('stock_watchlist')
        .insert({ 
          stock_symbol: symbol,
          user_id: user.id 
        });
        
      if (error) {
        console.error(`Error adding to watchlist:`, error);
        toast({
          title: 'Error adding to watchlist',
          description: error.message,
          variant: 'destructive',
        });
        return { data: null, error };
      } else {
        toast({
          title: 'Stock added',
          description: `${symbol} added to your watchlist`,
          variant: 'default',
        });
        return { data, error: null };
      }
    } catch (err: any) {
      console.error(`Error in addToWatchlist:`, err);
      toast({
        title: 'Error adding to watchlist',
        description: err.message,
        variant: 'destructive',
      });
      return { data: null, error: err };
    }
  };

  const generatePrediction = async (symbol: string) => {
    if (!user) {
      throw new Error('User must be logged in to generate predictions');
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Generating prediction for:', symbol);
      const response = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({
          action: 'GENERATE_PREDICTION',
          symbol,
          userId: user.id
        })
      });

      if (response.error) {
        console.error('Error generating prediction:', response.error);
        throw response.error;
      }

      if (response.data?.error) {
        console.error('Error in response:', response.data.error);
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      console.error('Error generating prediction:', error);
      setError(error);
      throw error;
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
