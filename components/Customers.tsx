import React, { useState, useEffect } from 'react';
import { Plus, Phone, MapPin, History, FileText, Package } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Customer, Order } from '../types';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  // History View State
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  useEffect(() => {
    setCustomers(storageService.getCustomers());
  }, []);

  const handleSave = () => {
    const newCustomers = [...customers];
    if (formData.id) {
       const idx = newCustomers.findIndex(c => c.id === formData.id);
       newCustomers[idx] = formData as Customer;
    } else {
       newCustomers.push({
         ...formData,
         id: Math.random().toString(36).substr(2, 9),
         totalSpent: 0,
         currentDebt: 0
       } as Customer);
    }
    storageService.saveCustomers(newCustomers);
    setCustomers(newCustomers);
    setIsModalOpen(false);
    setFormData({});
  };

  const handleViewHistory = (customer: Customer) => {
    const allOrders = storageService.getOrders();
    // Filter orders for this customer and sort by date descending
    const history = allOrders
      .filter(o => o.customerId === customer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setCustomerOrders(history);
    setViewingCustomer(customer);
  };

  // Calculate dynamic stats for history view
  const totalOrdersValue = customerOrders.reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-yellow-600 dark:text-yellow-500">Customer Directory</h2>
        <button 
          onClick={() => { setFormData({}); setIsModalOpen(true); }}
          className="bg-yellow-500 dark:bg-yellow-600 text-white dark:text-black px-4 py-2 rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-500 font-bold flex items-center gap-2 shadow-md transition-colors"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 md:pb-0">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-yellow-500/50 dark:hover:border-yellow-900/40 transition-all flex flex-col h-full shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-700 dark:from-yellow-600 dark:to-yellow-800 rounded-full flex items-center justify-center text-xl font-bold text-white dark:text-black flex-none shadow-sm">
                  {customer.name.charAt(0)}
                </div>
                {customer.currentDebt > 0 && (
                   <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded border border-red-200 dark:border-red-900/50 ml-2">
                     Owes MK {customer.currentDebt.toLocaleString()}
                   </span>
                )}
             </div>
             
             <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1 truncate">{customer.name}</h3>
             
             <div className="space-y-2 mt-4 text-sm text-zinc-500 dark:text-zinc-400 flex-1">
               <div className="flex items-center gap-2">
                 <Phone size={14} className="text-yellow-600 flex-none" />
                 <span>{customer.phone}</span>
               </div>
               <div className="flex items-center gap-2">
                 <MapPin size={14} className="text-yellow-600 flex-none" />
                 <span className="truncate">{customer.address}</span>
               </div>
             </div>

             <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 text-sm">
                <button 
                  onClick={() => handleViewHistory(customer)}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-2 rounded flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 transition-colors"
                >
                  <History size={14} /> History
                </button>
                <button 
                  onClick={() => { setFormData(customer); setIsModalOpen(true); }}
                  className="px-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  Edit
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-yellow-500/30 rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl animate-fade-in">
             <h3 className="text-xl font-serif text-yellow-600 dark:text-yellow-500 mb-6">{formData.id ? 'Edit Customer' : 'Add New Customer'}</h3>
             
             <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Full Name</label>
                  <input className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-2 text-zinc-900 dark:text-white focus:border-yellow-500 outline-none" 
                    value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Phone Number</label>
                  <input className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-2 text-zinc-900 dark:text-white focus:border-yellow-500 outline-none" 
                    value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Address</label>
                  <textarea className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-2 text-zinc-900 dark:text-white h-24 focus:border-yellow-500 outline-none" 
                    value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
             </div>

             <div className="flex gap-3 mt-8">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Cancel</button>
               <button onClick={handleSave} className="flex-1 py-2 rounded bg-yellow-500 dark:bg-yellow-600 text-white dark:text-black font-bold hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-colors">Save Customer</button>
             </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-yellow-500/30 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start">
               <div>
                  <h3 className="text-2xl font-serif text-yellow-600 dark:text-yellow-500">{viewingCustomer.name}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{viewingCustomer.phone}</p>
               </div>
               <button onClick={() => setViewingCustomer(null)} className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Close</button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 p-6 bg-zinc-50 dark:bg-zinc-950/50">
               <div className="text-center">
                  <p className="text-xs text-zinc-500 uppercase">Total Orders</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{customerOrders.length}</p>
               </div>
               <div className="text-center border-l border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase">Lifetime Value</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-500">MK {totalOrdersValue.toLocaleString()}</p>
               </div>
               <div className="text-center border-l border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase">Current Debt</p>
                  <p className={`text-xl font-bold ${viewingCustomer.currentDebt > 0 ? 'text-red-600 dark:text-red-500' : 'text-zinc-400'}`}>
                    MK {viewingCustomer.currentDebt.toLocaleString()}
                  </p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
               <h4 className="text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                 <FileText size={16} /> Order History
               </h4>
               
               {customerOrders.length === 0 ? (
                 <div className="text-center py-8 text-zinc-500">
                    <Package size={48} className="mx-auto mb-2 opacity-30" />
                    <p>No orders found for this customer.</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                    {customerOrders.map(order => (
                      <div key={order.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg flex flex-col md:flex-row justify-between gap-4 shadow-sm dark:shadow-none">
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                               <span className="text-yellow-600 dark:text-yellow-500 font-bold">#{order.id.substring(0,6)}</span>
                               <span className="text-zinc-500 text-xs">• {new Date(order.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">
                               {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="font-bold text-zinc-900 dark:text-white">MK {order.totalAmount.toLocaleString()}</p>
                            <div className="flex items-center justify-end gap-2 mt-1">
                               {order.totalAmount > order.paidAmount ? (
                                 <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/30">
                                   Due: MK {(order.totalAmount - order.paidAmount).toLocaleString()}
                                 </span>
                               ) : (
                                 <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded border border-green-200 dark:border-green-900/30">
                                   Fully Paid
                                 </span>
                               )}
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
            
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-b-xl">
               <button 
                 onClick={() => setViewingCustomer(null)}
                 className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
               >
                 Close History
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};