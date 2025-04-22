
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useStockData } from '@/hooks/useStockData';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

export const StockMarketData = () => {
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('daily');
  const [watchlistStocks, setWatchlistStocks] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWatchlistStocks();
    }
  }, [user]);

  const fetchWatchlistStocks = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_watchlist')
        .select('stock_symbol')
        .eq('user_id', user?.id);

      if (error) throw error;
      setWatchlistStocks(data || []);
      
      // Select first stock by default if available
      if (data && data.length > 0 && !selectedStock) {
        setSelectedStock(data[0].stock_symbol);
      }
    } catch (error) {
      console.error('Error fetching watchlist stocks:', error);
    }
  };

  const fetchStockData = async () => {
    if (!selectedStock) return;
    
    try {
      setLoading(true);
      
      const response = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ 
          action: timeframe === 'daily' ? 'DAILY_PRICES' : 
                  timeframe === 'weekly' ? 'WEEKLY_PRICES' : 'MONTHLY_PRICES', 
          symbol: selectedStock 
        })
      });

      if (response.error) throw new Error(response.error.message);
      
      // Process data for charts
      const timeSeriesKey = 
        timeframe === 'daily' ? 'Time Series (Daily)' : 
        timeframe === 'weekly' ? 'Weekly Time Series' : 'Monthly Time Series';
      
      const timeSeries = response.data?.[timeSeriesKey] || {};
      
      const chartData = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseFloat(values['5. volume']),
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setStockData({
        symbol: selectedStock,
        timeframe,
        chartData: chartData.slice(-90) // Last 90 data points
      });
    } catch (error: any) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStock) {
      fetchStockData();
    }
  }, [selectedStock, timeframe]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Market Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Select Stock</label>
            <Select value={selectedStock} onValueChange={setSelectedStock}>
              <SelectTrigger>
                <SelectValue placeholder="Select a stock" />
              </SelectTrigger>
              <SelectContent>
                {watchlistStocks.map((stock) => (
                  <SelectItem key={stock.stock_symbol} value={stock.stock_symbol}>
                    {stock.stock_symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Timeframe</label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : stockData?.chartData?.length > 0 ? (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Price History: {stockData.symbol}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stockData.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }} 
                      interval={Math.floor(stockData.chartData.length / 10)}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#8884d8" 
                      name="Close Price"
                      dot={false}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Volume</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stockData.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }} 
                      interval={Math.floor(stockData.chartData.length / 10)}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()}`, '']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="volume" 
                      fill="#82ca9d" 
                      stroke="#82ca9d"
                      name="Volume"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Opening Price</div>
                <div className="text-xl font-semibold">
                  ${stockData.chartData[stockData.chartData.length - 1]?.open.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Closing Price</div>
                <div className="text-xl font-semibold">
                  ${stockData.chartData[stockData.chartData.length - 1]?.close.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-muted-foreground">High</div>
                <div className="text-xl font-semibold">
                  ${stockData.chartData[stockData.chartData.length - 1]?.high.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Low</div>
                <div className="text-xl font-semibold">
                  ${stockData.chartData[stockData.chartData.length - 1]?.low.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ) : selectedStock ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No data available for {selectedStock}.</p>
            <p className="text-sm mt-2">Try selecting a different stock or timeframe.</p>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Add stocks to your watchlist to view market data.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
