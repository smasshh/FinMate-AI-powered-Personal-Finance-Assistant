import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { formatRupees } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Transaction {
  id: number | string;
  name: string;
  amount: number;
  date: string;
  category: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAllClick?: () => void;
}

export const RecentTransactions = ({ 
  transactions,
  onViewAllClick 
}: RecentTransactionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest financial activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm font-medium">{transaction.name}</p>
                  <p className="text-xs text-muted-foreground">{transaction.date} • {transaction.category}</p>
                </div>
                <div className={`font-medium ${transaction.amount > 0 ? 'text-finance-green' : ''}`}>
                  {transaction.amount > 0 ? "+" : ""}{formatRupees(Math.abs(transaction.amount))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              No recent transactions
            </div>
          )}
        </div>
        <div className="mt-4">
          {onViewAllClick ? (
            <Button variant="outline" size="sm" className="w-full" onClick={onViewAllClick}>
              <span>View All Transactions</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Link to="/dashboard/expenses">
              <Button variant="outline" size="sm" className="w-full">
                <span>View All Transactions</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
