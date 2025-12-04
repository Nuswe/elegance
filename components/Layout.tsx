import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Users, ShoppingCart, LogOut, Menu, X, CalendarRange, Receipt, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onLogout, isDarkMode, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'POS & Orders', icon: ShoppingCart },
    { id: 'installments', label: 'Installments', icon: CalendarRange },
    { id: 'inventory', label: 'Inventory', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
  ];

  return (
    <div className="h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex overflow-hidden transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-yellow-900/30 flex flex-col
        transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 shadow-lg md:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 text-center border-b border-zinc-100 dark:border-yellow-900/20 flex-none">
          <h1 className="text-2xl font-serif font-bold text-yellow-600 dark:text-yellow-500 tracking-widest">ELEGANCE</h1>
          <p className="text-xs text-zinc-400 dark:text-yellow-500/60 uppercase tracking-widest mt-1">Boutique Manager</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-yellow-50 dark:bg-gradient-to-r dark:from-yellow-900/40 dark:to-transparent text-yellow-700 dark:text-yellow-400 border-l-4 border-yellow-500' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-100 dark:border-yellow-900/20 flex-none space-y-2">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header */}
        <div className="md:hidden flex-none flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-yellow-900/30">
          <h1 className="text-xl font-serif font-bold text-yellow-600 dark:text-yellow-500">ELEGANCE</h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-600 dark:text-yellow-500">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950 relative scroll-smooth">
          <div className="max-w-7xl mx-auto pb-20 md:pb-0">
             {children}
          </div>
        </main>
      </div>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};