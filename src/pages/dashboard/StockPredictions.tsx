
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCcw } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { StockMarketInsights } from '@/components/stocks/StockMarketInsights';
import { StockWatchlist } from '@/components/stocks/StockWatchlist';
import { StockNews } from '@/components/stocks/StockNews';

const StockPredictions = () => {
  const [activeTab, setActiveTab] = useState('watchlist');
  const { loading, fetchStockData } = useStockData();

  const handleRefresh = () => {
    // Refresh market data
    fetchStockData('NIFTY50');
    fetchStockData('SENSEX');
    fetchStockData('NIFTYBANK');
    fetchStockData('NIFTYIT');
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
            Refresh Prices
          </Button>
          <Button>Generate Predictions</Button>
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
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                Coming soon: AI-powered stock predictions
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="market-data" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Market Data</CardTitle>
              </CardHeader>
              <CardContent>
                Coming soon: Detailed market data and charts
              </CardContent>
            </Card>
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
