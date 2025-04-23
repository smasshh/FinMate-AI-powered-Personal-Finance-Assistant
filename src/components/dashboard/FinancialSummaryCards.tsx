import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Wallet, 
  LineChart,
  TrendingUp,
  TrendingDown,
  CreditCard,
  IndianRupee
} from "lucide-react";
import { formatRupees } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface FinancialSummaryProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  investmentValue: number;
  investmentChange: number;
  creditScore: number;
  creditScoreCategory?: string;
}

// Helper function to determine score category and color
const getCreditScoreInfo = (score: number) => {
  if (score >= 800) {
    return { category: 'Excellent', color: 'bg-green-500 text-white', textColor: 'text-green-600' };
  } else if (score >= 740) {
    return { category: 'Very Good', color: 'bg-emerald-500 text-white', textColor: 'text-emerald-600' };
  } else if (score >= 670) {
    return { category: 'Good', color: 'bg-teal-500 text-white', textColor: 'text-teal-600' };
  } else if (score >= 580) {
    return { category: 'Fair', color: 'bg-yellow-500 text-white', textColor: 'text-yellow-600' };
  } else {
    return { category: 'Poor', color: 'bg-red-500 text-white', textColor: 'text-red-600' };
  }
};

export const FinancialSummaryCards = ({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  investmentValue,
  investmentChange,
  creditScore,
  creditScoreCategory
}: FinancialSummaryProps) => {
  // Use provided category if available, otherwise calculate it
  const scoreInfo = getCreditScoreInfo(creditScore);
  const category = creditScoreCategory || scoreInfo.category;
  const textColor = scoreInfo.textColor;
  
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatRupees(totalBalance)}</div>
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
            +{formatRupees(monthlyIncome - monthlyExpenses)}
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
          <div className="text-2xl font-bold">{formatRupees(investmentValue)}</div>
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
          <div className="flex flex-col space-y-1">
            <div className="text-2xl font-bold">{creditScore || 'Not Available'}</div>
            {creditScore > 0 && (
              <Badge variant={category === 'Poor' || category === 'Fair' ? "destructive" : "default"} className="w-fit">
                {category}
              </Badge>
            )}
            <p className={`text-xs ${creditScore > 0 ? textColor : 'text-muted-foreground'}`}>
              {creditScore > 0 
                ? `${category} score range` 
                : 'Check Credit Score Prediction'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
