import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';

// Format currency in Indian Rupees
const formatRupees = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export function ExpenseInsights() {
  const { expenses } = useExpenses();
  const [insights, setInsights] = useState<{
    highestCategory: { category: string; amount: number } | null;
    monthlyTotal: number;
    previousMonthTotal: number;
    overspendingWarning: boolean;
  }>({
    highestCategory: null,
    monthlyTotal: 0,
    previousMonthTotal: 0,
    overspendingWarning: false
  });

  useEffect(() => {
    if (expenses && expenses.length > 0) {
      // Calculate highest spending category
      const categoryTotals: Record<string, number> = {};
      expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
          categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += Number(expense.amount);
      });

      const highestCategory = Object.entries(categoryTotals).reduce(
        (max, [category, amount]) => 
          amount > (max?.amount || 0) ? { category, amount } : max,
        null as { category: string; amount: number } | null
      );

      // Calculate monthly totals
      const now = new Date();
      const currentMonth = now.getMonth();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const currentYear = now.getFullYear();
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const monthlyTotal = expenses
        .filter(expense => {
          const date = new Date(expense.date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      const previousMonthTotal = expenses
        .filter(expense => {
          const date = new Date(expense.date);
          return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
        })
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      // Check for overspending pattern
      const overspendingWarning = previousMonthTotal > 0 && monthlyTotal > previousMonthTotal * 1.2; // 20% increase

      setInsights({
        highestCategory,
        monthlyTotal,
        previousMonthTotal,
        overspendingWarning
      });
    }
  }, [expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Spending Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.highestCategory && (
          <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
            <span>Highest spending category:</span>
            <span className="font-semibold">
              {insights.highestCategory.category} ({formatRupees(insights.highestCategory.amount)})
            </span>
          </div>
        )}

        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <span>Current month total:</span>
          <span className="font-semibold">{formatRupees(insights.monthlyTotal)}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <span>Previous month total:</span>
          <span className="font-semibold">{formatRupees(insights.previousMonthTotal)}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <span>Month-over-month change:</span>
          <div className="flex items-center gap-1">
            {insights.previousMonthTotal > 0 ? (
              <>
                {insights.monthlyTotal > insights.previousMonthTotal ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <span className={`font-semibold ${insights.monthlyTotal > insights.previousMonthTotal ? 'text-red-500' : 'text-green-500'}`}>
                  {insights.previousMonthTotal > 0 
                    ? `${Math.abs(((insights.monthlyTotal - insights.previousMonthTotal) / insights.previousMonthTotal) * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">No previous data</span>
            )}
          </div>
        </div>

        {insights.overspendingWarning && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            <span>Warning: Your spending has increased significantly this month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
