
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Expense Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder for expenses list or chart */}
          <p>Expense tracking coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
