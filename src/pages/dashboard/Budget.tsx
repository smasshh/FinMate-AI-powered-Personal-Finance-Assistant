import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBudgets } from '@/hooks/useBudgets';
import { useToast } from '@/hooks/use-toast';

const Budget = () => {
  const { 
    budgets, 
    isBudgetsLoading, 
    addBudget,
    calculateBudgetProgress,
    getAIRecommendations
  } = useBudgets();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<string | null>(null);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    start_date: '',
    end_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBudget.mutateAsync({
        ...newBudget,
        amount: parseFloat(newBudget.amount),
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGetRecommendations = async () => {
    const recommendations = await getAIRecommendations();
    setAIRecommendations(recommendations);
  };

  const budgetProgress = calculateBudgetProgress();

  if (isBudgetsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
        <div className="flex space-x-2">
          <Button onClick={handleGetRecommendations}>AI Recommendations</Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newBudget.category}
                    onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newBudget.amount}
                    onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newBudget.start_date}
                    onChange={(e) => setNewBudget({ ...newBudget, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newBudget.end_date}
                    onChange={(e) => setNewBudget({ ...newBudget, end_date: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit">Create Budget</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {aiRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle>AI Budget Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{aiRecommendations}</p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgetProgress.map((budget) => (
          <Card key={budget.id}>
            <CardHeader>
              <CardTitle>{budget.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${budget.amount.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mb-2">
                Spent: ${budget.spent.toLocaleString()}
              </div>
              <Progress 
                value={budget.progressPercentage} 
                className={budget.progressPercentage > 100 ? 'bg-destructive' : ''} 
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Budget;
