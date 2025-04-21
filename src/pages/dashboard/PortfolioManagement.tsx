
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const PortfolioManagement = () => {
  const [portfolio, setPortfolio] = useState([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Investment
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder for portfolio list or chart */}
          <p>Portfolio tracking coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioManagement;
