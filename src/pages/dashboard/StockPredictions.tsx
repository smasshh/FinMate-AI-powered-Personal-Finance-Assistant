
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const StockPredictions = () => {
  const [predictions, setPredictions] = useState([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Stock Predictions</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Prediction
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>AI Stock Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder for stock predictions */}
          <p>Stock predictions coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockPredictions;
