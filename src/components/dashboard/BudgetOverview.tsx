
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface BudgetCategory {
  name: string;
  spent: number;
  budget: number;
  percentage: number;
}

interface BudgetOverviewProps {
  categories: BudgetCategory[];
}

export const BudgetOverview = ({ categories }: BudgetOverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
        <CardDescription>Your spending compared to budget</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => (
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
  );
};
