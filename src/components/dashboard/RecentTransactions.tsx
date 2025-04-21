
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface Transaction {
  id: number;
  name: string;
  amount: number;
  date: string;
  category: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest financial activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
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
  );
};
