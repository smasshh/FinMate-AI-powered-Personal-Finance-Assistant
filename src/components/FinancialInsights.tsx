
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';
import { useFinancialInsights } from '@/hooks/useFinancialInsights';

export const FinancialInsights = () => {
  const { data: insights, isLoading, error } = useFinancialInsights();

  if (isLoading) {
    return <div>Loading insights...</div>;
  }

  if (error) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2 text-finance-blue" />
          AI Financial Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap">{insights}</div>
      </CardContent>
    </Card>
  );
};
