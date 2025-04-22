
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useExpenses = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async (expense: { id: string; category: string; amount: number; date: string; description?: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      const { id, ...updateData } = expense;
      
      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  return { 
    expenses, 
    isLoading, 
    addExpense,
    updateExpense,
    deleteExpense
  };
};
