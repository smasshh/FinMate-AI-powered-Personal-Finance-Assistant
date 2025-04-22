
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, RefreshCw, ChevronUp, ChevronDown, BarChart } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const PortfolioManagement = () => {
  const { 
    fetchPortfolioPositions, 
    fetchTradeHistory,
    executeTrade, 
    portfolioPositions, 
    tradeHistory,
    loading 
  } = useTradingAssistant();
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [activeTab, setActiveTab] = useState('holdings');

  useEffect(() => {
    fetchPortfolioPositions();
    fetchTradeHistory();
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
      // Reset form
      setSelectedStock('');
      setQuantity('');
    }
  };

  const totalPortfolioValue = portfolioPositions.reduce(
    (total, position) => total + Number(position.market_value || 0), 
    0
  );

  const totalCost = portfolioPositions.reduce(
    (total, position) => total + (Number(position.avg_entry_price) * Number(position.qty)), 
    0
  );

  const totalProfitLoss = totalPortfolioValue - totalCost;
  const percentChange = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  // Data for pie chart
  const pieChartData = portfolioPositions.map(position => ({
    name: position.symbol,
    value: Number(position.market_value)
  }));

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  // Data for bar chart
  const barChartData = portfolioPositions.map(position => ({
    name: position.symbol,
    profit: Number(position.unrealized_pl)
  }));

  // Custom formatter for toFixed to handle ValueType
  const formatToFixed = (value: any, decimalPlaces: number = 2): string => {
    if (typeof value === 'number') {
      return value.toFixed(decimalPlaces);
    }
    return String(value);
  };

  // Bar fill color function
  const getBarFillColor = (data: any) => {
    return data.profit >= 0 ? '#4ade80' : '#ef4444';
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
          }}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
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
            <div className="text-3xl font-bold">{portfolioPositions.length}</div>
            <div className="text-xs mt-1 text-muted-foreground">
              📋 {portfolioPositions.length} positions tracked
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="holdings">Your Holdings</TabsTrigger>
              <TabsTrigger value="allocation">Asset Allocation</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="holdings" className="mt-0">
              {loading ? (
                <p>Loading portfolio...</p>
              ) : portfolioPositions.length === 0 ? (
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
                          disabled={loading}
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
                        {portfolioPositions.map((position) => (
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
                                          });
                                      }} 
                                      disabled={loading}
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
                            disabled={loading}
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
            </TabsContent>
            
            <TabsContent value="allocation" className="mt-0">
              {portfolioPositions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">You need some holdings to view asset allocation.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
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
                              stroke={(data) => (data.profit >= 0 ? '#4ade80' : '#ef4444')}
                            />
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioManagement;
