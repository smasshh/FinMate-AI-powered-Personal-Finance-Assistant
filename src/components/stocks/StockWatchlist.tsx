
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useStockData } from '@/hooks/useStockData';

export const StockWatchlist = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { addToWatchlist } = useStockData();

  const watchlistData = [
    { 
      symbol: 'BHACU',
      company: 'BaringtonHilco Acquisition Corp Unit 1 Com & 1 Rt & 1 Wt Exp 2018',
      added: '4/17/2025'
    },
    {
      symbol: 'HINDUNILVR.BSE',
      company: 'HINDUSTAN UNILEVER LTD.',
      added: '3/21/2025'
    }
  ];

  const handleRemove = async (symbol: string) => {
    // Implement remove from watchlist functionality
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Watchlist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Input
            placeholder="Search for stocks by symbol or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Your Watchlist</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlistData.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell>{stock.company}</TableCell>
                  <TableCell>{stock.added}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      onClick={() => handleRemove(stock.symbol)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
