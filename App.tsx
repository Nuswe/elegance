import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Orders } from './components/Orders';
import { Inventory } from './components/Inventory';
import { Customers } from './components/Customers';
import { Installments } from './components/Installments';
import { Expenses } from './components/Expenses';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    storageService.init();
    
    // Auth Check
    const storedAuth = localStorage.getItem('eb_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }

    // Theme Check
    const storedTheme = localStorage.getItem('eb_theme');
    if (storedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('eb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('eb_theme', 'light');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock auth
    if (username === 'admin' && password === 'admin') {
      setIsAuthenticated(true);
      localStorage.setItem('eb_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid credentials (try admin/admin)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('eb_auth');
    setUsername('');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-100 dark:bg-black relative transition-colors duration-300">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 dark:opacity-40"></div>
        <div className="absolute inset-0 bg-white/30 dark:bg-black/80 backdrop-blur-sm"></div>

        <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-yellow-500/30 w-full max-w-md shadow-2xl transition-colors duration-300">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-yellow-600 dark:text-yellow-500 mb-2">ELEGANCE</h1>
            <p className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-xs">Boutique Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-500 uppercase mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:border-yellow-500 outline-none transition-colors"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-500 uppercase mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:border-yellow-500 outline-none transition-colors"
                placeholder="Enter password"
              />
            </div>
            
            {loginError && (
              <p className="text-red-500 dark:text-red-400 text-sm text-center">{loginError}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white dark:text-black font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:scale-[1.02]"
            >
              Access Portal
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-zinc-400 dark:text-zinc-600 text-xs">© 2024 Elegance Boutique. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
    >
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'orders' && <Orders />}
      {currentPage === 'installments' && <Installments />}
      {currentPage === 'inventory' && <Inventory />}
      {currentPage === 'customers' && <Customers />}
      {currentPage === 'expenses' && <Expenses />}
    </Layout>
  );
};

export default App;