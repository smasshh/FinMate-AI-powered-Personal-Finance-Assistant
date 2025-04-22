
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from 'recharts';
import { useExpenses } from '@/hooks/useExpenses';

// Helper function to group expenses by category
const groupByCategory = (expenses: any[]) => {
  if (!expenses || expenses.length === 0) return [];
  
  const grouped = expenses.reduce((acc: Record<string, number>, expense: any) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += Number(expense.amount);
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
};

// Helper function to group expenses by month
const groupByMonth = (expenses: any[]) => {
  if (!expenses || expenses.length === 0) return [];
  
  const grouped = expenses.reduce((acc: Record<string, number>, expense: any) => {
    const date = new Date(expense.date);
    const month = date.toLocaleString('default', { month: 'short' });
    
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += Number(expense.amount);
    return acc;
  }, {});

  // Convert to array and sort by month
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => months.indexOf(a.name) - months.indexOf(b.name));
};

// Helper function to separate current month and previous month
const compareMonths = (expenses: any[]) => {
  if (!expenses || expenses.length === 0) return { current: [], previous: [] };
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const currentYear = now.getFullYear();
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  // Group by day of month for both current and previous
  const result: Record<string, any[]> = { current: Array(31).fill(0), previous: Array(31).fill(0) };
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const month = date.getMonth();
    const year = date.getFullYear();
    const day = date.getDate() - 1; // 0-indexed
    
    if (month === currentMonth && year === currentYear) {
      result.current[day] += Number(expense.amount);
    } else if (month === previousMonth && year === previousYear) {
      result.previous[day] += Number(expense.amount);
    }
  });
  
  // Convert to required format for chart
  return {
    data: Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      current: result.current[i],
      previous: result.previous[i]
    }))
  };
};

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#FF6B6B', '#C39BD3', '#7FB3D5'];

export function ExpenseVisualizations() {
  const { expenses } = useExpenses();
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any>({ data: [] });
  
  useEffect(() => {
    if (expenses && expenses.length > 0) {
      setCategoryData(groupByCategory(expenses));
      setMonthlyData(groupByMonth(expenses));
      setComparisonData(compareMonths(expenses));
    }
  }, [expenses]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Expense Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="category">
          <TabsList className="mb-4">
            <TabsTrigger value="category">Category Breakdown</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
            <TabsTrigger value="comparison">Month Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="category" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="monthly" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="comparison" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData.data}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Line type="monotone" dataKey="current" stroke="#8884d8" name="Current Month" />
                <Line type="monotone" dataKey="previous" stroke="#82ca9d" name="Previous Month" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
