
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

      if (progressPercentage > 100) {
        toast({
          title: "Budget Exceeded",
          description: `You've exceeded your ${budget.category} budget!`,
          variant: "destructive",
        });
      }

      return {
        ...budget,
        spent: totalSpent,
        progressPercentage: Math.min(progressPercentage, 100)
      };
    });
  };

  const getAIRecommendations = async () => {
    try {
      const response = await fetch('/functions/analyze-finances', {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await response.json();
      return data.insights;
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      return null;
    }
  };

  return { 
    budgets, 
    expenses,
    isBudgetsLoading, 
    isExpensesLoading,
    addBudget,
    calculateBudgetProgress,
    getAIRecommendations
  };
};

