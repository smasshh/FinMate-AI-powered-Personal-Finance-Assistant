
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';

export const StockMarketInsights = () => {
  const { fetchMarketIndices, loading } = useStockData();
  const [indices, setIndices] = useState([
    { name: 'NIFTY 50', value: '--', change: '--', changePercent: '--', isPositive: true, symbol: 'NSEI' },
    { name: 'SENSEX', value: '--', change: '--', changePercent: '--', isPositive: true, symbol: 'BSESN' },
    { name: 'NIFTY MIDCAP', value: '--', change: '--', changePercent: '--', isPositive: true, symbol: 'NIFMDCP50.NS' },
    { name: 'NIFTY IT', value: '--', change: '--', changePercent: '--', isPositive: true, symbol: 'NIFTY_IT.NS' },
  ]);

  useEffect(() => {
    const getMarketData = async () => {
      const data = await fetchMarketIndices();
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
      }
    };
    
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {indices.map((index) => (
        <Card key={index.name}>
          <CardContent className="p-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{index.name}</h3>
              {loading ? (
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
  );
};
