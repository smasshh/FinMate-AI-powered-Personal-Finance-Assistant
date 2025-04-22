
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useStockData } from '@/hooks/useStockData';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const StockPredictions = () => {
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [watchlistStocks, setWatchlistStocks] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const { generatePrediction } = useStockData();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchWatchlistStocks();
      fetchPredictions();
    }
  }, [user]);

  const fetchWatchlistStocks = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const { data, error } = await supabase
        .from('stock_watchlist')
        .select('stock_symbol')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching watchlist stocks:', error);
        setErrorMessage('Failed to load your watchlist. Please try again.');
        throw error;
      }
      
      if (!data || data.length === 0) {
        setWatchlistStocks([]);
        // If no watchlist stocks, don't show an error but display helpful message in UI
        return;
      }
      
      setWatchlistStocks(data);
      
      // Select first stock by default if available
      if (data && data.length > 0 && !selectedStock) {
        setSelectedStock(data[0].stock_symbol);
      }
    } catch (error) {
      console.error('Error fetching watchlist stocks:', error);
      toast({
        title: 'Error loading watchlist',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const { data, error } = await supabase
        .from('stock_predictions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching predictions:', error);
        setErrorMessage('Failed to load predictions. Please try again.');
        throw error;
      }
      
      setPredictions(data || []);
    } catch (error: any) {
      console.error('Error fetching predictions:', error);
      toast({
        title: 'Error loading predictions',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isIndianStock = (symbol: string) => {
    return symbol.endsWith('.BSE') || 
           symbol.endsWith('.NSE') || 
           symbol.includes('.NS') || 
           symbol.includes('NIFTY') || 
           symbol.includes('SENSEX');
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

  const handleGeneratePrediction = async () => {
    if (!selectedStock || !user) return;
    
    try {
      setGenerating(true);
      setErrorMessage(null);
      
      const result = await generatePrediction(selectedStock);
      
      if (result.error) {
        setErrorMessage(`Failed to generate prediction: ${result.error}`);
        toast({
          title: 'Prediction Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result.data && result.data.prediction) {
        toast({
          title: 'Prediction Generated',
          description: `Successfully created prediction for ${selectedStock}`,
          variant: 'default',
        });
        
        // Refresh predictions after generation
        await fetchPredictions();
      } else {
        setErrorMessage('Failed to generate prediction: Unexpected response format');
        toast({
          title: 'Prediction Failed',
          description: 'Unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error generating prediction:', error);
      setErrorMessage(`Failed to generate prediction: ${error.message}`);
      toast({
        title: 'Prediction Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const getRecommendation = (predictionData: any) => {
    if (!predictionData || typeof predictionData.current_price !== 'number' || typeof predictionData.predicted_price !== 'number') {
      return { action: 'UNKNOWN', color: 'text-gray-500' };
    }
    
    const currentPrice = predictionData.current_price;
    const predictedPrice = predictionData.predicted_price;
    const percentChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
    
    if (percentChange > 5) return { action: 'BUY', color: 'text-green-500' };
    if (percentChange < -5) return { action: 'SELL', color: 'text-red-500' };
    return { action: 'HOLD', color: 'text-amber-500' };
  };

  const getRiskLevel = (confidenceScore: number) => {
    if (typeof confidenceScore !== 'number') {
      return { level: 'UNKNOWN', color: 'text-gray-500', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    
    if (confidenceScore > 0.75) return { level: 'LOW', color: 'text-green-500', icon: <TrendingUp className="h-4 w-4" /> };
    if (confidenceScore > 0.5) return { level: 'MEDIUM', color: 'text-amber-500', icon: <TrendingDown className="h-4 w-4" /> };
    return { level: 'HIGH', color: 'text-red-500', icon: <AlertTriangle className="h-4 w-4" /> };
  };

  const refreshData = async () => {
    if (user) {
      await Promise.all([
        fetchWatchlistStocks(),
        fetchPredictions()
      ]);
      
      toast({
        title: 'Data Refreshed',
        description: 'Predictions and watchlist data has been updated',
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>AI-Generated Predictions</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshData}
          disabled={loading}
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
            {watchlistStocks.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground mt-1">
                Add stocks to your watchlist to generate predictions
              </p>
            )}
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleGeneratePrediction} 
              disabled={generating || !selectedStock || watchlistStocks.length === 0}
              className="w-full md:w-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Prediction'
              )}
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p>{errorMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : predictions.length > 0 ? (
          <div className="space-y-6">
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Predictions</TabsTrigger>
                <TabsTrigger value="recent">Recent Predictions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 gap-4">
                  {predictions.map((prediction) => {
                    const recommendation = getRecommendation(prediction);
                    const riskLevel = getRiskLevel(prediction.confidence_score);
                    
                    return (
                      <div 
                        key={prediction.id} 
                        className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold">{prediction.stock_symbol}</h3>
                            <p className="text-sm text-muted-foreground">
                              Predicted on {new Date(prediction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full font-medium ${recommendation.color}`}>
                            {recommendation.action}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Current Price</p>
                            <p className="text-lg font-medium">
                              {formatCurrency(prediction.current_price || 0, prediction.stock_symbol)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Predicted Price</p>
                            <p className="text-lg font-medium">
                              {formatCurrency(prediction.predicted_price || 0, prediction.stock_symbol)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Prediction Date</p>
                            <p className="text-lg font-medium">
                              {new Date(prediction.prediction_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Risk Level</p>
                            <p className={`text-lg font-medium flex items-center ${riskLevel.color}`}>
                              {riskLevel.icon}
                              <span className="ml-1">{riskLevel.level}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            Confidence Score: {(prediction.confidence_score * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="recent" className="mt-6">
                <div className="grid grid-cols-1 gap-4">
                  {predictions.slice(0, 5).map((prediction) => {
                    const recommendation = getRecommendation(prediction);
                    const riskLevel = getRiskLevel(prediction.confidence_score);
                    
                    return (
                      <div 
                        key={prediction.id} 
                        className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold">{prediction.stock_symbol}</h3>
                            <p className="text-sm text-muted-foreground">
                              Predicted on {new Date(prediction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full font-medium ${recommendation.color}`}>
                            {recommendation.action}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Current Price</p>
                            <p className="text-lg font-medium">
                              {formatCurrency(prediction.current_price || 0, prediction.stock_symbol)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Predicted Price</p>
                            <p className="text-lg font-medium">
                              {formatCurrency(prediction.predicted_price || 0, prediction.stock_symbol)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Prediction Date</p>
                            <p className="text-lg font-medium">
                              {new Date(prediction.prediction_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Risk Level</p>
                            <p className={`text-lg font-medium flex items-center ${riskLevel.color}`}>
                              {riskLevel.icon}
                              <span className="ml-1">{riskLevel.level}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            Confidence Score: {(prediction.confidence_score * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No predictions available.</p>
            <p className="text-sm mt-2">
              {selectedStock ? 
                'Click "Generate Prediction" to create your first prediction.' : 
                watchlistStocks.length > 0 ?
                  'Select a stock from your watchlist to generate a prediction.' :
                  'Add stocks to your watchlist to generate predictions.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
