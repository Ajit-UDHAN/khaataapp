import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  Filter,
  X,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Home,
  Zap,
  Package,
  Truck,
  Megaphone,
  Users,
  Wrench,
  Shield,
  MoreHorizontal
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Expense, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils/calculations';
import DateRangePicker from './DateRangePicker';

const ExpenseManager: React.FC = () => {
  const { expenses, setExpenses, expenseCategories } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Home, Zap, Package, Truck, Megaphone, Users, Wrench, FileText, Shield, MoreHorizontal
    };
    return icons[iconName] || MoreHorizontal;
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || expense.category === selectedCategory;
    
    let matchesDate = true;
    if (dateRange.startDate && dateRange.endDate) {
      const expenseDate = new Date(expense.date);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      matchesDate = expenseDate >= start && expenseDate <= end;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as { [key: string]: number });

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setExpenses(prev => [...prev, newExpense]);
    setShowAddExpense(false);
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => 
      e.id === updatedExpense.id 
        ? { ...updatedExpense, updatedAt: new Date().toISOString() }
        : e
    ));
    setEditingExpense(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
    }
  };

  const exportExpenses = () => {
    const csvData = filteredExpenses.map(expense => ({
      'Date': new Date(expense.date).toLocaleDateString(),
      'Title': expense.title,
      'Category': expense.category,
      'Amount': expense.amount,
      'Payment Method': expense.paymentMethod,
      'Vendor': expense.vendor || '',
      'Description': expense.description || '',
      'Notes': expense.notes || ''
    }));

    const headers = Object.keys(csvData[0] || {});
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Management</h1>
          <p className="text-gray-600">Track and manage all your business expenses</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button
            onClick={exportExpenses}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Total Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Entries</p>
              <p className="text-2xl font-bold">{filteredExpenses.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Categories</p>
              <p className="text-2xl font-bold">{Object.keys(categoryTotals).length}</p>
            </div>
            <Filter className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Avg Expense</p>
              <p className="text-2xl font-bold">
                {formatCurrency(filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {expenseCategories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
          {(searchTerm || selectedCategory || dateRange.startDate) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setDateRange({ startDate: '', endDate: '' });
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Summary */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(categoryTotals).map(([category, amount]) => {
              const categoryData = expenseCategories.find(c => c.name === category);
              const Icon = getIconComponent(categoryData?.icon || 'MoreHorizontal');
              return (
                <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`w-12 h-12 ${categoryData?.color || 'bg-gray-500'} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{category}</p>
                  <p className="text-lg font-bold text-gray-700">{formatCurrency(amount)}</p>
                  <p className="text-xs text-gray-500">
                    {((amount / totalExpenses) * 100).toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory || dateRange.startDate
                ? 'Try adjusting your search or filters'
                : 'Start tracking your business expenses'
              }
            </p>
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Add First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expense
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map((expense) => {
                  const categoryData = expenseCategories.find(c => c.name === expense.category);
                  const Icon = getIconComponent(categoryData?.icon || 'MoreHorizontal');
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{expense.title}</p>
                          {expense.description && (
                            <p className="text-sm text-gray-600">{expense.description}</p>
                          )}
                          {expense.vendor && (
                            <p className="text-xs text-gray-500">Vendor: {expense.vendor}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 ${categoryData?.color || 'bg-gray-500'} rounded-full flex items-center justify-center mr-3`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{expense.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-semibold text-red-600">
                          {formatCurrency(expense.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          expense.paymentMethod === 'cash' 
                            ? 'bg-green-100 text-green-800'
                            : expense.paymentMethod === 'upi'
                            ? 'bg-blue-100 text-blue-800'
                            : expense.paymentMethod === 'online'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {expense.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingExpense(expense)}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      {(showAddExpense || editingExpense) && (
        <ExpenseForm
          expense={editingExpense}
          categories={expenseCategories}
          onSave={editingExpense ? handleUpdateExpense : handleAddExpense}
          onCancel={() => {
            setShowAddExpense(false);
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
};

const ExpenseForm: React.FC<{
  expense?: Expense | null;
  categories: ExpenseCategory[];
  onSave: (expense: any) => void;
  onCancel: () => void;
}> = ({ expense, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: expense?.title || '',
    description: expense?.description || '',
    category: expense?.category || '',
    amount: expense?.amount || 0,
    paymentMethod: expense?.paymentMethod || 'cash' as const,
    date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
    vendor: expense?.vendor || '',
    notes: expense?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expenseData = {
      ...formData,
      date: new Date(formData.date).toISOString()
    };
    
    if (expense) {
      onSave({ ...expense, ...expenseData });
    } else {
      onSave(expenseData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title*</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Shop Rent, Electricity Bill"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category*</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the expense"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount*</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method*</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date*</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vendor or supplier name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              {expense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseManager;