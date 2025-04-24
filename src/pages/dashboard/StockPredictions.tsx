import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCcw } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { StockMarketInsights } from '@/components/stocks/StockMarketInsights';
import { StockWatchlist } from '@/components/stocks/StockWatchlist';
import { StockNews } from '@/components/stocks/StockNews';
import { StockMarketData } from '@/components/stocks/StockMarketData';
import { StockPredictions as AIStockPredictions } from '@/components/stocks/StockPredictions';
import { useToast } from '@/hooks/use-toast';

const StockPredictions = () => {
  const [activeTab, setActiveTab] = useState('watchlist');
  const { loading, fetchStockData, fetchStockNews, fetchMarketIndices } = useStockData();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch market indices on load with mock data enabled
    fetchMarketIndices(true);
  }, []);

  const handleRefresh = async () => {
    toast({
      title: 'Refreshing Market Data',
      description: 'Updating stock prices and news...',
    });
    
    try {
      // Refresh market indices with mock data enabled
      await fetchMarketIndices(true);
      
      // Refresh market news
      await fetchStockNews();
      
      toast({
        title: 'Data Refreshed',
        description: 'Market data has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Could not update all market data. Try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Market Insights</h1>
          <p className="text-muted-foreground">
            AI-driven stock predictions, market trends, and financial news
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <StockMarketInsights />

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 h-auto gap-4">
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          <TabsTrigger value="market-data">Market Data</TabsTrigger>
          <TabsTrigger value="news">Market News</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="watchlist" className="m-0">
            <StockWatchlist />
          </TabsContent>
          <TabsContent value="predictions" className="m-0">
            <AIStockPredictions />
          </TabsContent>
          <TabsContent value="market-data" className="m-0">
            <StockMarketData />
          </TabsContent>
          <TabsContent value="news" className="m-0">
            <StockNews />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default StockPredictions;
