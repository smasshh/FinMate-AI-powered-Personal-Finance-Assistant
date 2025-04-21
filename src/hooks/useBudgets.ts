
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBudgets = () => {
  const queryClient = useQueryClient();

  const getBudgets = async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  };

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets,
  });

  const addBudget = useMutation({
    mutationFn: async (budget: { category: string; amount: number; start_date: string; end_date: string }) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert([budget])
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  return { budgets, isLoading, addBudget };
};
