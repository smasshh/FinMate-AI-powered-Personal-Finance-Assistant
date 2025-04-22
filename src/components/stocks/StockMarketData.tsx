
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useStockData } from '@/hooks/useStockData';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { loading, fetchStockData } = useStockData();
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

  const isIndianStock = (symbol: string) => {
    return symbol?.endsWith('.BSE') || 
           symbol?.endsWith('.NSE') || 
           symbol?.includes('.NS') || 
           symbol?.includes('NIFTY') || 
           symbol?.includes('SENSEX');
  };

  const getCurrencySymbol = (symbol: string) => {
    return isIndianStock(symbol) ? '₹' : '$';
  };

  const fetchStockDataWithRetry = async (retry: boolean = false) => {
    if (!selectedStock) return;
    
    setErrorMessage(null);
    setIsRetrying(retry);
    
    const data = await fetchStockData(selectedStock, timeframe);
    
    if (!data) {
      setErrorMessage(`Could not fetch data for ${selectedStock}. The API may have reached its quota limit.`);
      setStockData(null);
      setIsRetrying(false);
      return;
    }
    
    // Process data for charts
    const timeSeriesKey = 
      timeframe === 'daily' ? 'Time Series (Daily)' : 
      timeframe === 'weekly' ? 'Weekly Time Series' : 'Monthly Time Series';
    
    const timeSeries = data[timeSeriesKey] || {};
    
    if (!timeSeries || Object.keys(timeSeries).length === 0) {
      if (!retry) {
        // Try again with a different timeframe
        if (timeframe === 'daily') {
          setTimeframe('weekly');
          fetchStockDataWithRetry(true);
        } else if (timeframe === 'weekly') {
          setTimeframe('monthly');
          fetchStockDataWithRetry(true);
        } else {
          setErrorMessage(`No data available for ${selectedStock} in any timeframe.`);
          setStockData(null);
        }
      } else {
        setErrorMessage(`No data available for ${selectedStock} in the selected timeframe.`);
        setStockData(null);
      }
      setIsRetrying(false);
      return;
    }
    
    // If we got here, we have valid data
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
    
    setIsRetrying(false);
  };

  useEffect(() => {
    if (selectedStock && !isRetrying) {
      fetchStockDataWithRetry();
    }
  }, [selectedStock, timeframe]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatCurrency = (value: number, symbol: string) => {
    if (isIndianStock(symbol)) {
      // Format in Indian style (e.g. ₹1,00,000.00)
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } else {
      // Format in US style (e.g. $100,000.00)
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Market Data</CardTitle>
        <div className="text-sm text-muted-foreground">
          {timeframe === 'daily' ? 'Daily' : timeframe === 'weekly' ? 'Weekly' : 'Monthly'} Data
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Select Stock</label>
            <Select value={selectedStock} onValueChange={setSelectedStock}>
              <SelectTrigger>
                <SelectValue placeholder="Select a stock" />
              </SelectTrigger>
              <SelectContent>
                {watchlistStocks.length > 0 ? (
                  watchlistStocks.map((stock) => (
                    <SelectItem key={stock.stock_symbol} value={stock.stock_symbol}>
                      {stock.stock_symbol}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-stocks" disabled>
                    No stocks in watchlist
                  </SelectItem>
                )}
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
          <div className="flex items-end">
            <Button 
              onClick={() => fetchStockDataWithRetry()} 
              disabled={loading || !selectedStock} 
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh Data
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="mt-6 space-x-2">
              <Button variant="outline" onClick={() => fetchStockDataWithRetry()}>
                Try Again
              </Button>
              {timeframe !== 'monthly' && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTimeframe(timeframe === 'daily' ? 'weekly' : 'monthly');
                  }}
                >
                  Try {timeframe === 'daily' ? 'Weekly' : 'Monthly'} Data
                </Button>
              )}
            </div>
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
                    <YAxis 
                      tickFormatter={(value) => 
                        isIndianStock(stockData.symbol) 
                          ? `₹${new Intl.NumberFormat('en-IN').format(value)}` 
                          : `$${value.toFixed(2)}`
                      }
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value, stockData.symbol), '']}
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
                  {formatCurrency(stockData.chartData[stockData.chartData.length - 1]?.open, stockData.symbol)}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Closing Price</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(stockData.chartData[stockData.chartData.length - 1]?.close, stockData.symbol)}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-muted-foreground">High</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(stockData.chartData[stockData.chartData.length - 1]?.high, stockData.symbol)}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Low</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(stockData.chartData[stockData.chartData.length - 1]?.low, stockData.symbol)}
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
