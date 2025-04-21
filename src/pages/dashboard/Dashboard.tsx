
import { FinancialSummaryCards } from "@/components/dashboard/FinancialSummaryCards";
import { BudgetOverview } from "@/components/dashboard/BudgetOverview";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { FinancialInsights } from "@/components/FinancialInsights";

// Demo data (will be replaced with actual data from Supabase later)
const financialSummary = {
  totalBalance: 42680.75,
  monthlyIncome: 6500,
  monthlyExpenses: 4320.45,
  investmentValue: 28500.30,
  investmentChange: 3.2,
  creditScore: 745,
  budgetCategories: [
    { name: "Housing", spent: 1800, budget: 2000, percentage: 90 },
    { name: "Food", spent: 850, budget: 800, percentage: 106 },
    { name: "Transport", spent: 420, budget: 500, percentage: 84 },
    { name: "Entertainment", spent: 350, budget: 300, percentage: 116 },
  ],
  recentTransactions: [
    { id: 1, name: "Grocery Store", amount: -125.65, date: "Apr. 19, 2025", category: "Food" },
    { id: 2, name: "Salary Deposit", amount: 3250, date: "Apr. 15, 2025", category: "Income" },
    { id: 3, name: "Netflix", amount: -14.99, date: "Apr. 12, 2025", category: "Entertainment" },
    { id: 4, name: "Gas Station", amount: -45.75, date: "Apr. 10, 2025", category: "Transport" },
  ]
};

const Dashboard = () => {
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
      />
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <BudgetOverview categories={financialSummary.budgetCategories} />
        <RecentTransactions transactions={financialSummary.recentTransactions} />
      </div>
      
      <FinancialInsights />
    </div>
  );
};

export default Dashboard;
