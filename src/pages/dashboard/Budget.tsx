
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CircleCheck, CircleX, AlertTriangle, CirclePercent } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBudgets, BUDGET_CATEGORIES } from '@/hooks/useBudgets';
import { useToast } from '@/hooks/use-toast';
import { CircularProgress } from '@/components/dashboard/CircularProgress';
import { BudgetChart } from '@/components/dashboard/BudgetChart';

const Budget = () => {
  const { 
    budgets, 
    isBudgetsLoading, 
    addBudget,
    calculateBudgetProgress,
    getCategoryTotals,
    getMonthlyData,
    getAIRecommendations,
    BUDGET_CATEGORIES
  } = useBudgets();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<string | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    customCategory: '',
    amount: '',
    start_date: '',
    end_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalCategory = newBudget.category === 'Other' ? newBudget.customCategory : newBudget.category;
      
      await addBudget.mutateAsync({
        category: finalCategory,
        amount: parseFloat(newBudget.amount),
        start_date: newBudget.start_date,
        end_date: newBudget.end_date,
      });
      setIsOpen(false);
      setNewBudget({
        category: '',
        customCategory: '',
        amount: '',
        start_date: '',
        end_date: '',
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGetRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const recommendations = await getAIRecommendations();
      setAIRecommendations(recommendations);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const budgetProgress = calculateBudgetProgress();
  const categoryTotals = getCategoryTotals();
  const monthlyData = getMonthlyData();

  if (isBudgetsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={handleGetRecommendations} 
            variant="outline"
            disabled={isLoadingRecommendations}
          >
            {isLoadingRecommendations ? 'Loading...' : 'AI Recommendations'}
          </Button>
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
                  <Select 
                    value={newBudget.category} 
                    onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newBudget.category === 'Other' && (
                  <div>
                    <Label htmlFor="customCategory">Custom Category</Label>
                    <Input
                      id="customCategory"
                      value={newBudget.customCategory}
                      onChange={(e) => setNewBudget({ ...newBudget, customCategory: e.target.value })}
                      required={newBudget.category === 'Other'}
                    />
                  </div>
                )}

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
        <Card className="border-l-4 border-l-purple-500 shadow-md transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CirclePercent className="mr-2 h-5 w-5 text-purple-500" />
              AI Budget Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{aiRecommendations}</p>
          </CardContent>
        </Card>
      )}
      
      {budgetProgress.length > 0 && (
        <BudgetChart 
          categoryData={categoryTotals}
          monthlyData={monthlyData}
        />
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgetProgress.map((budget) => (
          <Card key={budget.id} className={cn(
            "transition-all duration-300 hover:shadow-md",
            budget.isExceeded ? "border-red-500 bg-red-50 animate-pulse" : 
            budget.isApproaching ? "border-orange-500 bg-orange-50" : ""
          )}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{budget.category}</CardTitle>
                {budget.isExceeded ? (
                  <CircleX className="h-5 w-5 text-red-500" />
                ) : budget.isApproaching ? (
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                ) : (
                  <CircleCheck className="h-5 w-5 text-green-500" />
                )}
              </div>
              <CardDescription>
                {new Date(budget.start_date).toLocaleDateString()} to {new Date(budget.end_date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${budget.amount.toLocaleString()}</div>
                <div className={cn(
                  "text-sm",
                  budget.isExceeded ? "text-red-500" : budget.isApproaching ? "text-orange-500" : "text-gray-500"
                )}>
                  Spent: ${budget.spent.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  Remaining: ${budget.remaining.toLocaleString()}
                </div>
              </div>
              <CircularProgress 
                percentage={budget.progressPercentage} 
                isExceeded={budget.isExceeded}
                isApproaching={budget.isApproaching}
              >
                <div className="text-center">
                  <div className={cn(
                    "text-xl font-bold",
                    budget.isExceeded ? "text-red-500" : 
                    budget.isApproaching ? "text-orange-500" : 
                    "text-purple-500"
                  )}>
                    {Math.round(budget.progressPercentage)}%
                  </div>
                  <div className="text-xs text-gray-500">Used</div>
                </div>
              </CircularProgress>
            </CardContent>
          </Card>
        ))}
      </div>

      {budgetProgress.length === 0 && (
        <Card className="col-span-full p-8 text-center">
          <CardContent>
            <p className="text-lg text-muted-foreground">No budgets created yet. Create your first budget to get started!</p>
            <Button className="mt-4" onClick={() => setIsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Budget;
