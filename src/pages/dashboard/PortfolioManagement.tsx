
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp } from 'lucide-react';
import { useTradingAssistant } from '@/hooks/useTradingAssistant';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const PortfolioManagement = () => {
  const { 
    fetchPortfolioPositions, 
    executeTrade, 
    portfolioPositions, 
    loading 
  } = useTradingAssistant();
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');

  useEffect(() => {
    fetchPortfolioPositions();
  }, []);

  const handleTrade = async () => {
    if (!selectedStock || !quantity) {
      toast({
        title: 'Validation Error',
        description: 'Please select a stock and enter quantity',
        variant: 'destructive'
      });
      return;
    }

    const result = await executeTrade(
      selectedStock.toUpperCase(), 
      Number(quantity), 
      tradeType
    );

    if (result) {
      // Refresh portfolio after successful trade
      fetchPortfolioPositions();
      // Reset form
      setSelectedStock('');
      setQuantity('');
    }
  };

  const totalPortfolioValue = portfolioPositions.reduce(
    (total, position) => total + Number(position.market_value || 0), 
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Trade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Execute Trade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div>
                <Select 
                  value={tradeType} 
                  onValueChange={(val: 'buy' | 'sell') => setTradeType(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Trade Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input 
                placeholder="Stock Symbol" 
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
              />
              <Input 
                type="number" 
                placeholder="Quantity" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Button 
                onClick={handleTrade} 
                disabled={loading}
                className="w-full"
              >
                Execute Trade
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading portfolio...</p>
          ) : portfolioPositions.length === 0 ? (
            <p>No positions found.</p>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-xl font-semibold">
                  Total Portfolio Value: ${totalPortfolioValue.toFixed(2)}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Market Value</TableHead>
                    <TableHead>Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolioPositions.map((position) => (
                    <TableRow key={position.symbol}>
                      <TableCell>{position.symbol}</TableCell>
                      <TableCell>{position.qty}</TableCell>
                      <TableCell>${Number(position.market_value).toFixed(2)}</TableCell>
                      <TableCell 
                        className={
                          Number(position.unrealized_pl) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }
                      >
                        ${Number(position.unrealized_pl).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioManagement;
