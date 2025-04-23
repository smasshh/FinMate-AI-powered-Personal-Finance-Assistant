import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditIcon, MoreHorizontal, Trash2Icon } from "lucide-react";
import { useExpenses } from '@/hooks/useExpenses';
import { BUDGET_CATEGORIES } from '@/hooks/useBudgets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupees } from "@/lib/utils";

interface ExpenseTableProps {
  onEdit?: (expense: any) => void;
}

export const ExpenseTable = ({ onEdit }: ExpenseTableProps) => {
  const { expenses, isLoading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    date: '',
    description: ''
  });
  const [expenseToEdit, setExpenseToEdit] = useState<{
    id: string;
    category: string;
    amount: string;
    date: string;
    description: string;
  } | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addExpense.mutateAsync({
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
        description: newExpense.description
      });
      setIsAddOpen(false);
      setNewExpense({
        category: '',
        amount: '',
        date: '',
        description: ''
      });
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleEditSubmit = async () => {
    if (expenseToEdit) {
      try {
        await updateExpense.mutateAsync({
          id: expenseToEdit.id,
          category: expenseToEdit.category,
          amount: parseFloat(expenseToEdit.amount),
          date: expenseToEdit.date,
          description: expenseToEdit.description
        });
        setIsEditOpen(false);
        setExpenseToEdit(null);
      } catch (error) {
        console.error("Error updating expense:", error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setNewExpense({ ...newExpense, [field]: e.target.value });
  };

  const handleEditClick = (expense: any) => {
    if (onEdit) {
      onEdit(expense);
    } else {
      setExpenseToEdit({
        id: expense.id,
        category: expense.category,
        amount: expense.amount.toString(),
        date: expense.date,
        description: expense.description || ''
      });
      setIsEditOpen(true);
    }
  };

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      try {
        await deleteExpense.mutateAsync(expenseToDelete);
        setIsDeleteOpen(false);
        setExpenseToDelete(null);
      } catch (error) {
        console.error("Error deleting expense:", error);
      }
    }
  };

  const handleCategoryChange = (value: string) => {
    setNewExpense({ ...newExpense, category: value });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground mb-4">No expenses to show</p>
        <Button onClick={() => setIsAddOpen(true)}>Add Expense</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Add Expense Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={handleCategoryChange}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
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
                value={newExpense.amount}
                onChange={(e) => handleInputChange(e, 'amount')}
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newExpense.date}
                onChange={(e) => handleInputChange(e, 'date')}
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newExpense.description}
                onChange={(e) => handleInputChange(e, 'description')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSubmit}>Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select 
                value={expenseToEdit?.category || ''} 
                onValueChange={(value) => {
                  if (expenseToEdit) {
                    setExpenseToEdit({ ...expenseToEdit, category: value });
                  }
                }}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={expenseToEdit?.amount || ''}
                onChange={(e) => {
                  if (expenseToEdit) {
                    setExpenseToEdit({ ...expenseToEdit, amount: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={expenseToEdit?.date || ''}
                onChange={(e) => {
                  if (expenseToEdit) {
                    setExpenseToEdit({ ...expenseToEdit, date: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                value={expenseToEdit?.description || ''}
                onChange={(e) => {
                  if (expenseToEdit) {
                    setExpenseToEdit({ ...expenseToEdit, description: e.target.value });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
              <TableCell>{expense.category}</TableCell>
              <TableCell>{formatRupees(expense.amount)}</TableCell>
              <TableCell>{expense.description || '-'}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(expense)}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteClick(expense.id)}>
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
