import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Format currency in Indian Rupees
const formatRupees = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

interface BudgetChartProps {
  categoryData: Array<{
    name: string;
    budget: number;
    spent: number;
    percentage: number;
  }>;
  monthlyData: Array<{
    name: string;
    spent: number;
    budget: number;
  }>;
}

const COLORS = [
  "#9b87f5", // Primary Purple
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A78BFA", // Purple
  "#C4B5FD", // Light purple
  "#F472B6", // Pink
  "#FB7185", // Rose
  "#4ADE80", // Green
  "#34D399", // Emerald
  "#2DD4BF", // Teal
  "#22D3EE", // Cyan
  "#38BDF8", // Light blue
  "#60A5FA", // Blue
];

export const BudgetChart = ({ categoryData, monthlyData }: BudgetChartProps) => {
  const pieData = categoryData.map(item => ({
    name: item.name,
    value: item.spent
  }));

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Budget Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="category" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="category">Category Breakdown</TabsTrigger>
            <TabsTrigger value="comparison">Budget vs Spending</TabsTrigger>
            <TabsTrigger value="trend">Monthly Trend</TabsTrigger>
            <TabsTrigger value="allocation">Budget Allocation</TabsTrigger>
          </TabsList>

          <TabsContent value="category" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatRupees(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatRupees(Number(value))} />
                  <Legend />
                  <Bar dataKey="budget" name="Budget" fill="#9b87f5" />
                  <Bar dataKey="spent" name="Spent" fill="#ea384c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="trend" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatRupees(Number(value))} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="budget" 
                    stroke="#9b87f5" 
                    activeDot={{ r: 8 }} 
                    name="Budget"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="spent" 
                    stroke="#ea384c" 
                    name="Spent"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="allocation" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="budget"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatRupees(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
