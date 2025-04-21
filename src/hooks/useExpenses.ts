
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useExpenses = () => {
  const queryClient = useQueryClient();

  const getExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  };

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: getExpenses,
  });

  const addExpense = useMutation({
    mutationFn: async (expense: { category: string; amount: number; date: string; description?: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  return { expenses, isLoading, addExpense };
};
