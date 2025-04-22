
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useExpenses } from '@/hooks/useExpenses';
import { useToast } from '@/hooks/use-toast';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { ExpenseVisualizations } from '@/components/expenses/ExpenseVisualizations';
import { ExpenseInsights } from '@/components/expenses/ExpenseInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Housing",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Travel",
  "Education",
  "Groceries",
  "Gifts",
  "Charity",
  "Other"
];

const DEFAULT_EXPENSE = {
  id: '',
  category: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
};

const Expenses = () => {
  const { addExpense, updateExpense } = useExpenses();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_EXPENSE);

  const handleAddClick = () => {
    setIsEditMode(false);
    setFormData(DEFAULT_EXPENSE);
    setIsDialogOpen(true);
  };

  const handleEditExpense = (expense: any) => {
    setIsEditMode(true);
    setFormData({
      id: expense.id,
      category: expense.category,
      amount: expense.amount.toString(),
      date: expense.date,
      description: expense.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateExpense.mutateAsync({
          id: formData.id,
          category: formData.category,
          amount: parseFloat(formData.amount),
          date: formData.date,
          description: formData.description || undefined,
        });
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
      } else {
        await addExpense.mutateAsync({
          category: formData.category,
          amount: parseFloat(formData.amount),
          date: formData.date,
          description: formData.description || undefined,
        });
        toast({
          title: "Success",
          description: "Expense added successfully",
        });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details about this expense"
                />
              </div>
              <Button type="submit">{isEditMode ? 'Update Expense' : 'Add Expense'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="table" className="space-y-6">
        <TabsList>
          <TabsTrigger value="table">Transactions</TabsTrigger>
          <TabsTrigger value="visualizations">Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-6">
          <ExpenseTable onEdit={handleEditExpense} />
        </TabsContent>

        <TabsContent value="visualizations" className="space-y-6">
          <ExpenseVisualizations />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <ExpenseInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Expenses;
