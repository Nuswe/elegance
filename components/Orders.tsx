import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Calendar, Clock, CheckCircle, X as XIcon, Wallet, ArrowUp, ArrowDown, Filter, FileText, Printer } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Order, Product, Customer, OrderStatus, Installment } from '../types';

// Helper for ID generation
const generateId = () => Math.random().toString(36).substr(2, 9);

export const Orders: React.FC = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');

  // Create Order State
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [initialPayment, setInitialPayment] = useState<number>(0);
  
  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState<string | null>(null); // Order ID
  const [invoiceModalOpen, setInvoiceModalOpen] = useState<Order | null>(null);
  
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'installment' | 'full'>('installment');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setOrders(storageService.getOrders());
    setProducts(storageService.getProducts());
    setCustomers(storageService.getCustomers());
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.product.id === product.id);
      if (existing) {
        return prev.map(p => p.product.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(p => p.product.id !== productId));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.product.sellPrice * item.qty), 0);

  const handleCreateOrder = () => {
    if (!selectedCustomer || cart.length === 0) return;

    const total = calculateTotal();
    const customer = customers.find(c => c.id === selectedCustomer);
    
    let status = OrderStatus.PENDING;
    if (initialPayment >= total) status = OrderStatus.PAID;
    else if (initialPayment > 0) status = OrderStatus.PARTIAL;

    const newOrder: Order = {
      id: generateId(),
      customerId: selectedCustomer,
      customerName: customer?.name || 'Unknown',
      date: new Date().toISOString(),
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.qty,
        priceAtSale: item.product.sellPrice
      })),
      totalAmount: total,
      paidAmount: initialPayment,
      status: status,
      installments: initialPayment > 0 ? [{
        id: generateId(),
        amount: initialPayment,
        date: new Date().toISOString(),
        note: 'Initial Payment'
      }] : []
    };

    // Update Stock
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(c => c.product.id === p.id);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.qty };
      }
      return p;
    });

    const updatedOrders = [newOrder, ...orders];
    storageService.saveOrders(updatedOrders);
    storageService.saveProducts(updatedProducts);
    storageService.recalcCustomerDebt(selectedCustomer);

    refreshData();
    setView('list');
    setCart([]);
    setInitialPayment(0);
    setSelectedCustomer('');
    
    // Auto open invoice
    setInvoiceModalOpen(newOrder);
  };

  const handleAddInstallment = (orderId: string) => {
    if (newPaymentAmount <= 0) return;

    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const newPaid = order.paidAmount + newPaymentAmount;
        const newStatus = newPaid >= order.totalAmount ? OrderStatus.PAID : OrderStatus.PARTIAL;
        const newInstallment: Installment = {
          id: generateId(),
          amount: newPaymentAmount,
          date: new Date().toISOString(),
          note: paymentType === 'full' ? 'Final Settlement' : 'Installment Payment'
        };
        
        // Recalc debt for customer
        setTimeout(() => {
            storageService.recalcCustomerDebt(order.customerId);
            refreshData(); // Refresh UI to show updated customer debt if we were looking at it
        }, 100);

        return {
          ...order,
          paidAmount: newPaid,
          status: newStatus,
          installments: [...order.installments, newInstallment]
        };
      }
      return order;
    });

    storageService.saveOrders(updatedOrders);
    setPaymentModalOpen(null);
    setNewPaymentAmount(0);
    refreshData();
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  // Logic to get active order for modal
  const activeOrder = orders.find(o => o.id === paymentModalOpen);
  const remainingBalance = activeOrder ? activeOrder.totalAmount - activeOrder.paidAmount : 0;

  // Filter & Sorting Logic
  const filteredOrders = orders.filter(order => 
    statusFilter === 'All' ? true : order.status === statusFilter
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-serif text-yellow-600 dark:text-yellow-500">
          {view === 'list' ? 'Orders & Installments' : 'New Order'}
        </h2>
        {view === 'list' && (
          <div className="flex w-full sm:w-auto gap-3">
             <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-3 top-2.5 text-zinc-500 dark:text-zinc-500 pointer-events-none" size={16} />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'All')}
                  className="w-full sm:w-auto bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 text-sm rounded-lg pl-9 pr-8 py-2.5 focus:border-yellow-500 outline-none cursor-pointer appearance-none h-10 shadow-sm"
                >
                  <option value="All">All Statuses</option>
                  {Object.values(OrderStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
             </div>

            <button 
              onClick={() => setView('create')}
              className="bg-yellow-500 text-white dark:text-black px-4 py-2 rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-500 font-bold flex items-center gap-2 whitespace-nowrap h-10 shadow-md transition-colors"
            >
              <Plus size={18} /> New Order
            </button>
          </div>
        )}
        {view === 'create' && (
           <button 
           onClick={() => setView('list')}
           className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
         >
           Cancel
         </button>
        )}
      </div>

      {view === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left: Product Selection */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <div className="mb-4 relative">
                <Search className="absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Search products..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-900 dark:text-zinc-100 focus:border-yellow-500 focus:outline-none transition-colors"
                />
             </div>
             {/* Responsive height for product grid */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 h-80 md:h-[600px] overflow-y-auto custom-scrollbar">
                {products.map(product => (
                  <div key={product.id} 
                    onClick={() => product.stock > 0 && addToCart(product)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col shadow-sm dark:shadow-none ${
                      product.stock > 0 
                        ? 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-yellow-500 dark:hover:border-yellow-500/50' 
                        : 'bg-zinc-100 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-900 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <img src={product.image} alt={product.name} className="w-full h-24 md:h-32 object-cover rounded mb-2 bg-zinc-100 dark:bg-zinc-800" />
                    <h4 className="font-medium text-sm truncate text-zinc-900 dark:text-zinc-100">{product.name}</h4>
                    <div className="mt-auto flex justify-between items-end pt-2 text-sm">
                      <span className="text-yellow-600 dark:text-yellow-500 font-bold text-xs md:text-sm">MK {product.sellPrice.toLocaleString()}</span>
                      <span className="text-zinc-500 dark:text-zinc-500 text-xs">Qty: {product.stock}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-fit lg:h-full shadow-sm">
             <h3 className="font-serif font-bold text-lg mb-4 text-zinc-900 dark:text-zinc-100">Order Summary</h3>
             
             {/* Customer Select */}
             <div className="mb-4">
               <label className="block text-xs text-zinc-500 dark:text-zinc-500 uppercase mb-1">Customer</label>
               <select 
                 value={selectedCustomer}
                 onChange={(e) => setSelectedCustomer(e.target.value)}
                 className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-zinc-200 focus:border-yellow-500 outline-none"
               >
                 <option value="">Select Customer</option>
                 {customers.map(c => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
               </select>
             </div>

             {/* Cart Items */}
             <div className="flex-1 overflow-y-auto mb-4 space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-4 max-h-60 lg:max-h-none">
               {cart.length === 0 && <p className="text-zinc-400 dark:text-zinc-500 text-center py-4">Cart is empty</p>}
               {cart.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2 rounded">
                    <div className="truncate flex-1 mr-2">
                      <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{item.product.name}</p>
                      <p className="text-xs text-zinc-500">MK {item.product.sellPrice.toLocaleString()} x {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-600 dark:text-yellow-500 text-sm font-bold whitespace-nowrap">MK {(item.product.sellPrice * item.qty).toLocaleString()}</span>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300">
                        <XIcon size={16} />
                      </button>
                    </div>
                 </div>
               ))}
             </div>

             {/* Totals */}
             <div className="space-y-2 mb-4">
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                   <span>Subtotal</span>
                   <span>MK {calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-yellow-600 dark:text-yellow-500">
                   <span>Total</span>
                   <span>MK {calculateTotal().toLocaleString()}</span>
                </div>
             </div>

             {/* Payment Input */}
             <div className="mb-6">
                <label className="block text-xs text-zinc-500 dark:text-zinc-500 uppercase mb-1">Initial Payment</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-500 font-bold text-xs">MK</span>
                  <input 
                    type="number" 
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded pl-10 p-2 text-zinc-900 dark:text-white focus:border-yellow-500 outline-none"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">Remaining: MK {Math.max(0, calculateTotal() - initialPayment).toLocaleString()}</p>
             </div>

             <button 
                onClick={handleCreateOrder}
                disabled={!selectedCustomer || cart.length === 0}
                className="w-full bg-yellow-500 dark:bg-yellow-600 text-white dark:text-black font-bold py-3 rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-500 disabled:opacity-50 transition-colors shadow-md"
             >
               Confirm Order
             </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-sm uppercase">
                <tr>
                  <th 
                    className="p-4 cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors select-none group"
                    onClick={toggleSort}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    </div>
                  </th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                      No orders found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map(order => {
                    const balance = order.totalAmount - order.paidAmount;
                    return (
                      <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="p-4 text-zinc-600 dark:text-zinc-400">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="p-4 font-medium text-zinc-900 dark:text-zinc-200">{order.customerName}</td>
                        <td className="p-4 text-zinc-700 dark:text-zinc-300">MK {order.totalAmount.toLocaleString()}</td>
                        <td className="p-4 font-bold text-red-600 dark:text-red-400">
                          {balance > 0 ? `MK ${balance.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs border ${
                            order.status === OrderStatus.PAID ? 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400' :
                            order.status === OrderStatus.PARTIAL ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400' :
                            'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">
                           <div className="flex gap-2">
                              {balance > 0 && (
                                <button 
                                  onClick={() => { 
                                    setPaymentModalOpen(order.id);
                                    setPaymentType('installment');
                                    setNewPaymentAmount(0);
                                  }}
                                  className="text-xs bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-yellow-600 dark:text-yellow-500 px-3 py-1.5 rounded border border-yellow-200 dark:border-yellow-900/30 shadow-sm"
                                >
                                  Pay
                                </button>
                              )}
                              <button 
                                onClick={() => setInvoiceModalOpen(order)}
                                className="text-xs bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                                title="View Receipt"
                              >
                                <FileText size={14} /> Receipt
                              </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-yellow-500/30 rounded-xl p-6 w-full max-w-sm animate-fade-in shadow-2xl">
              <h3 className="text-xl font-serif text-yellow-600 dark:text-yellow-500 mb-4">Add Payment</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                Record a new payment for Order #{paymentModalOpen}
              </p>
              
              {/* Payment Type Toggle */}
              <div className="flex gap-2 mb-6 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <button 
                      onClick={() => { setPaymentType('installment'); setNewPaymentAmount(0); }}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${paymentType === 'installment' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                  >
                      <Wallet size={16} /> Installment
                  </button>
                  <button 
                      onClick={() => { setPaymentType('full'); setNewPaymentAmount(remainingBalance); }}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${paymentType === 'full' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 shadow-sm' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                  >
                      <CheckCircle size={16} /> Full Payment
                  </button>
              </div>

              <div className="mb-6">
                <label className="block text-xs text-zinc-500 uppercase mb-1">Amount (MK)</label>
                <input 
                  type="number" 
                  autoFocus={paymentType === 'installment'}
                  readOnly={paymentType === 'full'}
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(Number(e.target.value))}
                  className={`w-full bg-zinc-50 dark:bg-zinc-950 border rounded p-3 text-xl outline-none transition-colors ${
                    paymentType === 'full' 
                      ? 'border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-500' 
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:border-yellow-500'
                  }`}
                />
                {paymentType === 'full' && (
                  <p className="text-xs text-green-600 dark:text-green-500 mt-2 flex items-center gap-1">
                    <CheckCircle size={12}/> Clearing remaining balance
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setPaymentModalOpen(null); setNewPaymentAmount(0); }}
                  className="flex-1 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleAddInstallment(paymentModalOpen)}
                  className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                    paymentType === 'full' 
                      ? 'bg-green-600 text-white hover:bg-green-500' 
                      : 'bg-yellow-500 dark:bg-yellow-600 text-white dark:text-black hover:bg-yellow-600 dark:hover:bg-yellow-500'
                  }`}
                >
                  Confirm
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
           <div className="bg-white text-black rounded-lg shadow-2xl w-full max-w-md my-8 animate-fade-in print:shadow-none print:w-full print:max-w-none print:my-0">
               {/* Invoice Content - Designed to look like paper */}
               <div className="p-8 print:p-0">
                   <div className="text-center border-b-2 border-black pb-6 mb-6">
                      <h1 className="text-3xl font-serif font-bold tracking-widest mb-1">ELEGANCE</h1>
                      <p className="text-xs uppercase tracking-[0.3em]">Boutique</p>
                      <p className="text-xs mt-2 text-gray-500">Shop 42, Blantyre Mall, Malawi</p>
                      <p className="text-xs text-gray-500">Tel: +265 99 555 0101</p>
                   </div>

                   <div className="flex justify-between text-sm mb-6">
                      <div>
                         <p className="text-gray-500 text-xs uppercase">Billed To:</p>
                         <p className="font-bold">{invoiceModalOpen.customerName}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-gray-500 text-xs uppercase">Invoice #</p>
                         <p className="font-bold">{invoiceModalOpen.id.substring(0,8)}</p>
                         <p className="text-gray-500 text-xs uppercase mt-1">Date</p>
                         <p className="font-bold">{new Date(invoiceModalOpen.date).toLocaleDateString()}</p>
                      </div>
                   </div>

                   <table className="w-full text-sm mb-6">
                      <thead>
                         <tr className="border-b border-black">
                            <th className="text-left py-2 font-bold uppercase text-xs">Item</th>
                            <th className="text-center py-2 font-bold uppercase text-xs">Qty</th>
                            <th className="text-right py-2 font-bold uppercase text-xs">Total</th>
                         </tr>
                      </thead>
                      <tbody>
                         {invoiceModalOpen.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                               <td className="py-2">{item.productName}</td>
                               <td className="py-2 text-center">{item.quantity}</td>
                               <td className="py-2 text-right">MK {(item.quantity * item.priceAtSale).toLocaleString()}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>

                   <div className="flex justify-end mb-6">
                      <div className="w-1/2 space-y-2">
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-bold">MK {invoiceModalOpen.totalAmount.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Paid:</span>
                            <span className="font-bold">MK {invoiceModalOpen.paidAmount.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-sm border-t border-black pt-2">
                            <span className="font-bold uppercase">Balance:</span>
                            <span className="font-bold text-red-600">MK {(invoiceModalOpen.totalAmount - invoiceModalOpen.paidAmount).toLocaleString()}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
                      <p className="italic font-serif">"Fashion fades, only style remains the same."</p>
                      <p className="mt-2 uppercase tracking-wider">Thank you for your business</p>
                   </div>
               </div>

               {/* Action Buttons (Hidden when printing) */}
               <div className="bg-gray-100 p-4 rounded-b-lg flex justify-between gap-4 print:hidden">
                   <button 
                     onClick={() => setInvoiceModalOpen(null)}
                     className="px-4 py-2 text-gray-600 hover:text-black font-medium"
                   >
                     Close
                   </button>
                   <button 
                     onClick={handlePrintInvoice}
                     className="px-6 py-2 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
                   >
                     <Printer size={18} /> Print Invoice
                   </button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};