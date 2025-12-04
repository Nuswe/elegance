import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Receipt, TrendingDown } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Expense } from '../types';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: 'Rent',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ['Rent', 'Utilities', 'Salaries', 'Packaging', 'Marketing', 'Inventory Shipping', 'Other'];

  useEffect(() => {
    setExpenses(storageService.getExpenses());
  }, []);

  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.category) return;

    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      category: newExpense.category,
      amount: Number(newExpense.amount),
      date: newExpense.date || new Date().toISOString(),
      note: newExpense.note || ''
    };

    const updated = [expense, ...expenses];
    storageService.saveExpenses(updated);
    setExpenses(updated);
    setIsModalOpen(false);
    setNewExpense({ category: 'Rent', date: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      const updated = expenses.filter(e => e.id !== id);
      storageService.saveExpenses(updated);
      setExpenses(updated);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-serif text-yellow-600 dark:text-yellow-500">Business Expenses</h2>
           <p className="text-zinc-500 dark:text-zinc-400">Track operational costs and overheads</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 font-bold flex items-center gap-2 shadow-md transition-colors"
        >
          <Plus size={18} /> Record Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Summary Card */}
         <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/30 rounded-xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-4 text-red-500 dark:text-red-400">
                  <TrendingDown size={24} />
                  <h3 className="font-bold text-lg">Total Operations Cost</h3>
               </div>
               <p className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">MK {totalExpenses.toLocaleString()}</p>
               <p className="text-xs text-zinc-500">Total operational expenditure to date.</p>
               
               <div className="mt-6 space-y-3">
                  {categories.map(cat => {
                     const catTotal = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
                     if (catTotal === 0) return null;
                     return (
                        <div key={cat} className="flex justify-between text-sm">
                           <span className="text-zinc-500 dark:text-zinc-400">{cat}</span>
                           <span className="text-zinc-700 dark:text-zinc-200 font-medium">MK {catTotal.toLocaleString()}</span>
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>

         {/* Expense List */}
         <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
             <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-zinc-700 dark:text-zinc-300">Expense History</h3>
             </div>
             <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[600px] overflow-y-auto custom-scrollbar">
                {expenses.length === 0 ? (
                   <div className="p-8 text-center text-zinc-500">No expenses recorded yet.</div>
                ) : (
                   expenses.map(expense => (
                      <div key={expense.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex justify-between items-center group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-400">
                               <Receipt size={18} />
                            </div>
                            <div>
                               <p className="font-medium text-zinc-900 dark:text-white">{expense.category}</p>
                               <p className="text-xs text-zinc-500">{new Date(expense.date).toLocaleDateString()} • {expense.note}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="font-bold text-red-600 dark:text-red-400">- MK {expense.amount.toLocaleString()}</span>
                            <button 
                              onClick={() => handleDelete(expense.id)}
                              className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </div>
                   ))
                )}
             </div>
         </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
              <h3 className="text-xl font-serif text-zinc-900 dark:text-white mb-6">Record New Expense</h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-xs text-zinc-500 uppercase">Amount (MK)</label>
                    <input 
                      type="number" 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-3 text-zinc-900 dark:text-white focus:border-red-500 outline-none"
                      value={newExpense.amount || ''}
                      onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                    />
                 </div>

                 <div>
                    <label className="text-xs text-zinc-500 uppercase">Category</label>
                    <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-3 text-zinc-900 dark:text-white focus:border-red-500 outline-none"
                      value={newExpense.category}
                      onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    >
                       {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="text-xs text-zinc-500 uppercase">Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-3 text-zinc-900 dark:text-white focus:border-red-500 outline-none"
                      value={newExpense.date}
                      onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="text-xs text-zinc-500 uppercase">Note (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-3 text-zinc-900 dark:text-white focus:border-red-500 outline-none"
                      value={newExpense.note || ''}
                      onChange={e => setNewExpense({...newExpense, note: e.target.value})}
                      placeholder="e.g., Shop repairs"
                    />
                 </div>
              </div>

              <div className="flex gap-3 mt-8">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Cancel</button>
                 <button onClick={handleAddExpense} className="flex-1 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-500 transition-colors">Save Expense</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};