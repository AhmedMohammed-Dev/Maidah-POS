
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Product, CartItem, Order, OrderStatus, ProductSize, OrderType, Customer } from '../types';
import { Search, Plus, Minus, Trash2, CreditCard, Coffee, Zap, X, ChevronUp, ShoppingBag, Receipt, User, Truck, ArrowLeftRight, Split, AlertCircle, AlertTriangle, Heart, Package, ChevronRight, ChevronLeft, Utensils, Bike, MapPin, Phone, UserPlus } from 'lucide-react';
import { suggestSmartUpsell } from '../services/geminiService';
import InvoiceModal from '../components/InvoiceModal';
import SplitBillModal from '../components/SplitBillModal';

const POS = () => {
  const { products, categories, addOrder, currency, settings, currentUser, users, checkProductStock, getProductMaxStock, customers, addOrUpdateCustomer, t } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // --- ORDER TYPE STATE ---
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableNumber, setTableNumber] = useState<string>('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState(''); // New for Delivery
  const [customerAddress, setCustomerAddress] = useState(''); // New for Delivery
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [upsellSuggestion, setUpsellSuggestion] = useState<string>('');
  
  // Scroll Ref for Categories
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Staff Selection
  const [selectedWaiter, setSelectedWaiter] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');

  // Mobile Cart State
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrderForReceipt, setCurrentOrderForReceipt] = useState<Order | null>(null);
  
  // Split Bill State
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCartItems, setSplitCartItems] = useState<CartItem[] | null>(null);

  // Size Selection State
  const [productForSizeSelect, setProductForSizeSelect] = useState<Product | null>(null);

  // Donation State
  const [showDonationInput, setShowDonationInput] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');

  // Helper for offline images
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Direction Helper
  const isRTL = settings.language === 'ar';

  const handleImgError = (id: string) => {
      setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  // --- PHONE LOOKUP LOGIC ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const phone = e.target.value;
      setCustomerPhone(phone);
      
      const existingCustomer = customers.find(c => c.phone === phone);
      if (existingCustomer) {
          setCustomerName(existingCustomer.name);
          setCustomerAddress(existingCustomer.address);
          setIsNewCustomer(false);
      } else {
          setIsNewCustomer(true);
      }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
      if (categoryScrollRef.current) {
          const scrollAmount = 200;
          // Reverse direction for RTL naturally handled by scrollLeft? 
          // Usually needs logic adjustment based on dir.
          // For simplicity, left decreases, right increases.
          if (direction === 'left') {
              categoryScrollRef.current.scrollBy({ left: isRTL ? 200 : -200, behavior: 'smooth' });
          } else {
              categoryScrollRef.current.scrollBy({ left: isRTL ? -200 : 200, behavior: 'smooth' });
          }
      }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isVisible = p.isAvailable !== false; 
      return matchesCategory && matchesSearch && isVisible;
    });
  }, [products, selectedCategory, searchQuery]);

  const waiters = useMemo(() => users.filter(u => u.role === 'WAITER' || u.role === 'ADMIN' || u.role === 'CASHIER'), [users]);
  const drivers = useMemo(() => users.filter(u => u.role === 'DRIVER'), [users]);

  // Reset fields when order type changes
  useEffect(() => {
      if (orderType === 'TAKEAWAY') {
          setTableNumber('TA');
          setSelectedDriver('');
      } else if (orderType === 'DELIVERY') {
          setTableNumber('DEL');
      } else {
          setTableNumber('1');
          setSelectedDriver('');
      }
  }, [orderType]);

  const handleProductClick = (product: Product) => {
      if (product.sizes && product.sizes.length > 0) {
          setProductForSizeSelect(product);
      } else {
          addToCart(product);
      }
  };

  const addToCart = (product: Product, selectedSize?: ProductSize) => {
    const finalPrice = selectedSize ? selectedSize.price : product.price;
    
    setCart(prev => {
      const existing = prev.find(item => {
          if (item.id === product.id && !selectedSize && !item.selectedSize) return true;
          if (item.id === product.id && selectedSize && item.selectedSize?.name === selectedSize.name) return true;
          return false;
      });

      if (existing) {
        return prev.map(item => {
            const isMatch = (item.id === product.id && !selectedSize && !item.selectedSize) ||
                            (item.id === product.id && selectedSize && item.selectedSize?.name === selectedSize.name);
            
            return isMatch ? { ...item, quantity: item.quantity + 1 } : item;
        });
      }
      return [...prev, { ...product, quantity: 1, selectedSize, price: finalPrice }];
    });
    setProductForSizeSelect(null);
  };

  const handleAddDonation = () => {
      const amount = parseFloat(donationAmount);
      if (!amount || amount <= 0) return;

      const donationItem: CartItem = {
          id: 'DONATION-' + Date.now(),
          name: t('donation'),
          price: amount,
          category: 'DONATION' as any,
          image: '',
          quantity: 1,
          isDonation: true,
          isAvailable: true
      };

      setCart(prev => [...prev, donationItem]);
      setDonationAmount('');
      setShowDonationInput(false);
  };
  
  const updateQuantityByIndex = (index: number, delta: number) => {
      setCart(prev => prev.map((item, i) => {
          if (i === index) {
              const newQty = Math.max(1, item.quantity + delta);
              return { ...item, quantity: newQty };
          }
          return item;
      }));
  };

  const removeFromCartByIndex = (index: number) => {
      setCart(prev => prev.filter((_, i) => i !== index));
  };

  // --- Financial Calculations ---
  const calculateTotal = (items: CartItem[]) => {
      const sub = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = sub * (settings.taxRate / 100);
      return sub + tax;
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const taxAmount = useMemo(() => subtotal * (settings.taxRate / 100), [subtotal, settings.taxRate]);
  const grandTotal = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  // Main Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setSplitCartItems(null); 
    setShowPaymentModal(true);
  };

  // Split Checkout Initiation
  const handleProceedSplitPayment = (selectedItems: CartItem[]) => {
      setSplitCartItems(selectedItems); 
      setShowSplitModal(false);
      setShowPaymentModal(true); 
  };

  const finalizeOrder = (method: 'CASH' | 'QR' | 'CARD') => {
    const itemsToPay = splitCartItems || cart;
    const totalToPay = calculateTotal(itemsToPay);

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 100000)}`,
      tableNumber,
      orderType, // Store the type
      customerName,
      customerPhone,
      customerAddress,
      items: [...itemsToPay],
      total: totalToPay,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      createdBy: currentUser?.name || 'Unknown',
      waiterId: selectedWaiter,
      driverId: selectedDriver,
      paymentMethod: method
    };

    addOrder(newOrder);
    
    // --- AUTO SAVE/UPDATE CUSTOMER ---
    if (orderType === 'DELIVERY' && customerPhone) {
        addOrUpdateCustomer({
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            totalOrders: 1, // Will be incremented in store logic
            lastOrderDate: new Date()
        });
    }

    setCurrentOrderForReceipt(newOrder);

    if (splitCartItems) {
        setCart(prev => {
            let newCart = [...prev];
            splitCartItems.forEach(splitItem => {
                const targetIndex = newCart.findIndex(
                    ci => ci.id === splitItem.id && 
                    ci.selectedSize?.name === splitItem.selectedSize?.name
                );
                if (targetIndex !== -1) {
                    if (newCart[targetIndex].quantity <= splitItem.quantity) {
                        newCart.splice(targetIndex, 1);
                    } else {
                        newCart[targetIndex].quantity -= splitItem.quantity;
                    }
                }
            });
            return newCart;
        });
        setSplitCartItems(null);
    } else {
        setCart([]);
    }

    if (!splitCartItems || cart.length === 0) {
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setUpsellSuggestion('');
        if (orderType === 'DINE_IN') setTableNumber('1');
        setSelectedWaiter('');
        setSelectedDriver('');
        setIsNewCustomer(false);
    }
    
    setIsMobileCartOpen(false);
  };

  // AI Upsell Effect
  useEffect(() => {
      const fetchSuggestion = async () => {
          if (cart.length > 0 && cart.length % 3 === 0) {
             const suggestion = await suggestSmartUpsell(cart);
             if (suggestion) setUpsellSuggestion(suggestion);
          } else if (cart.length === 0) {
              setUpsellSuggestion('');
          }
      }
      const timeout = setTimeout(fetchSuggestion, 1500);
      return () => clearTimeout(timeout);
  }, [cart]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] lg:h-screen overflow-hidden bg-slate-50 relative">
      
      {/* Size Selection Modal */}
      {productForSizeSelect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800">اختر الحجم</h3>
                      <button onClick={() => setProductForSizeSelect(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-4">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                              {productForSizeSelect.image && !imgErrors[productForSizeSelect.id] ? (
                                  <img 
                                    src={productForSizeSelect.image} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                    onError={() => handleImgError(productForSizeSelect.id)}
                                  />
                              ) : (
                                  <Package className="text-slate-300" size={32} />
                              )}
                          </div>
                          <div>
                              <p className="font-bold text-slate-900">{productForSizeSelect.name}</p>
                              <p className="text-xs text-slate-500">يرجى اختيار المقاس المناسب</p>
                          </div>
                      </div>
                      <div className="space-y-2">
                          {productForSizeSelect.sizes?.map((size, idx) => (
                              <button 
                                key={idx}
                                onClick={() => addToCart(productForSizeSelect, size)}
                                className="w-full p-3 flex justify-between items-center bg-white border border-slate-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
                              >
                                  <span className="font-bold text-slate-700 group-hover:text-primary-700">{size.name}</span>
                                  <span className="font-black text-slate-900">{size.price} {currency}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Donation Input Modal */}
      {showDonationInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Heart size={18} className="text-red-500" />
                          {t('donation')}
                      </h3>
                      <button onClick={() => setShowDonationInput(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-4">
                      <p className="text-xs text-slate-500 mb-2 font-bold">المبلغ المطلوب</p>
                      <div className="relative mb-4">
                          <input 
                              type="number" 
                              value={donationAmount} 
                              onChange={(e) => setDonationAmount(e.target.value)} 
                              className={`w-full p-3 ${isRTL ? 'pl-12' : 'pr-12'} bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-red-400 outline-none font-black text-lg`}
                              placeholder="0.00"
                              autoFocus
                          />
                          <span className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 font-bold`}>{currency}</span>
                      </div>
                      <button 
                          onClick={handleAddDonation}
                          className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                      >
                          {t('add')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Left Side: Menu */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <div className="p-4 lg:p-6 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 hidden md:block">{t('menu_title')}</h2>
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder={t('search_placeholder')}
                className={`w-full ${isRTL ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2.5 lg:py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 font-bold shadow-sm text-sm`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} size={18} />
            </div>
          </div>

          <div className="flex items-center gap-2">
              <button 
                  onClick={() => scrollCategories('right')} 
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hidden md:flex shrink-0"
              >
                  {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
              
              <div 
                  ref={categoryScrollRef}
                  className="flex gap-2 lg:gap-3 overflow-x-auto pb-1 custom-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 flex-1 scroll-smooth"
              >
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 lg:px-6 py-2 rounded-xl whitespace-nowrap font-bold text-sm transition-all border shrink-0 ${
                    selectedCategory === 'all' 
                      ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {t('all_category')}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 lg:px-6 py-2 rounded-xl whitespace-nowrap font-bold text-sm transition-all border shrink-0 ${
                      selectedCategory === cat 
                        ? 'bg-primary-500 border-primary-500 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-600 hover:bg-orange-50'
                    }`}
                  >
                    {cat}
                  </button>
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

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-6 bg-slate-50 pb-24 lg:pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
            {filteredProducts.map(product => {
                const inStock = checkProductStock(product);
                return (
                  <div 
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className={`bg-white p-2 md:p-3 rounded-2xl shadow-sm border border-slate-200 transition-all flex flex-col h-full relative overflow-hidden hover:shadow-lg hover:border-primary-300 cursor-pointer group transform hover:-translate-y-1 ${!inStock ? 'ring-2 ring-red-100' : ''}`}
                  >
                    {!inStock && (
                        <div className="absolute top-2 left-2 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1">
                            <AlertTriangle size={10} fill="white" />
                            {t('alert_stock_empty')}
                        </div>
                    )}

                    <div className="aspect-square rounded-xl overflow-hidden mb-2 md:mb-3 bg-slate-100 relative border border-slate-100 flex items-center justify-center">
                      {product.image && !imgErrors[product.id] ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            onError={() => handleImgError(product.id)}
                          />
                      ) : (
                          <div className="flex flex-col items-center justify-center text-slate-300">
                              <Package size={32} />
                          </div>
                      )}
                      
                      <div className={`absolute inset-0 transition-colors ${!inStock ? 'bg-red-500/10' : 'bg-black/0 group-hover:bg-black/10'}`} />
                      
                      <button className={`hidden lg:flex absolute bottom-2 ${isRTL ? 'left-2' : 'right-2'} w-10 h-10 bg-primary-500 rounded-full shadow-lg items-center justify-center text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300`}>
                        <Plus size={24} strokeWidth={3} />
                      </button>
                      
                      <div className={`lg:hidden absolute bottom-1 ${isRTL ? 'left-1' : 'right-1'} bg-primary-500 text-white p-1.5 rounded-lg shadow-sm`}>
                          <Plus size={16} strokeWidth={3} />
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                        <h3 className={`font-bold text-slate-900 mb-1 text-sm md:text-base leading-tight line-clamp-2 ${!inStock ? 'text-red-700' : ''}`}>
                            {product.name}
                        </h3>
                        
                        {product.sizes && product.sizes.length > 0 ? (
                            <div className="flex items-center gap-1 text-xs md:text-sm text-primary-600 font-bold">
                                <span>{t('item_start_from')}</span>
                                <span>{Math.min(...product.sizes.map(s => s.price))} {currency}</span>
                            </div>
                        ) : (
                            <p className="text-primary-600 font-black text-base md:text-lg">{product.price} {currency}</p>
                        )}
                        
                        {!inStock && <p className="text-[10px] text-red-500 font-bold mt-1">تنبيه: الرصيد 0</p>}
                    </div>
                  </div>
                );
            })}
          </div>
        </div>

        {/* Sticky Mobile Cart Summary */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-40 flex items-center gap-4">
             <div onClick={() => setIsMobileCartOpen(true)} className="flex-1 flex flex-col cursor-pointer">
                 <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    <ShoppingBag size={12} /> {cartCount} {t('items_count')}
                 </span>
                 <span className="text-xl font-black text-slate-900">{grandTotal.toFixed(2)} {currency}</span>
             </div>
             <button onClick={() => setIsMobileCartOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                 <span>{t('view_cart')}</span><ChevronUp size={18} />
             </button>
        </div>
      </div>

      {/* Right Side: Cart & Order Type Config */}
      <div className={`fixed lg:static inset-0 z-50 lg:z-auto bg-black/50 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none transition-all duration-300 ${isMobileCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}`}>
          <div className={`fixed lg:static bottom-0 lg:bottom-auto ${isRTL ? 'left-0 lg:left-auto' : 'right-0 lg:right-auto'} w-full lg:w-96 bg-white lg:border-r border-slate-200 flex flex-col h-[95vh] lg:h-full shadow-2xl z-50 rounded-t-3xl lg:rounded-none transition-transform duration-300 ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}`}>
            
            <div className="lg:hidden p-2 flex justify-center items-center border-b border-slate-50" onClick={() => setIsMobileCartOpen(false)}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-2"></div>
            </div>
            <div className="lg:hidden absolute top-4 left-4">
                <button onClick={() => setIsMobileCartOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
            </div>

            {/* ORDER TYPE SWITCHER */}
            <div className="p-4 lg:p-6 bg-white border-b border-slate-100 pb-2">
                <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 mb-4">
                    <button 
                        onClick={() => setOrderType('DINE_IN')}
                        className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-bold transition-all ${orderType === 'DINE_IN' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Utensils size={18} className="mb-1" />
                        {t('order_type_dinein')}
                    </button>
                    <button 
                        onClick={() => setOrderType('TAKEAWAY')}
                        className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-bold transition-all ${orderType === 'TAKEAWAY' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShoppingBag size={18} className="mb-1" />
                        {t('order_type_takeaway')}
                    </button>
                    <button 
                        onClick={() => setOrderType('DELIVERY')}
                        className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-bold transition-all ${orderType === 'DELIVERY' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Bike size={18} className="mb-1" />
                        {t('order_type_delivery')}
                    </button>
                </div>

                {/* DYNAMIC CONFIG SECTION */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in fade-in duration-300">
                    
                    {/* DINE-IN CONFIG */}
                    {orderType === 'DINE_IN' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">{t('table_number')}</span>
                                <span className="text-lg font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{tableNumber}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                                {[...Array(20)].map((_, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setTableNumber((i+1).toString())}
                                        className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${tableNumber === (i+1).toString() ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
                                    >
                                        {i+1}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <select 
                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white text-slate-900 focus:border-primary-500 outline-none appearance-none" 
                                    value={selectedWaiter} 
                                    onChange={(e) => setSelectedWaiter(e.target.value)}
                                >
                                    <option value="">{t('select_waiter')}</option>
                                    {waiters.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <User size={14} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-3 text-slate-400 pointer-events-none`} />
                            </div>
                        </div>
                    )}

                    {/* TAKEAWAY CONFIG */}
                    {orderType === 'TAKEAWAY' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('customer_name')}</label>
                            <input 
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold bg-white text-slate-900 focus:border-primary-500 outline-none"
                                placeholder="ضيف"
                            />
                        </div>
                    )}

                    {/* DELIVERY CONFIG */}
                    {orderType === 'DELIVERY' && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text"
                                        value={customerPhone}
                                        onChange={handlePhoneChange}
                                        className={`w-full p-2.5 ${isRTL ? 'pl-8' : 'pr-8'} rounded-xl border border-slate-300 text-xs font-bold bg-white focus:border-primary-500 outline-none dir-ltr`}
                                        placeholder={t('customer_phone')}
                                        dir="ltr"
                                    />
                                    <Phone size={14} className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-3 text-slate-400`} />
                                </div>
                                <div className="flex-1">
                                    <input 
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:border-primary-500 outline-none"
                                        placeholder={t('customer_name')}
                                    />
                                </div>
                            </div>
                            
                            {/* Auto-fill Indicator */}
                            {!isNewCustomer && customerPhone && (
                                <div className="text-[10px] text-green-600 font-bold flex items-center gap-1 -mt-1 px-1">
                                    <User size={10} /> {t('registered_customer')}
                                </div>
                            )}
                            {isNewCustomer && customerPhone && (
                                <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1 -mt-1 px-1">
                                    <UserPlus size={10} /> {t('new_customer')}
                                </div>
                            )}

                            <div className="relative">
                                <input 
                                    type="text"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    className={`w-full p-2.5 ${isRTL ? 'pl-8' : 'pr-8'} rounded-xl border border-slate-300 text-xs font-bold bg-white focus:border-primary-500 outline-none`}
                                    placeholder={t('customer_address')}
                                />
                                <MapPin size={14} className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-3 text-slate-400`} />
                            </div>
                            <div className="relative">
                                <select 
                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white text-slate-900 focus:border-primary-500 outline-none appearance-none" 
                                    value={selectedDriver} 
                                    onChange={(e) => setSelectedDriver(e.target.value)}
                                >
                                    <option value="">{t('select_driver')}</option>
                                    {drivers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <Truck size={14} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-3 text-slate-400 pointer-events-none`} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {upsellSuggestion && (
                <div className="mx-4 lg:mx-6 mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl flex items-start gap-3 shadow-sm animate-fade-in-up">
                    <div className="bg-white p-1.5 rounded-lg text-indigo-600 mt-0.5 shadow-sm"><Zap size={16} fill="currentColor" /></div>
                    <div>
                        <p className="text-xs font-bold text-indigo-800 mb-0.5">{t('upsell_title')}</p>
                        <p className="text-sm text-indigo-900 leading-snug">{t('upsell_desc')} <b className="underline decoration-indigo-300">{upsellSuggestion}</b>؟</p>
                    </div>
                </div>
            )}

            {/* CART ITEMS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100"><Coffee size={40} className="opacity-50" /></div>
                <p className="font-bold text-slate-400">{t('cart_empty_desc')}</p>
                </div>
            ) : (
                cart.map((item, index) => {
                    const maxStock = getProductMaxStock(item);
                    const isExceeding = !item.isDonation && item.quantity > maxStock;

                    return (
                    <div key={`${item.id}-${index}`} className={`flex flex-col p-3 bg-white rounded-xl border shadow-sm group transition-colors ${isExceeding ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-primary-100'}`}>
                        <div className="flex items-center gap-3">
                            {item.isDonation ? (
                                <div className="w-14 h-14 rounded-lg bg-red-100 flex items-center justify-center text-red-500 border border-red-200">
                                    <Heart size={24} fill="currentColor" />
                                </div>
                            ) : (item.image && !imgErrors[item.id]) ? (
                                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover border border-slate-100" onError={() => handleImgError(item.id)} />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                    <Package size={20} />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate">{item.name} {item.selectedSize && <span className="text-xs text-slate-500 block font-normal">({item.selectedSize.name})</span>}</h4>
                                <p className="text-primary-600 font-bold text-sm">{item.price * item.quantity} {currency}</p>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                <button onClick={() => updateQuantityByIndex(index, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-red-500 hover:bg-red-50"><Minus size={14} strokeWidth={3} /></button>
                                <span className="w-6 text-center font-bold text-sm text-slate-800">{item.quantity}</span>
                                <button onClick={() => updateQuantityByIndex(index, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-green-600 hover:bg-green-50"><Plus size={14} strokeWidth={3} /></button>
                            </div>
                            <button onClick={() => removeFromCartByIndex(index)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                        
                        {isExceeding && (
                            <div className="mt-2 text-[10px] text-red-600 font-bold flex items-center gap-1 bg-red-100/50 p-1.5 rounded-lg w-fit">
                                <AlertCircle size={12} />
                                {t('alert_stock_low')} ({maxStock})
                            </div>
                        )}
                    </div>
                    )
                })
            )}
            </div>

            <div className="p-4 lg:p-6 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
            <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-slate-500 font-bold text-sm"><span>{t('subtotal')}</span><span>{subtotal.toFixed(2)} {currency}</span></div>
                <div className="flex justify-between items-center text-slate-500 font-bold text-sm"><span className="flex items-center gap-1"><Receipt size={14}/> {t('tax')} ({settings.taxRate}%)</span><span>{taxAmount.toFixed(2)} {currency}</span></div>
            </div>
            
            <div className="flex justify-between items-center mb-6 pt-2 border-t border-dashed border-slate-200">
                <span className="text-xl font-black text-slate-900">{t('total')}</span>
                <span className="text-2xl font-black text-primary-600">{grandTotal.toFixed(2)} {currency}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
                <button 
                    onClick={() => setShowSplitModal(true)} 
                    className="bg-white border-2 border-slate-200 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2" 
                    disabled={cart.length === 0} 
                    title={t('split_bill')}
                >
                    <Split size={18} /> {t('split_bill')}
                </button>
                <button
                    onClick={() => setShowDonationInput(true)}
                    className="bg-red-50 border-2 border-red-100 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 flex items-center justify-center gap-2"
                    title={t('donation')}
                >
                    <Heart size={18} /> {t('donation')}
                </button>
            </div>
            <button onClick={handleOpenCheckout} disabled={cart.length === 0} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-900/20"><CreditCard size={18} /> {t('fast_pay')}</button>
            </div>
        </div>
      </div>

      {showSplitModal && (
          <SplitBillModal 
            cart={cart}
            currency={currency}
            onClose={() => setShowSplitModal(false)}
            onProceedToPay={handleProceedSplitPayment}
          />
      )}

      {showPaymentModal && (
        <InvoiceModal 
            total={splitCartItems ? calculateTotal(splitCartItems) : grandTotal} 
            currency={currency} 
            onClose={() => { 
                setShowPaymentModal(false); 
                setCurrentOrderForReceipt(null);
                setSplitCartItems(null);
            }} 
            onConfirm={finalizeOrder} 
            order={currentOrderForReceipt}
        />
      )}
    </div>
  );
};

export default POS;
