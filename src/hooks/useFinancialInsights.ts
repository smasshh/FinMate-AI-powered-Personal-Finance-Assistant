
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useFinancialInsights = () => {
  const { user } = useAuth();

  const getInsights = async () => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('analyze-finances', {
      body: { userId: user.id },
    });

    if (error) throw error;
    return data.insights;
  };

  return useQuery({
    queryKey: ['financial-insights'],
    queryFn: getInsights,
    enabled: !!user,
  });
};
