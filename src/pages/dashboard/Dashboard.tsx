import { useState, useEffect } from 'react';
import { FinancialSummaryCards } from "@/components/dashboard/FinancialSummaryCards";
import { BudgetOverview } from "@/components/dashboard/BudgetOverview";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { FinancialInsights } from "@/components/FinancialInsights";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Financial summary interface
interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  investmentValue: number;
  investmentChange: number;
  creditScore: number;
  creditScoreCategory?: string;
  budgetCategories: {
    name: string;
    spent: number;
    budget: number;
    percentage: number;
  }[];
  recentTransactions: {
    id: number | string;
    name: string;
    amount: number;
    date: string;
    category: string;
  }[];
}

// Generic types
type GenericRecord = Record<string, any>;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    investmentValue: 0,
    investmentChange: 0,
    creditScore: 0,
    creditScoreCategory: undefined,
    budgetCategories: [],
    recentTransactions: []
  });

  // Handler for navigating to expenses page
  const handleViewAllTransactions = () => {
    navigate('/dashboard/expenses');
  };

  // Handler for navigating to budget page
  const handleViewAllBudgets = () => {
    navigate('/dashboard/budget');
  };

  // Fetch all necessary data when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Safe query function that handles non-existent tables gracefully
  const safeQuery = async (
    tableName: string, 
    query: (queryBuilder: any) => any, 
    defaultValue: any = []
  ) => {
    try {
      // Try to perform the query but catch any errors
      // Use any type to bypass TypeScript checking for table names
      const builder = supabase.from(tableName as any);
      const result = await query(builder);
      
      if (result.error) {
        console.warn(`Error querying ${tableName}:`, result.error.message);
        return defaultValue;
      }
      
      return result.data || defaultValue;
    } catch (error) {
      console.error(`Error with ${tableName}:`, error);
      return defaultValue;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch accounts
      const accountsData = await safeQuery('accounts', 
        query => query.select('*').eq('user_id', user?.id)
      );
      
      // Fetch current month's expenses
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();
      
      const expensesData = await safeQuery('expenses',
        query => query.select('*')
          .eq('user_id', user?.id)
          .gte('date', firstDay)
          .lte('date', lastDay)
      );
      
      // Fetch all expenses for recent transactions (limited to 10)
      const recentExpensesData = await safeQuery('expenses',
        query => query.select('*')
          .eq('user_id', user?.id)
          .order('date', { ascending: false })
          .limit(10)
      );
      
      // Fetch budgets
      const budgetData = await safeQuery('budgets',
        query => query.select('*').eq('user_id', user?.id)
      );
      
      // Fetch investments
      const investmentsData = await safeQuery('investments',
        query => query.select('*').eq('user_id', user?.id)
      );
      
      // Fetch credit score and total balance from credit_scores table
      const creditScoresData = await safeQuery('credit_scores',
        query => query.select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1),
        []
      );
      
      // Get the most recent credit score entry
      const latestCreditScoreData = creditScoresData.length > 0 ? creditScoresData[0] : null;
      
      // Fetch transactions (now using expenses data instead)
      const transactionsData = await safeQuery('transactions',
        query => query.select('*')
          .eq('user_id', user?.id)
          .order('date', { ascending: false })
          .limit(10)
      );
      
      // Calculate total balance - Use from credit_scores if available, else calculate from accounts
      let totalBalance = 0;
      if (latestCreditScoreData && latestCreditScoreData.total_balance) {
        // Use the total balance from credit_scores
        totalBalance = parseFloat(latestCreditScoreData.total_balance) || 0;
      } else {
        // Fallback: Calculate from accounts
        totalBalance = accountsData.reduce((total: number, account: GenericRecord) => {
          return total + (parseFloat(account.balance) || 0);
        }, 0);
      }
      
      // Calculate monthly income (this could be more complex in a real app)
      const monthlyIncome = transactionsData
        .filter((tx: GenericRecord) => parseFloat(tx.amount) > 0)
        .reduce((total: number, tx: GenericRecord) => total + (parseFloat(tx.amount) || 0), 0);
      
      // Sum up expenses
      const monthlyExpenses = expensesData.reduce(
        (total: number, expense: GenericRecord) => total + (parseFloat(expense.amount) || 0), 
        0
      );
      
      // Calculate investment value
      const investmentValue = investmentsData.reduce(
        (total: number, inv: GenericRecord) => total + (parseFloat(inv.current_value) || 0), 
        0
      );
      
      // Calculate investment change (percentage) - basic calculation
      const previousValue = investmentsData.reduce(
        (total: number, inv: GenericRecord) => {
          const prevValue = parseFloat(inv.previous_value) || parseFloat(inv.current_value) || 0;
          return total + prevValue;
        }, 
        0
      );
      
      const investmentChange = previousValue > 0
        ? ((investmentValue - previousValue) / previousValue) * 100
        : 0;
      
      // Process budget categories
      const budgetCategories = budgetData.map((budget: GenericRecord) => {
        const budgetCategory = String(budget.category || '');
        const spent = expensesData
          .filter((expense: GenericRecord) => String(expense.category || '') === budgetCategory)
          .reduce((total: number, expense: GenericRecord) => total + (parseFloat(expense.amount) || 0), 0);
        
        const budgetAmount = parseFloat(budget.amount) || 0;
        
        return {
          name: budgetCategory,
          spent,
          budget: budgetAmount,
          percentage: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0
        };
      });
      
      // Get credit score from credit_scores table
      const creditScore = latestCreditScoreData && latestCreditScoreData.score 
        ? parseFloat(latestCreditScoreData.score) || 0 
        : 0;
      
      // Get credit score category if available
      const creditScoreCategory = latestCreditScoreData?.category || undefined;
      
      // Format expenses for display as recent transactions
      const recentTransactions = recentExpensesData.map((expense: GenericRecord) => ({
        id: expense.id || '',
        name: expense.description || expense.category || 'Expense',
        amount: -1 * (parseFloat(expense.amount) || 0), // Negative amount for expenses
        date: expense.date ? new Date(expense.date).toLocaleDateString() : '',
        category: expense.category || 'Uncategorized'
      }));
      
      // Update state with all fetched data
      setFinancialSummary({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        investmentValue,
        investmentChange,
        creditScore,
        creditScoreCategory,
        budgetCategories,
        recentTransactions
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Get a quick overview of your finances</p>
      </div>
      
      <FinancialSummaryCards 
        totalBalance={financialSummary.totalBalance}
        monthlyIncome={financialSummary.monthlyIncome}
        monthlyExpenses={financialSummary.monthlyExpenses}
        investmentValue={financialSummary.investmentValue}
        investmentChange={financialSummary.investmentChange}
        creditScore={financialSummary.creditScore}
        creditScoreCategory={financialSummary.creditScoreCategory}
      />
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <BudgetOverview 
          categories={financialSummary.budgetCategories} 
          onViewAllClick={handleViewAllBudgets}
        />
        <RecentTransactions 
          transactions={financialSummary.recentTransactions}
          onViewAllClick={handleViewAllTransactions}
        />
      </div>
      
      <FinancialInsights />
    </div>
  );
};

export default Dashboard;
