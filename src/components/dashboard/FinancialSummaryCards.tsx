
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  DollarSign, 
  Wallet, 
  LineChart,
  TrendingUp,
  TrendingDown,
  CreditCard
} from "lucide-react";

interface FinancialSummaryProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  investmentValue: number;
  investmentChange: number;
  creditScore: number;
}

export const FinancialSummaryCards = ({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  investmentValue,
  investmentChange,
  creditScore,
}: FinancialSummaryProps) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalBalance.toLocaleString()}</div>
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
            +${(monthlyIncome - monthlyExpenses).toLocaleString()}
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
          <div className="text-2xl font-bold">${investmentValue.toLocaleString()}</div>
          <div className="flex items-center pt-1">
            <span className={`text-xs ${investmentChange >= 0 ? 'text-finance-green' : 'text-finance-red'} flex items-center`}>
              {investmentChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(investmentChange)}% this month
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
          <div className="text-2xl font-bold">{creditScore}</div>
          <p className="text-xs text-muted-foreground">
            Excellent score range
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
