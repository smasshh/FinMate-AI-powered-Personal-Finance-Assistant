
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Predefined budget categories
export const BUDGET_CATEGORIES = [
  'Housing', 
  'Transportation', 
  'Food', 
  'Utilities', 
  'Insurance', 
  'Healthcare', 
  'Savings', 
  'Entertainment', 
  'Shopping', 
  'Education',
  'Travel',
  'Debt Payments',
  'Other'
];

export const useBudgets = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const getBudgets = async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  };

  const getExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  };

  const { data: budgets, isLoading: isBudgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets,
  });

  const { data: expenses, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: getExpenses,
  });

  const addBudget = useMutation({
    mutationFn: async (budget: { 
      category: string; 
      amount: number; 
      start_date: string; 
      end_date: string 
    }) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...budget, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Budget Created",
        description: "Your new budget has been set successfully.",
      });
    },
  });

  const calculateBudgetProgress = () => {
    if (!budgets || !expenses) return [];

    return budgets.map(budget => {
      const categoryExpenses = expenses
        .filter(expense => 
          expense.category === budget.category && 
          new Date(expense.date) >= new Date(budget.start_date) &&
          new Date(expense.date) <= new Date(budget.end_date)
        );

      const totalSpent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const progressPercentage = (totalSpent / budget.amount) * 100;

      if (progressPercentage > 85 && progressPercentage < 100) {
        toast({
          title: "Budget Warning",
          description: `You're approaching your ${budget.category} budget limit (${progressPercentage.toFixed(1)}%)`,
          variant: "destructive",
        });
      } else if (progressPercentage >= 100) {
        toast({
          title: "Budget Exceeded",
          description: `You've exceeded your ${budget.category} budget by ${(totalSpent - budget.amount).toLocaleString()} (${progressPercentage.toFixed(1)}%)!`,
          variant: "destructive",
        });
      }

      return {
        ...budget,
        spent: totalSpent,
        remaining: Math.max(budget.amount - totalSpent, 0),
        progressPercentage: Math.min(progressPercentage, 100),
        isExceeded: progressPercentage > 100,
        isApproaching: progressPercentage > 85 && progressPercentage <= 100
      };
    });
  };

  const getCategoryTotals = () => {
    if (!budgets || !expenses) return [];

    const categorySummary = BUDGET_CATEGORIES.map(category => {
      const categoryBudgets = budgets.filter(b => b.category === category);
      const totalBudget = categoryBudgets.reduce((sum, b) => sum + b.amount, 0);
      
      const categoryExpenses = expenses.filter(e => e.category === category);
      const totalSpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      return {
        name: category,
        budget: totalBudget,
        spent: totalSpent,
        percentage: totalBudget ? (totalSpent / totalBudget) * 100 : 0
      };
    }).filter(item => item.budget > 0 || item.spent > 0);

    return categorySummary;
  };

  const getMonthlyData = () => {
    if (!expenses) return [];

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`,
        monthNum: date.getMonth(),
        year: date.getFullYear()
      };
    }).reverse();

    return last6Months.map(monthData => {
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === monthData.monthNum && 
               expenseDate.getFullYear() === monthData.year;
      });

      const totalSpent = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Get all budgets active in this month
      const monthBudgets = budgets?.filter(budget => {
        const startDate = new Date(budget.start_date);
        const endDate = new Date(budget.end_date);
        const monthStart = new Date(monthData.year, monthData.monthNum, 1);
        const monthEnd = new Date(monthData.year, monthData.monthNum + 1, 0);
        
        return (startDate <= monthEnd && endDate >= monthStart);
      }) || [];

      const totalBudget = monthBudgets.reduce((sum, budget) => sum + budget.amount, 0);

      return {
        name: monthData.month,
        spent: totalSpent,
        budget: totalBudget
      };
    });
  };

  const getAIRecommendations = async () => {
    if (!user) {
      console.error("User not authenticated");
      return null;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-finances', {
        body: { userId: user.id }
      });
      
      if (error) {
        console.error("Error fetching AI recommendations:", error);
        throw error;
      }
      
      return data.insights;
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      throw error;
    }
  };

  return { 
    budgets, 
    expenses,
    isBudgetsLoading, 
    isExpensesLoading,
    addBudget,
    calculateBudgetProgress,
    getCategoryTotals,
    getMonthlyData,
    getAIRecommendations,
    BUDGET_CATEGORIES
  };
};
