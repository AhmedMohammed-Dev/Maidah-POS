
import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { Product, ProductSize } from '../types';
import { 
    Plus, Trash2, Edit2, Search, X, Image as ImageIcon, 
    CheckCircle2, XCircle, Save, AlertCircle, LayoutGrid, DollarSign, List, Package, AlertTriangle, Layers, GripVertical, ChevronLeft, ChevronRight, FolderEdit, Upload
} from 'lucide-react';

interface CategoryButtonProps {
    cat: string;
    label: string; 
    isSelected: boolean; 
    onClick: (c: string) => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ cat, label, isSelected, onClick }) => (
    <button 
        onClick={() => onClick(cat)}
        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all border whitespace-nowrap shadow-sm shrink-0 ${
            isSelected 
            ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' 
            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        }`}
    >
        {label}
    </button>
);

const Products = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory, currency, currentUser, t, settings } = useStore();
  const isRTL = settings.language === 'ar';

  // --- STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Category Scroll Ref
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Category Management State
  const [newCatName, setNewCatName] = useState('');
  const [editingCatName, setEditingCatName] = useState<{old: string, current: string} | null>(null);
  
  // Category Delete State (NEW)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Form Data
  const initialFormState = {
      name: '',
      price: '',
      category: '',
      image: '',
      description: '',
      isAvailable: true
  };
  const [formData, setFormData] = useState(initialFormState);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  
  // Size Input State
  const [sizeName, setSizeName] = useState('');
  const [sizePrice, setSizePrice] = useState('');

  // Permission Check
  if (currentUser?.role !== 'ADMIN') {
      return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-500">
              <AlertCircle size={48} className="mb-4 text-red-500" />
              <h2 className="text-xl font-black text-slate-800">{t('admin_access_denied')}</h2>
          </div>
      );
  }

  // --- HANDLERS ---

  const scrollCategories = (direction: 'left' | 'right') => {
      if (categoryScrollRef.current) {
          const scrollAmount = 200;
          if (direction === 'left') {
              categoryScrollRef.current.scrollBy({ left: isRTL ? 200 : -200, behavior: 'smooth' });
          } else {
              categoryScrollRef.current.scrollBy({ left: isRTL ? -200 : 200, behavior: 'smooth' });
          }
      }
  };

  const handleOpenModal = (product?: Product) => {
      if (product) {
          setEditingId(product.id);
          setFormData({
              name: product.name,
              price: product.price.toString(),
              category: product.category,
              image: product.image,
              description: product.description || '',
              isAvailable: product.isAvailable ?? true
          });
          setSizes(product.sizes || []);
      } else {
          setEditingId(null);
          setFormData({...initialFormState, category: categories[0] || ''});
          setSizes([]);
      }
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.price || !formData.category) {
          alert('Missing required fields');
          return;
      }

      const productPayload: Product = {
          id: editingId || `prod-${Date.now()}`,
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          image: formData.image,
          description: formData.description,
          isAvailable: formData.isAvailable,
          sizes: sizes.length > 0 ? sizes : undefined
      };

      if (editingId) {
          updateProduct(productPayload);
      } else {
          addProduct(productPayload);
      }
      handleCloseModal();
  };

  // --- CATEGORY MANAGEMENT HANDLERS ---
  const handleAddCategory = () => {
      if(newCatName.trim()) {
          addCategory(newCatName.trim());
          setNewCatName('');
      }
  };

  const handleUpdateCategory = () => {
      if(editingCatName && editingCatName.current.trim()) {
          updateCategory(editingCatName.old, editingCatName.current.trim());
          setEditingCatName(null);
      }
  };

  const initiateDeleteCategory = (cat: string) => {
      setCategoryToDelete(cat);
  };

  const executeDeleteCategory = () => {
      if (categoryToDelete) {
          deleteCategory(categoryToDelete);
          setCategoryToDelete(null);
      }
  };

  // --- PRODUCT DELETE LOGIC ---
  const promptDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Prevents clicking the card background
      setDeleteId(id);
  };

  const confirmDelete = () => {
      if (deleteId) {
          deleteProduct(deleteId);
          setDeleteId(null);
      }
  };

  const handleToggleStatus = (e: React.MouseEvent, product: Product) => {
      e.stopPropagation();
      updateProduct({ ...product, isAvailable: !product.isAvailable });
  };

  const handleAddSize = () => {
      if (sizeName && sizePrice) {
          setSizes([...sizes, { name: sizeName, price: parseFloat(sizePrice) }]);
          setSizeName('');
          setSizePrice('');
      }
  };

  const handleRemoveSize = (index: number) => {
      setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(prev => ({ ...prev, image: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const filteredProducts = useMemo(() => {
      return products.filter(p => {
          const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
          const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
      });
  }, [products, selectedCategory, searchQuery]);

  // Updated Styling for better Visibility
  const labelClass = "block text-sm font-black text-slate-800 mb-2";
  const inputClass = "w-full p-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-bold focus:border-blue-600 focus:ring-0 outline-none transition-all placeholder:text-slate-400";

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-slate-100 pb-32">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-0 z-30">
          <div>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                  <Package className="text-blue-600" size={32} />
                  {t('prod_title')}
              </h1>
              <p className="text-slate-600 font-bold mt-2 text-sm">
                  {t('prod_count')}: <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">{products.length}</span>
              </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
              <button 
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex-1 md:flex-none px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                  <Layers size={20} />
                  <span>{t('prod_categories')}</span>
              </button>
              <button 
                  onClick={() => handleOpenModal()}
                  className="flex-1 md:flex-none px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                  <Plus size={24} />
                  <span>{t('add')}</span>
              </button>
          </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-col lg:flex-row items-center gap-4 sticky top-32 z-20">
          <div className="relative w-full lg:w-96">
              <input 
                  type="text" 
                  placeholder={t('search')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full ${isRTL ? 'pl-4 pr-12' : 'pr-4 pl-12'} py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 font-bold text-slate-900 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400`}
              />
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-4 text-slate-400`} size={20} />
          </div>
          <div className="w-px h-10 bg-slate-200 hidden lg:block mx-2"></div>
          
          <div className="flex items-center gap-2 flex-1 w-full overflow-hidden">
              <button 
                  onClick={() => scrollCategories('right')} 
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hidden md:flex shrink-0"
              >
                  {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>

              <div 
                  ref={categoryScrollRef}
                  className="flex gap-2 overflow-x-auto w-full pb-2 lg:pb-0 custom-scrollbar px-2 scroll-smooth"
              >
                  <CategoryButton cat="ALL" label={t('all_category')} isSelected={selectedCategory === 'ALL'} onClick={setSelectedCategory} />
                  {categories.map(cat => (
                      <CategoryButton key={cat} cat={cat} label={cat} isSelected={selectedCategory === cat} onClick={setSelectedCategory} />
                  ))}
              </div>

              <button 
                  onClick={() => scrollCategories('left')} 
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hidden md:flex shrink-0"
              >
                  {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
          </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredProducts.map(product => (
              <div 
                  key={product.id} 
                  onClick={() => handleOpenModal(product)} 
                  className={`bg-white rounded-3xl border-2 transition-all overflow-hidden flex flex-col cursor-pointer group hover:-translate-y-1 hover:shadow-xl ${product.isAvailable ? 'border-slate-200 hover:border-blue-400' : 'border-slate-200 opacity-75 grayscale'}`}
              >
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                      {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                          <ImageIcon className="text-slate-300" size={48} />
                      )}
                      
                      <div className="absolute top-3 right-3 z-10">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm flex items-center gap-1 ${product.isAvailable ? 'bg-green-500 text-white' : 'bg-slate-800 text-white'}`}>
                              {product.isAvailable ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {product.isAvailable ? t('prod_available') : t('prod_unavailable')}
                          </span>
                      </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-black text-slate-900 text-lg mb-1 leading-tight line-clamp-2">{product.name}</h3>
                      <p className="text-xs font-bold text-slate-500 mb-3">{product.category}</p>
                      
                      <div className="mt-auto flex items-center justify-between">
                          <span className="font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg text-lg">{product.price} <span className="text-xs">{currency}</span></span>
                      </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-3 border-t border-slate-100 grid grid-cols-3 gap-2 bg-slate-50/50">
                      <button 
                          onClick={(e) => handleToggleStatus(e, product)}
                          className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors border ${product.isAvailable ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'}`}
                      >
                          {product.isAvailable ? 'Disable' : 'Enable'}
                      </button>
                      
                      <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }}
                          className="py-2 bg-white text-blue-600 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center justify-center"
                          title={t('edit')}
                          type="button"
                      >
                          <Edit2 size={18} />
                      </button>

                      <button 
                          onClick={(e) => promptDelete(e, product.id)}
                          className="py-2 bg-white text-red-600 border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center"
                          title={t('delete')}
                          type="button"
                      >
                          <Trash2 size={18} />
                      </button>
                  </div>
              </div>
          ))}
      </div>

      {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-300">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={40} className="text-slate-300" />
              </div>
              <p className="font-black text-slate-500 text-xl">{t('prod_no_products')}</p>
          </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200 border border-slate-200">
                  <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Trash2 size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">{t('prod_delete_confirm')}</h3>
                  <p className="text-slate-600 font-bold text-sm mb-8 leading-relaxed">
                      {t('prod_delete_msg')}
                  </p>
                  <div className="flex gap-4">
                      <button 
                          onClick={() => setDeleteId(null)}
                          className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                          type="button"
                      >
                          {t('cancel')}
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                          type="button"
                      >
                          {t('confirm')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CATEGORY MANAGER MODAL */}
      {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-slate-200 relative">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                      <div>
                          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                              <FolderEdit size={24} className="text-blue-600" />
                              {t('prod_categories')}
                          </h3>
                      </div>
                      <button onClick={() => setIsCategoryModalOpen(false)} className="bg-white p-3 rounded-full text-slate-400 hover:text-slate-900 shadow-sm border border-slate-200 transition-colors">
                          <X size={24}/>
                      </button>
                  </div>
                  
                  <div className="p-6 bg-slate-50 border-b border-slate-200 shrink-0">
                      <div className="flex gap-3">
                          <input 
                              type="text" 
                              placeholder="Category Name" 
                              className="flex-1 p-4 rounded-2xl border-2 border-slate-300 focus:border-blue-600 outline-none font-bold text-slate-900 placeholder:text-slate-400 shadow-sm"
                              value={newCatName}
                              onChange={(e) => setNewCatName(e.target.value)}
                          />
                          <button 
                              onClick={handleAddCategory}
                              className="bg-slate-900 text-white px-6 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2"
                              type="button"
                          >
                              <Plus size={20} />
                              {t('add')}
                          </button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-3 bg-white">
                      {categories.length === 0 && (
                          <div className="text-center text-slate-400 py-10 font-bold">No categories</div>
                      )}
                      {categories.map((cat, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200 group hover:border-blue-300 hover:shadow-md transition-all">
                              {editingCatName && editingCatName.old === cat ? (
                                  <div className="flex items-center gap-2 flex-1 animate-in fade-in">
                                      <input 
                                          autoFocus
                                          value={editingCatName.current}
                                          onChange={(e) => setEditingCatName({...editingCatName, current: e.target.value})}
                                          className="flex-1 bg-white p-3 rounded-xl border-2 border-blue-500 outline-none text-slate-900 font-bold shadow-sm"
                                      />
                                      <button onClick={handleUpdateCategory} className="text-green-600 bg-green-100 p-3 rounded-xl hover:bg-green-200 transition-colors" type="button"><CheckCircle2 size={20}/></button>
                                      <button onClick={() => setEditingCatName(null)} className="text-red-500 bg-red-100 p-3 rounded-xl hover:bg-red-200 transition-colors" type="button"><X size={20}/></button>
                                  </div>
                              ) : (
                                  <>
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm"><GripVertical size={16} /></div>
                                          <span className="font-black text-slate-800 text-lg">{cat}</span>
                                      </div>
                                      <div className="flex gap-2">
                                          <button 
                                              onClick={() => setEditingCatName({old: cat, current: cat})} 
                                              className="p-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                              title={t('edit')}
                                              type="button"
                                          >
                                              <Edit2 size={18}/>
                                          </button>
                                          <button 
                                              onClick={() => initiateDeleteCategory(cat)} 
                                              className="p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                              title={t('delete')}
                                              type="button"
                                          >
                                              <Trash2 size={18}/>
                                          </button>
                                      </div>
                                  </>
                              )}
                          </div>
                      ))}
                  </div>

                  {/* Category Delete Confirmation Modal (Nested) */}
                  {categoryToDelete && (
                      <div className="absolute inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center border-2 border-red-100 animate-in zoom-in-95">
                              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <AlertTriangle size={32} />
                              </div>
                              <h3 className="text-xl font-black text-slate-900 mb-2">{t('delete')} {categoryToDelete}?</h3>
                              <div className="flex gap-3 mt-6">
                                  <button 
                                      onClick={() => setCategoryToDelete(null)}
                                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                      type="button"
                                  >
                                      {t('cancel')}
                                  </button>
                                  <button 
                                      onClick={executeDeleteCategory}
                                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                                      type="button"
                                  >
                                      {t('confirm')}
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 overflow-y-auto">
              <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto border border-slate-200 flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                      <div>
                          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
                                  {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
                              </div>
                              {editingId ? t('prod_edit') : t('prod_add_new')}
                          </h3>
                      </div>
                      <button onClick={handleCloseModal} className="p-3 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all border border-slate-200 shadow-sm">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                      <form id="productForm" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          
                          {/* LEFT COLUMN: Basic Info */}
                          <div className="space-y-6">
                              <div>
                                  <label className={labelClass}>{t('prod_name')}</label>
                                  <input 
                                      type="text" 
                                      value={formData.name} 
                                      onChange={e => setFormData({...formData, name: e.target.value})} 
                                      className={inputClass}
                                      placeholder="Ex: Cheese Burger" 
                                      required
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className={labelClass}>{t('prod_price')}</label>
                                      <div className="relative">
                                          <input 
                                              type="number" 
                                              value={formData.price} 
                                              onChange={e => setFormData({...formData, price: e.target.value})} 
                                              className={inputClass} 
                                              placeholder="0.00" 
                                              required
                                          />
                                          <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-4' : 'right-4'} text-slate-400 font-bold pointer-events-none`}>{currency}</div>
                                      </div>
                                  </div>
                                  <div>
                                      <label className={labelClass}>{t('prod_category')}</label>
                                      <div className="relative">
                                          <select 
                                              value={formData.category} 
                                              onChange={e => setFormData({...formData, category: e.target.value})} 
                                              className={`${inputClass} appearance-none cursor-pointer`}
                                              required
                                          >
                                              <option value="" disabled>Select...</option>
                                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                          </select>
                                          <ChevronRight size={20} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-4' : 'right-4'} text-slate-400 pointer-events-none rotate-90`} />
                                      </div>
                                  </div>
                              </div>

                              <div>
                                  <label className={labelClass}>{t('prod_desc')}</label>
                                  <textarea 
                                      value={formData.description} 
                                      onChange={e => setFormData({...formData, description: e.target.value})} 
                                      className={`${inputClass} min-h-[120px] resize-none`}
                                      placeholder="..." 
                                  />
                              </div>

                              <div>
                                  <label className={labelClass}>{t('prod_image')}</label>
                                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                      {formData.image ? (
                                          <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden shadow-lg border border-slate-200">
                                              <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Upload className="text-white" size={24} />
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="flex flex-col items-center gap-2 text-slate-400">
                                              <ImageIcon size={48} className="text-slate-300" />
                                              <span className="font-bold text-sm">Click to upload image</span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>

                          {/* RIGHT COLUMN: Sizes & Options */}
                          <div className="space-y-6">
                              <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200">
                                  <h4 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                                      <List size={20} />
                                      {t('prod_sizes')}
                                  </h4>
                                  
                                  <div className="flex gap-2 mb-4">
                                      <input 
                                          type="text" 
                                          placeholder="Size Name (e.g. Large)" 
                                          value={sizeName} 
                                          onChange={e => setSizeName(e.target.value)} 
                                          className="flex-1 p-3 rounded-xl border border-slate-300 font-bold text-sm outline-none focus:border-blue-500"
                                      />
                                      <input 
                                          type="number" 
                                          placeholder="Price" 
                                          value={sizePrice} 
                                          onChange={e => setSizePrice(e.target.value)} 
                                          className="w-24 p-3 rounded-xl border border-slate-300 font-bold text-sm outline-none focus:border-blue-500"
                                      />
                                      <button 
                                          type="button" 
                                          onClick={handleAddSize} 
                                          className="bg-slate-900 text-white px-4 rounded-xl hover:bg-slate-700 transition-colors"
                                      >
                                          <Plus size={20} />
                                      </button>
                                  </div>

                                  <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                      {sizes.length === 0 && (
                                          <div className="text-center text-slate-400 py-4 text-sm font-bold">No sizes added</div>
                                      )}
                                      {sizes.map((s, idx) => (
                                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                              <span className="font-bold text-slate-800">{s.name}</span>
                                              <div className="flex items-center gap-3">
                                                  <span className="font-black text-slate-900">{s.price} {currency}</span>
                                                  <button type="button" onClick={() => handleRemoveSize(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                                                      <Trash2 size={16} />
                                                  </button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                  <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${formData.isAvailable ? 'bg-blue-600' : 'bg-slate-300'}`} onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}>
                                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${formData.isAvailable ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                  </div>
                                  <div>
                                      <p className="font-black text-slate-800">{t('prod_status')}</p>
                                      <p className="text-xs font-bold text-slate-500">{formData.isAvailable ? 'Visible in menu' : 'Hidden from menu'}</p>
                                  </div>
                              </div>
                          </div>
                      </form>
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                      <button 
                          type="button" 
                          onClick={handleCloseModal} 
                          className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                      >
                          {t('cancel')}
                      </button>
                      <button 
                          type="submit" 
                          form="productForm" 
                          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2"
                      >
                          <Save size={20} />
                          <span>{t('save_btn')}</span>
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Products;
