
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useStockData } from '@/hooks/useStockData';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const StockPredictions = () => {
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [watchlistStocks, setWatchlistStocks] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWatchlistStocks();
      fetchPredictions();
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

  const fetchPredictions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('stock_predictions')
        .select('*')
        .eq('user_id', user.id)
        .order('prediction_date', { ascending: false });
      
      if (error) throw error;
      
      setPredictions(data || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = async () => {
    if (!selectedStock || !user) return;
    
    try {
      setGenerating(true);
      
      // First, fetch historical data
      const response = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ 
          action: 'GENERATE_PREDICTION', 
          symbol: selectedStock,
          userId: user.id
        })
      });

      if (response.error) throw new Error(response.error.message);
      
      // Refresh predictions after generation
      fetchPredictions();
    } catch (error: any) {
      console.error('Error generating prediction:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getRecommendation = (predictionData: any) => {
    const currentPrice = predictionData.current_price;
    const predictedPrice = predictionData.predicted_price;
    const percentChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
    
    if (percentChange > 5) return { action: 'BUY', color: 'text-green-500' };
    if (percentChange < -5) return { action: 'SELL', color: 'text-red-500' };
    return { action: 'HOLD', color: 'text-amber-500' };
  };

  const getRiskLevel = (confidenceScore: number) => {
    if (confidenceScore > 0.75) return { level: 'LOW', color: 'text-green-500', icon: <TrendingUp className="h-4 w-4" /> };
    if (confidenceScore > 0.5) return { level: 'MEDIUM', color: 'text-amber-500', icon: <TrendingDown className="h-4 w-4" /> };
    return { level: 'HIGH', color: 'text-red-500', icon: <AlertTriangle className="h-4 w-4" /> };
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AI-Generated Predictions</CardTitle>
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
                {watchlistStocks.map((stock) => (
                  <SelectItem key={stock.stock_symbol} value={stock.stock_symbol}>
                    {stock.stock_symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={generatePrediction} 
              disabled={generating || !selectedStock}
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
                            <p className="text-lg font-medium">${prediction.current_price?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Predicted Price</p>
                            <p className="text-lg font-medium">${prediction.predicted_price?.toFixed(2)}</p>
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
                            <p className="text-lg font-medium">${prediction.current_price?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Predicted Price</p>
                            <p className="text-lg font-medium">${prediction.predicted_price?.toFixed(2)}</p>
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
                'Add stocks to your watchlist to generate predictions.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
