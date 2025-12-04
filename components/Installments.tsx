import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Wallet, AlertCircle, CheckCircle, History, Clock, X } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Order, Installment, Customer } from '../types';

export const Installments: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sidebarView, setSidebarView] = useState<'due' | 'history'>('due');
  const [selectedDay, setSelectedDay] = useState<{ date: Date; events: any[] } | null>(null);

  useEffect(() => {
    setOrders(storageService.getOrders());
    setCustomers(storageService.getCustomers());
  }, []);

  // Calendar Logic
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Extract all installments from all orders and flatten them for display
  const allInstallments = orders.flatMap(order => 
    order.installments.map(inst => ({
      ...inst,
      customerName: order.customerName,
      orderId: order.id
    }))
  );

  const getEventsForDay = (day: number) => {
    return allInstallments.filter(inst => {
      const instDate = new Date(inst.date);
      return instDate.getDate() === day &&
             instDate.getMonth() === currentDate.getMonth() &&
             instDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const handleDayClick = (day: number, events: any[]) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDay({ date, events });
  };

  // List Data
  const customersWithDebt = customers.filter(c => c.currentDebt > 0).sort((a, b) => b.currentDebt - a.currentDebt);
  
  const recentPayments = [...allInstallments].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-yellow-600 dark:text-yellow-500">Installments Calendar</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Track payments and outstanding balances</p>
        </div>
        
        {/* Total Outstanding Widget */}
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/40 px-4 py-2 rounded-lg flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-500">
                <AlertCircle size={20} />
            </div>
            <div>
                <p className="text-xs text-zinc-500 uppercase">Total Outstanding</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    MK {customersWithDebt.reduce((acc, c) => acc + c.currentDebt, 0).toLocaleString()}
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
            <button onClick={prevMonth} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-500 font-serif">{monthName} {year}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-fr bg-zinc-100 dark:bg-zinc-900">
            {/* Empty cells for padding start of month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/20" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const events = getEventsForDay(day);
              const isToday = 
                day === new Date().getDate() && 
                currentDate.getMonth() === new Date().getMonth() && 
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div 
                  key={day} 
                  onClick={() => handleDayClick(day, events)}
                  className={`min-h-[100px] p-2 border-b border-r border-zinc-200/50 dark:border-zinc-800/50 relative group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer bg-white dark:bg-zinc-900 ${isToday ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                >
                  <span className={`text-sm font-medium ${isToday ? 'text-yellow-600 dark:text-yellow-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {day}
                  </span>
                  
                  <div className="mt-2 space-y-1">
                    {events.map((evt) => (
                      <div key={evt.id} className="text-xs p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-yellow-500/50 transition-colors shadow-sm" title={evt.note}>
                        <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{evt.customerName}</p>
                        <p className="text-yellow-700 dark:text-yellow-600">MK {evt.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Outstanding Payments & History */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-[600px] lg:h-auto shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <button 
              onClick={() => setSidebarView('due')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2
                ${sidebarView === 'due' ? 'bg-zinc-50 dark:bg-zinc-800 text-yellow-600 dark:text-yellow-500 border-b-2 border-yellow-500' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
            >
              <Wallet size={16} /> Outstanding
            </button>
            <button 
              onClick={() => setSidebarView('history')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2
                ${sidebarView === 'history' ? 'bg-zinc-50 dark:bg-zinc-800 text-yellow-600 dark:text-yellow-500 border-b-2 border-yellow-500' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
            >
              <History size={16} /> History
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
             {sidebarView === 'due' ? (
               // Outstanding View
               customersWithDebt.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500">
                     <CheckCircle size={40} className="mx-auto mb-2 text-green-500 opacity-50" />
                     <p>No outstanding debts.</p>
                  </div>
               ) : (
                  customersWithDebt.map(customer => (
                    <div key={customer.id} className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-red-500/50 dark:hover:border-red-900/50 transition-all animate-fade-in shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200">{customer.name}</p>
                          <p className="text-xs text-zinc-500">{customer.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-sm font-bold text-red-600 dark:text-red-400">
                            MK {customer.currentDebt.toLocaleString()}
                          </span>
                          <span className="text-[10px] uppercase text-zinc-600 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-900 px-1 rounded">
                            Due
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
               )
             ) : (
               // History View
               recentPayments.length === 0 ? (
                 <div className="text-center py-10 text-zinc-500">
                    <Clock size={40} className="mx-auto mb-2 opacity-50" />
                    <p>No payment history found.</p>
                 </div>
               ) : (
                 recentPayments.map(payment => (
                   <div key={payment.id} className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-yellow-500/50 dark:hover:border-yellow-900/50 transition-all animate-fade-in shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-zinc-800 dark:text-zinc-200">{payment.customerName}</p>
                        <span className="text-xs text-zinc-500">{new Date(payment.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-end">
                         <p className="text-xs text-zinc-500 italic truncate max-w-[120px]">{payment.note || 'Payment'}</p>
                         <p className="text-sm font-bold text-green-600 dark:text-green-500">
                           + MK {payment.amount.toLocaleString()}
                         </p>
                      </div>
                   </div>
                 ))
               )
             )}
          </div>
        </div>
      </div>

      {/* Selected Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-yellow-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-serif text-yellow-600 dark:text-yellow-500">
                        {selectedDay.date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                     </h3>
                     <button onClick={() => setSelectedDay(null)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                        <X size={24} />
                     </button>
                </div>

                {/* List */}
                 <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {selectedDay.events.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock size={32} className="mx-auto mb-2 text-zinc-400" />
                            <p className="text-zinc-500">No installments recorded for this day.</p>
                        </div>
                    ) : (
                        selectedDay.events.map((evt, idx) => (
                            <div key={idx} className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-yellow-500/30 transition-colors shadow-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{evt.customerName}</span>
                                    <span className="font-bold text-yellow-600 dark:text-yellow-500">MK {evt.amount.toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-zinc-500 mb-2">{evt.note || 'Payment'}</p>
                                <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-900/50">
                                   <span className="text-xs text-zinc-600 font-mono">Order ID: #{evt.orderId.substring(0,8)}</span>
                                </div>
                            </div>
                        ))
                    )}
                 </div>
                 
                 <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button onClick={() => setSelectedDay(null)} className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 py-2 rounded-lg transition-colors font-medium">
                        Close
                    </button>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};