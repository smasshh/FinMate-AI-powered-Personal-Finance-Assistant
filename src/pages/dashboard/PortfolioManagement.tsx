import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, RefreshCw, ChevronUp, ChevronDown, BarChart } from 'lucide-react';
import { useTradingAssistant } from '@/hooks/useTradingAssistant';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// Define portfolio position type for local database
type LocalPortfolioPosition = {
  id: string;
  user_id: string;
  stock_symbol: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
  current_price?: number;
  market_value?: number;
  unrealized_pl?: number;
}

const PortfolioManagement = () => {
  const { 
    fetchPortfolioPositions, 
    fetchTradeHistory,
    executeTrade, 
    portfolioPositions, 
    tradeHistory,
    loading,
    error,
    simulationMode
  } = useTradingAssistant();
  const { user } = useAuth();
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [activeTab, setActiveTab] = useState('holdings');
  const [localPortfolio, setLocalPortfolio] = useState<LocalPortfolioPosition[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  
  // Function to fetch portfolio data directly from Supabase
  const fetchLocalPortfolio = async () => {
    if (!user) return;
    
    setLocalLoading(true);
    try {
      // Fetch portfolio data from Supabase
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Enhance portfolio data with current prices and calculated fields
      const enhancedPortfolio = await Promise.all((data || []).map(async (position) => {
        try {
          // Get current price
          const priceResponse = await supabase.functions.invoke('stock-data', {
            body: JSON.stringify({ 
              action: 'CURRENT_PRICE', 
              symbol: position.stock_symbol
            })
          });
          
          const currentPrice = priceResponse.data?.price || position.purchase_price;
          const marketValue = currentPrice * position.quantity;
          const unrealizedPL = marketValue - (position.purchase_price * position.quantity);
          
          return {
            ...position,
            current_price: currentPrice,
            market_value: marketValue,
            unrealized_pl: unrealizedPL
          };
        } catch (err) {
          console.error(`Error getting price for ${position.stock_symbol}:`, err);
          
          // Return with estimated values
          return {
            ...position,
            current_price: position.purchase_price,
            market_value: position.purchase_price * position.quantity,
            unrealized_pl: 0
          };
        }
      }));
      
      setLocalPortfolio(enhancedPortfolio);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch portfolio data',
        variant: 'destructive'
      });
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Add refresh interval for portfolio data
  useEffect(() => {
    // Initial fetch - try both methods
    fetchPortfolioPositions();
    fetchTradeHistory();
    fetchLocalPortfolio();
    
    // Set up refresh interval (every 60 seconds)
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing portfolio data...");
      fetchPortfolioPositions();
      fetchLocalPortfolio();
    }, 60000);
    
    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [user]);

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
      // Reset form
      setSelectedStock('');
      setQuantity('');
      
      // Refresh portfolio data
      toast({
        title: 'Refreshing Data',
        description: 'Updating portfolio with recent trade...',
        variant: 'default'
      });
      
      // Set a small timeout to allow the database to update
      setTimeout(async () => {
        await fetchLocalPortfolio();
        await fetchTradeHistory();
      }, 1000);
    }
  };

  // Decide which portfolio data to use
  const displayPortfolio = simulationMode || localPortfolio.length > 0 
    ? localPortfolio.map(pos => ({
        symbol: pos.stock_symbol,
        qty: pos.quantity,
        avg_entry_price: pos.purchase_price,
        current_price: pos.current_price || pos.purchase_price,
        market_value: pos.market_value || (pos.quantity * pos.purchase_price),
        unrealized_pl: pos.unrealized_pl || 0
      }))
    : portfolioPositions;

  const totalPortfolioValue = displayPortfolio.reduce(
    (total, position) => total + Number(position.market_value || 0), 
    0
  );

  const totalCost = displayPortfolio.reduce(
    (total, position) => total + (Number(position.avg_entry_price) * Number(position.qty)), 
    0
  );

  const totalProfitLoss = totalPortfolioValue - totalCost;
  const percentChange = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  // Data for pie chart
  const pieChartData = displayPortfolio.map(position => ({
    name: position.symbol,
    value: Number(position.market_value)
  }));

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  // Data for bar chart
  const barChartData = displayPortfolio.map(position => ({
    name: position.symbol,
    profit: Number(position.unrealized_pl),
    color: Number(position.unrealized_pl) >= 0 ? '#4ade80' : '#ef4444'
  }));

  // Custom formatter for toFixed to handle ValueType
  const formatToFixed = (value: any, decimalPlaces: number = 2): string => {
    if (typeof value === 'number') {
      return value.toFixed(decimalPlaces);
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Management</h1>
          <p className="text-muted-foreground">
            Track, analyze and optimize your investment portfolio
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            fetchPortfolioPositions();
            fetchTradeHistory();
            fetchLocalPortfolio();
          }}
          disabled={loading || localLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
      
      {simulationMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 mb-4">
          <h3 className="font-medium mb-1">Simulation Mode Active</h3>
          <p className="text-sm">
            The Alpaca API connection has failed. All trades will be simulated locally with no real money.
            Your portfolio data is stored locally in your account.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalPortfolioValue.toFixed(2)}</div>
            <div className={`flex items-center text-xs mt-1 ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {percentChange >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>{Math.abs(percentChange).toFixed(2)}% all time</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)}
            </div>
            <div className="text-xs mt-1 text-muted-foreground">
              $ Total cost: ${totalCost.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{displayPortfolio.length}</div>
            <div className="text-xs mt-1 text-muted-foreground">
              📋 {displayPortfolio.length} positions tracked
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="holdings">Your Holdings</TabsTrigger>
                <TabsTrigger value="allocation">Asset Allocation</TabsTrigger>
                <TabsTrigger value="history">Transaction History</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "holdings" && (
            <div>
              {(loading || localLoading) ? (
                <p>Loading portfolio...</p>
              ) : displayPortfolio.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">You don't have any holdings yet.</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Investment
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
                          placeholder="Stock Symbol (e.g., AAPL, MSFT)" 
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
                          disabled={loading || localLoading}
                          className="w-full"
                        >
                          Execute Trade
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Avg. Price</TableHead>
                          <TableHead>Current Price</TableHead>
                          <TableHead>Market Value</TableHead>
                          <TableHead>Profit/Loss</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayPortfolio.map((position) => (
                          <TableRow key={position.symbol}>
                            <TableCell className="font-medium">{position.symbol}</TableCell>
                            <TableCell>{position.qty}</TableCell>
                            <TableCell>${Number(position.avg_entry_price).toFixed(2)}</TableCell>
                            <TableCell>${Number(position.current_price).toFixed(2)}</TableCell>
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
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">Trade</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Trade {position.symbol}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 p-4">
                                    <div>
                                      <Select 
                                        defaultValue="buy"
                                        onValueChange={(val: 'buy' | 'sell') => setTradeType(val)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select Trade Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="buy">Buy More</SelectItem>
                                          <SelectItem value="sell">Sell</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Input 
                                      type="number" 
                                      placeholder="Quantity" 
                                      value={quantity}
                                      onChange={(e) => setQuantity(e.target.value)}
                                    />
                                    <Button 
                                      onClick={() => {
                                        executeTrade(position.symbol, Number(quantity), tradeType)
                                          .then(() => {
                                            setQuantity('');
                                            fetchLocalPortfolio();
                                          });
                                      }} 
                                      disabled={loading || localLoading}
                                      className="w-full"
                                    >
                                      Execute Trade
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          New Trade
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
                            disabled={loading || localLoading}
                            className="w-full"
                          >
                            Execute Trade
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              )}
            </div>
          )}
          
          {activeTab === "allocation" && (
            <div>
              {displayPortfolio.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">You need some holdings to view asset allocation.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Portfolio Allocation</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`$${formatToFixed(value)}`, 'Value']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Profit/Loss by Asset</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <ReBarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${formatToFixed(value)}`, 'Profit/Loss']} />
                            <Bar
                              dataKey="profit"
                              name="Profit/Loss"
                              fill="#8884d8"
                              fillOpacity={0.8}
                            />
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "history" && (
            <div>
              {tradeHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No transaction history yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeHistory.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>{new Date(trade.executed_at).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell className={trade.trade_type === 'buy' ? 'text-green-600' : 'text-red-600'}>
                          {trade.trade_type.toUpperCase()}
                        </TableCell>
                        <TableCell>{trade.quantity}</TableCell>
                        <TableCell>${trade.price_at_execution.toFixed(2)}</TableCell>
                        <TableCell>${(trade.price_at_execution * trade.quantity).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            {trade.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioManagement;
