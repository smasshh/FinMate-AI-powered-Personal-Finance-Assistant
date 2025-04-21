
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  ArrowRight,
  Wallet,
  LineChart,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
      
      {/* Financial summary cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialSummary.totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-finance-green">
              +${(financialSummary.monthlyIncome - financialSummary.monthlyExpenses).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Income vs Expenses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investments</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialSummary.investmentValue.toLocaleString()}</div>
            <div className="flex items-center pt-1">
              <span className={`text-xs ${financialSummary.investmentChange >= 0 ? 'text-finance-green' : 'text-finance-red'} flex items-center`}>
                {financialSummary.investmentChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(financialSummary.investmentChange)}% this month
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Score</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.creditScore}</div>
            <p className="text-xs text-muted-foreground">
              Excellent score range
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Budget Overview */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Your spending compared to budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialSummary.budgetCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ${category.spent} of ${category.budget}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        category.percentage > 100 ? 'bg-finance-red' : 'bg-finance-blue'
                      }`}
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button variant="outline" size="sm" className="w-full">
                <span>View All Categories</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Transactions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialSummary.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-sm font-medium">{transaction.name}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date} • {transaction.category}</p>
                  </div>
                  <div className={`font-medium ${transaction.amount > 0 ? 'text-finance-green' : ''}`}>
                    {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                <span>View All Transactions</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* AI Financial Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-finance-blue" />
            AI Financial Insights
          </CardTitle>
          <CardDescription>Personalized recommendations based on your financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-finance-blue mb-1">Spending Alert</h3>
              <p className="text-sm text-gray-700">
                You've spent 16% more on Entertainment than your monthly budget. Consider reducing discretionary spending for the rest of the month.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="font-medium text-finance-green mb-1">Savings Opportunity</h3>
              <p className="text-sm text-gray-700">
                Based on your cash flow, you could increase your investment contributions by $200 monthly without impacting your lifestyle.
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="font-medium text-finance-gold mb-1">Goal Progress</h3>
              <p className="text-sm text-gray-700">
                You're 65% of the way to your emergency fund goal. At your current saving rate, you'll reach your target in 3 months.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Button variant="outline" size="sm" className="w-full">
              <span>Get More Insights</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
