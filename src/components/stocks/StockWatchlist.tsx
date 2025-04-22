
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Search, Loader2 } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const StockWatchlist = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToWatchlist, fetchStockData } = useStockData();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchWatchlist();
  }, [user]);

  const fetchWatchlist = async () => {
    if (!user) {
      setWatchlistData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_watchlist')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setWatchlistData(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching watchlist',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const response = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action: 'SEARCH', keywords: searchQuery })
      });

      if (response.error) throw new Error(response.error.message);
      
      setSearchResults(response.data?.bestMatches || []);
    } catch (error: any) {
      toast({
        title: 'Search failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAddToWatchlist = async (symbol: string, name: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to add stocks to your watchlist',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await addToWatchlist(symbol);
      if (error) throw error;

      toast({
        title: 'Stock added',
        description: `${symbol} added to your watchlist`,
      });
      
      // Refresh watchlist
      fetchWatchlist();
      
      // Clear search results
      setSearchResults([]);
      setSearchQuery('');
    } catch (error: any) {
      toast({
        title: 'Failed to add stock',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (symbol: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('stock_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('stock_symbol', symbol);
      
      if (error) throw error;
      
      toast({
        title: 'Stock removed',
        description: `${symbol} removed from your watchlist`,
      });
      
      // Refresh watchlist
      fetchWatchlist();
    } catch (error: any) {
      toast({
        title: 'Failed to remove stock',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Watchlist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search for stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Search Results</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((stock) => (
                  <TableRow key={stock['1. symbol']}>
                    <TableCell className="font-medium">{stock['1. symbol']}</TableCell>
                    <TableCell>{stock['2. name']}</TableCell>
                    <TableCell>{stock['4. region']}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm"
                        onClick={() => handleAddToWatchlist(stock['1. symbol'], stock['2. name'])}
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4">Your Watchlist</h3>
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : watchlistData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchlistData.map((stock) => (
                  <TableRow key={stock.stock_symbol}>
                    <TableCell className="font-medium">{stock.stock_symbol}</TableCell>
                    <TableCell>{new Date(stock.added_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(stock.stock_symbol)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No stocks in your watchlist. Use the search box above to find and add stocks.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
