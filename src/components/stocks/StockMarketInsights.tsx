
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Loader2, RefreshCcw } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const StockMarketInsights = () => {
  const { fetchMarketIndices, loading } = useStockData();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indices, setIndices] = useState([
    { name: 'NIFTY 50', value: '--', change: '--', changePercent: '--', isPositive: true, symbol: 'NSEI' },
    { name: 'SENSEX', value: '--', change: '--', changePercent: '--', isPositive: true, symbol: 'BSESN' },
    { name: 'NIFTY MIDCAP', value: '--', change: '--', changePercent: '--', isPositive: true, symbol: 'NIFMDCP50.NS' },
    { name: 'NIFTY IT', value: '--', change: '--', changePercent: '--', isPositive: true, symbol: 'NIFTY_IT.NS' },
  ]);

  const getMarketData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Request mock data if API limit reached
      const data = await fetchMarketIndices(true);
      
      if (data?.error) {
        setError(data.error);
        toast({
          title: 'Failed to fetch market data',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }
      
      if (data && data.indices && data.indices.length > 0) {
        // Map the fetched indices to our display format
        const updatedIndices = [...indices];
        
        data.indices.forEach(idx => {
          const indexToUpdate = updatedIndices.findIndex(i => i.symbol === idx.symbol);
          if (indexToUpdate !== -1) {
            const price = parseFloat(idx.price);
            const changeVal = parseFloat(idx.change);
            
            updatedIndices[indexToUpdate] = {
              ...updatedIndices[indexToUpdate],
              value: price.toFixed(2),
              change: changeVal.toFixed(2),
              changePercent: idx.changePercent,
              isPositive: idx.isPositive
            };
          }
        });
        
        setIndices(updatedIndices);
        toast({
          title: 'Market data updated',
          description: 'The latest market data has been fetched',
          variant: 'default',
        });
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to fetch market data');
      toast({
        title: 'Failed to fetch market data',
        description: 'Please try again later',
        variant: 'destructive',
      });
      console.error('Error fetching market data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    getMarketData();
    
    // Set up interval to refresh indices every 5 minutes
    const intervalId = setInterval(getMarketData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const formatValue = (value: string) => {
    if (value === '--') return value;
    
    const numValue = parseFloat(value);
    // Format with commas for Indian number system (e.g., 1,00,000)
    return new Intl.NumberFormat('en-IN').format(numValue);
  };

  const handleRefresh = () => {
    getMarketData();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Market Indices</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing || loading}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <RefreshCcw className="w-4 h-4 mr-1" />
          )}
          Refresh Market Data
        </Button>
      </div>
      
      {error && (
        <div className="px-4 py-3 bg-red-100 text-red-800 rounded-md mb-4">
          {error}
        </div>
      )}
    
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((index) => (
          <Card key={index.name}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{index.name}</h3>
                {loading || refreshing ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">₹{formatValue(index.value)}</div>
                    <div className={`flex items-center text-sm ${
                      index.isPositive ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {index.isPositive ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      <span>₹{formatValue(index.change)}</span>
                      <span className="ml-1">({index.changePercent})</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
