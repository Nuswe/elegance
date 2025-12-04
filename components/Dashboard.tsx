import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Users, AlertTriangle, Sparkles, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Order, Product, Customer, Expense } from '../types';

export const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    setOrders(storageService.getOrders());
    setProducts(storageService.getProducts());
    setCustomers(storageService.getCustomers());
    setExpenses(storageService.getExpenses());
  }, []);

  // Calculate Stats
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalReceived = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalPending = totalSales - totalReceived;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Gross Profit (Sales - Cost of goods sold)
  const grossProfit = orders.reduce((acc, order) => {
    const orderCost = order.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + ((product?.buyPrice || 0) * item.quantity);
    }, 0);
    return acc + (order.totalAmount - orderCost);
  }, 0);

  // Net Profit (Gross Profit - Expenses)
  const netProfit = grossProfit - totalExpenses;

  const lowStockItems = products.filter(p => p.stock <= 3);

  // Chart Data
  const categoryData = products.reduce((acc: any[], product) => {
    const existing = acc.find(x => x.name === product.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: product.category, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#ca8a04', '#eab308', '#facc15', '#713f12', '#a16207'];

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const insight = await geminiService.analyzeBusiness(orders, products, customers);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-yellow-600 dark:text-yellow-500">Overview</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Welcome back to Elegance Boutique</p>
        </div>
        <button 
          onClick={handleAiAnalysis}
          disabled={loadingAi}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white dark:text-black px-6 py-2.5 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all disabled:opacity-50 justify-center shadow-md"
        >
          {loadingAi ? 'Analyzing...' : <><Sparkles size={18} /> AI Business Insights</>}
        </button>
      </header>

      {/* AI Insight Box */}
      {aiInsight && (
        <div className="bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-800 border border-yellow-500/30 p-6 rounded-xl relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={100} className="text-yellow-500" />
          </div>
          <h3 className="text-yellow-600 dark:text-yellow-400 font-bold mb-3 flex items-center gap-2">
            <Sparkles size={18} /> Gemini Analysis
          </h3>
          <div className="text-zinc-700 dark:text-zinc-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiInsight }} />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Sales" 
          value={`MK ${totalSales.toLocaleString()}`} 
          subValue={`${orders.length} orders`}
          icon={DollarSign} 
          color="text-yellow-600 dark:text-yellow-400"
          bgColor="bg-yellow-50 dark:bg-yellow-900/10" 
        />
        <StatCard 
          title="Net Profit" 
          value={`MK ${netProfit.toLocaleString()}`} 
          subValue={netProfit > 0 ? "Profitable" : "Loss"}
          icon={TrendingUp} 
          color={netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          bgColor={netProfit >= 0 ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10"} 
        />
        <StatCard 
          title="Pending Payments" 
          value={`MK ${totalPending.toLocaleString()}`} 
          subValue={`${customers.filter(c => c.currentDebt > 0).length} customers owing`}
          icon={AlertCircle} 
          color="text-red-600 dark:text-red-400"
          bgColor="bg-red-50 dark:bg-red-900/10" 
        />
        <StatCard 
          title="Expenses" 
          value={`MK ${totalExpenses.toLocaleString()}`} 
          subValue="Operational Costs"
          icon={TrendingDown} 
          color="text-orange-600 dark:text-orange-400"
          bgColor="bg-orange-50 dark:bg-orange-900/10" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory Distribution */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 font-serif">Inventory by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tw-content-bg)', borderColor: 'var(--tw-border-color)', color: 'var(--tw-text-color)' }}
                  wrapperClassName="dark:!bg-zinc-900 dark:!border-zinc-700 dark:!text-zinc-100 !bg-white !border-zinc-200 !text-zinc-900"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {categoryData.map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 font-serif">Stock Alerts</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar max-h-64 lg:max-h-none">
            {lowStockItems.length === 0 ? (
              <p className="text-zinc-500 text-center py-10">All items are well stocked.</p>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden flex-none">
                       <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-90 dark:opacity-70" />
                    </div>
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-200 text-sm">{item.name}</p>
                      <p className="text-xs text-red-500 dark:text-red-400">Only {item.stock} left</p>
                    </div>
                  </div>
                  <button className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">
                    Restock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string | number, subValue: string, icon: any, color: string, bgColor?: string }> = ({ title, value, subValue, icon: Icon, color, bgColor }) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-yellow-500/50 dark:hover:border-yellow-900/50 transition-colors shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium uppercase tracking-wider">{title}</p>
        <h4 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate max-w-[200px]">{value}</h4>
      </div>
      <div className={`p-3 rounded-lg ${bgColor || 'bg-zinc-100 dark:bg-zinc-950'} ${color}`}>
        <Icon size={24} />
      </div>
    </div>
    <p className={`text-xs ${color} opacity-80`}>{subValue}</p>
  </div>
);