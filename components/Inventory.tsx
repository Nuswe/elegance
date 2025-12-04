import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Wand2, AlertTriangle } from 'lucide-react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Product, ProductCategory } from '../types';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: ProductCategory.CLOTHES, buyPrice: 0, sellPrice: 0, stock: 0, image: 'https://picsum.photos/200/300'
  });

  useEffect(() => {
    setProducts(storageService.getProducts());
  }, []);

  const handleSave = () => {
    const newProducts = [...products];
    if (formData.id) {
      // Edit
      const idx = newProducts.findIndex(p => p.id === formData.id);
      newProducts[idx] = formData as Product;
    } else {
      // Create
      newProducts.push({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      } as Product);
    }
    storageService.saveProducts(newProducts);
    setProducts(newProducts);
    setIsModalOpen(false);
    setFormData({ name: '', category: ProductCategory.CLOTHES, buyPrice: 0, sellPrice: 0, stock: 0, image: 'https://picsum.photos/200/300' });
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      const newProducts = products.filter(p => p.id !== itemToDelete);
      storageService.saveProducts(newProducts);
      setProducts(newProducts);
      setItemToDelete(null);
    }
  };

  const generateDescription = async () => {
    if (!formData.name || !formData.category) return;
    setIsAiLoading(true);
    const desc = await geminiService.generateProductDescription(formData.name, formData.category);
    alert(`Gemini Suggestion for Marketing:\n\n"${desc}"`);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-yellow-600 dark:text-yellow-500">Inventory Management</h2>
        <button 
          onClick={() => { setFormData({}); setIsModalOpen(true); }}
          className="bg-yellow-500 dark:bg-yellow-600 text-white dark:text-black px-4 py-2 rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-500 font-bold flex items-center gap-2 shadow-md"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 md:pb-0">
        {products.map(product => (
          <div key={product.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden group hover:border-yellow-500/50 dark:hover:border-yellow-500/30 transition-all shadow-sm">
            <div className="relative h-48 overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-zinc-100 dark:bg-zinc-800" />
              <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur-md">
                {product.category}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate">{product.name}</h3>
              <div className="flex justify-between items-center mt-2 mb-4">
                 <div>
                   <p className="text-xs text-zinc-500 dark:text-zinc-500">Buy: MK {product.buyPrice.toLocaleString()}</p>
                   <p className="text-lg font-bold text-yellow-600 dark:text-yellow-500">MK {product.sellPrice.toLocaleString()}</p>
                 </div>
                 <div className="text-right">
                    <p className={`text-sm font-bold ${product.stock < 5 ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-500'}`}>
                      {product.stock} in stock
                    </p>
                 </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setFormData(product); setIsModalOpen(true); }}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                  onClick={() => setItemToDelete(product.id)}
                  className="px-3 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-yellow-500/30 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-fade-in">
             <h3 className="text-xl font-serif text-yellow-600 dark:text-yellow-500 mb-6">{formData.id ? 'Edit Product' : 'Add New Product'}</h3>
             
             <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Product Name</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-2 text-zinc-900 dark:text-white focus:border-yellow-500 outline-none" 
                      value={formData.name || ''} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                    <button 
                      onClick={generateDescription} 
                      disabled={isAiLoading || !formData.name}
                      title="Generate Description with AI"
                      className="bg-yellow-100 dark:bg-yellow-600/20 text-yellow-700 dark:text-yellow-500 p-2 rounded hover:bg-yellow-200 dark:hover:bg-yellow-600/30 disabled:opacity-50 transition-colors"
                    >
                      <Wand2 size={20} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 uppercase">Category</label>
                  <select 
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-2 text-zinc-900 dark:text-white focus:border-yellow-500 outline-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {Object.values(ProductCategory).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div>
                      <label className="text-xs text-zinc-500 uppercase">Cost (MK)</label>
                      <input type="number" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-2 text-zinc-900 dark:text-white focus:border-yellow-500 outline-none" 
                        value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} />
                   </div>
                   <div>
                      <label className="text-xs text-zinc-500 uppercase">Sell (MK)</label>
                      <input type="number" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-2 text-zinc-900 dark:text-white focus:border-yellow-500 outline-none" 
                        value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} />
                   </div>
                   <div>
                      <label className="text-xs text-zinc-500 uppercase">Stock</label>
                      <input type="number" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-2 text-zinc-900 dark:text-white focus:border-yellow-500 outline-none" 
                        value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                   </div>
                </div>
                
                <div>
                   <label className="text-xs text-zinc-500 uppercase">Image URL (Optional)</label>
                   <input type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded p-2 text-zinc-900 dark:text-white text-sm focus:border-yellow-500 outline-none" 
                     value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} />
                </div>
             </div>

             <div className="flex gap-3 mt-8">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Cancel</button>
               <button onClick={handleSave} className="flex-1 py-2 rounded bg-yellow-500 dark:bg-yellow-600 text-white dark:text-black font-bold hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-colors">Save Item</button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-500/30 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-serif">Confirm Deletion</h3>
              </div>
              
              <p className="text-zinc-600 dark:text-zinc-300 mb-6">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setItemToDelete(null)} 
                  className="flex-1 py-2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};