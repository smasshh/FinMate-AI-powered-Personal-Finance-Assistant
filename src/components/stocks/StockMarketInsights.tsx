
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StockMarketInsights = () => {
  const indices = [
    { name: 'NIFTY 50', value: '24,211.00', change: '+₹0.00', changePercent: '+0.00%', isPositive: true },
    { name: 'SENSEX', value: '79,703.66', change: '+₹0.00', changePercent: '+0.00%', isPositive: true },
    { name: 'NIFTY BANK', value: '55,767.70', change: '+₹0.00', changePercent: '+0.00%', isPositive: true },
    { name: 'NIFTY IT', value: '34,085.10', change: '+₹0.00', changePercent: '+0.00%', isPositive: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {indices.map((index) => (
        <Card key={index.name}>
          <CardContent className="p-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{index.name}</h3>
              <div className="text-2xl font-bold">₹{index.value}</div>
              <div className={`flex items-center text-sm ${
                index.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {index.isPositive ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span>{index.change}</span>
                <span className="ml-1">({index.changePercent})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
