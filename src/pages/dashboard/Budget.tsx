import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CircleCheck, CircleX, AlertTriangle, CirclePercent, TrendingUp, Lightbulb, ArrowRight, DollarSign, PieChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { cn } from '@/lib/utils';

// Format currency in Indian Rupees
const formatRupees = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper to format recommendations text
const formatRecommendations = (text: string) => {
  if (!text) return [];

  // Remove markdown characters and split by newlines
  const cleaned = text
    .replace(/[*#]/g, '') // Remove * and # characters
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
    .trim();

  // Split into sections
  const sections = [];
  let currentSection = { title: 'Budget Recommendations', content: [] };

  cleaned.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) return; // Skip empty lines
    
    // Check if this is a section title
    if (trimmedLine.endsWith(':') && trimmedLine.length < 45) {
      if (currentSection.content.length > 0) {
        sections.push({ ...currentSection });
      }
      currentSection = { title: trimmedLine.replace(':', ''), content: [] };
    } else if (trimmedLine.startsWith('1.') || trimmedLine.startsWith('2.') || 
               trimmedLine.startsWith('3.') || trimmedLine.startsWith('4.')) {
      // Handle numbered lists by adding them as a new bullet point
      currentSection.content.push(trimmedLine.replace(/^\d+\.\s*/, '').trim());
    } else {
      // Regular content
      currentSection.content.push(trimmedLine);
    }
  });

  // Add the last section
  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  return sections;
};

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

  // Calculate budget data
  const budgetProgress = calculateBudgetProgress();
  const categoryTotals = getCategoryTotals();
  const monthlyData = getMonthlyData();

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
    setAIRecommendations(null);
    
    try {
      const recommendations = await getAIRecommendations();
      setAIRecommendations(recommendations);
      toast({
        title: "AI Recommendations",
        description: "Successfully generated budget recommendations",
      });
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to get AI recommendations. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  if (isBudgetsLoading) {
    return <div>Loading...</div>;
  }

  // Format the recommendations for better display
  const formattedRecommendations = aiRecommendations ? formatRecommendations(aiRecommendations) : [];

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
                <DialogDescription>
                  Create a new budget to track your spending in specific categories.
                </DialogDescription>
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

      {isLoadingRecommendations && (
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-3">Generating AI recommendations...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {formattedRecommendations.length > 0 && (
        <Card className="border-l-4 border-l-purple-500 shadow-md transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CirclePercent className="mr-2 h-5 w-5 text-purple-500" />
              AI Budget Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {formattedRecommendations.map((section, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center">
                    {index === 0 ? (
                      <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
                    ) : index === 1 ? (
                      <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                    ) : index === 2 ? (
                      <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                    ) : (
                      <PieChart className="h-4 w-4 mr-2 text-blue-500" />
                    )}
                    <h3 className="font-medium text-base">{section.title}</h3>
                  </div>
                  <div className="pl-6 space-y-2">
                    {section.content.map((line, i) => (
                      <div key={i} className="flex items-start">
                        <div className="shrink-0 mt-1.5 mr-2 bg-slate-100 rounded-full w-1.5 h-1.5"></div>
                        <p className="text-sm leading-relaxed text-slate-700">{line}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Powered by Gemini AI
                </Badge>
              </div>
            </div>
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
                <div className="text-2xl font-bold">{formatRupees(budget.amount)}</div>
                <div className={cn(
                  "text-sm",
                  budget.isExceeded ? "text-red-500" : budget.isApproaching ? "text-orange-500" : "text-gray-500"
                )}>
                  Spent: {formatRupees(budget.spent)}
                </div>
                <div className="text-sm text-gray-500">
                  Remaining: {formatRupees(budget.remaining)}
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
