
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Order, Product, OrderStatus, AppSettings, User, Role, Ingredient, Supplier, Expense, Shift, RecipeItem, CartItem, Customer } from './types';
import { api } from './services/api';
import { translations, TranslationKey } from './translations'; // Import Translations

// --- ROBUST PERSISTENCE SYSTEM (FILE SYSTEM SUPPORT) ---
const electronStore = {
    getData: () => {
        try {
            // @ts-ignore
            if (window.require) {
                // @ts-ignore
                const fs = window.require('fs');
                // @ts-ignore
                const os = window.require('os');
                // @ts-ignore
                const path = window.require('path');
                const configPath = path.join(os.homedir(), '.maidah_pos_config.json');
                if (fs.existsSync(configPath)) {
                    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
                }
            }
        } catch (e) { console.error("Electron Store Read Error", e); }
        return null;
    },
    setData: (data: any) => {
        try {
            // @ts-ignore
            if (window.require) {
                // @ts-ignore
                const fs = window.require('fs');
                // @ts-ignore
                const os = window.require('os');
                // @ts-ignore
                const path = window.require('path');
                const configPath = path.join(os.homedir(), '.maidah_pos_config.json');
                fs.writeFileSync(configPath, JSON.stringify(data));
            }
        } catch (e) { console.error("Electron Store Write Error", e); }
    }
};

// --- CRITICAL: FIXED DEVICE ID SYSTEM ---
const SYSTEM_ID_KEY = 'sales_system_static_id_v3';

const initializeDeviceId = () => {
    const fileData = electronStore.getData();
    if (fileData && fileData.deviceId) {
        try { localStorage.setItem(SYSTEM_ID_KEY, fileData.deviceId); } catch {}
        return fileData.deviceId;
    }

    let id = '';
    try {
        id = localStorage.getItem(SYSTEM_ID_KEY) || '';
    } catch (e) { console.error("Storage Access Error", e); }

    if (!id) {
        try {
            const oldSettings = localStorage.getItem('pos_settings');
            if (oldSettings) {
                const parsed = JSON.parse(oldSettings);
                if (parsed.deviceId) id = parsed.deviceId;
            }
        } catch (e) { console.error("Legacy Recovery Error", e); }
    }

    if (!id) {
        id = 'OPEN-VER-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    try {
        localStorage.setItem(SYSTEM_ID_KEY, id);
    } catch (e) { console.error("Persistence Error", e); }

    return id;
};

const STATIC_DEVICE_ID = initializeDeviceId();

// --- INITIAL DATA ---
const INITIAL_CATEGORIES = [
    'Hot Drinks',
    'Cold Drinks',
    'Main Dishes',
    'Desserts',
    'Appetizers'
];

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Espresso', price: 25, category: 'Hot Drinks', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', sizes: [{name: 'Single', price: 25}, {name: 'Double', price: 35}], isAvailable: true, prepTime: 5, calories: 10 },
  { id: '2', name: 'Chicken Burger', price: 95, category: 'Main Dishes', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', isAvailable: true, prepTime: 15, calories: 450 },
];

const INITIAL_INGREDIENTS: Ingredient[] = [
    { id: 'ing-1', name: 'Coffee Beans', unit: 'kg', costPerUnit: 400, currentStock: 5, minStockLevel: 1 },
    { id: 'ing-2', name: 'Milk', unit: 'liter', costPerUnit: 35, currentStock: 20, minStockLevel: 5 },
    { id: 'ing-3', name: 'Burger Bun', unit: 'piece', costPerUnit: 5, currentStock: 100, minStockLevel: 20 },
    { id: 'ing-4', name: 'Chicken Breast', unit: 'kg', costPerUnit: 180, currentStock: 10, minStockLevel: 2 },
];

// --- OPEN SYSTEM SETTINGS ---
const INITIAL_SETTINGS: AppSettings = {
  restaurantName: 'Restaurant / Cafe Name',
  logo: '', address: 'Address Here', phone: '000000000', currency: 'EGP', taxRate: 14,
  printerWidth: '80mm', autoPrint: false, receiptHeader: 'Welcome', receiptFooter: 'Thank you for visiting!',
  deviceId: STATIC_DEVICE_ID,
  isActivated: true, 
  licenseExpiryDate: '2099-12-31T23:59:59.999Z', 
  defaultStartCash: 0,
  costPercentageDanger: 45,
  costPercentageHigh: 35,
  costPercentageIdeal: 28,
  language: 'en'
};

// REMOVED INITIAL USERS - The system now starts empty
const INITIAL_USERS: User[] = [];

interface AppContextType {
  categories: string[];
  products: Product[];
  orders: Order[];
  ingredients: Ingredient[];
  suppliers: Supplier[];
  expenses: Expense[];
  shifts: Shift[];
  currentShift: Shift | null;
  customers: Customer[];
  
  settings: AppSettings;
  currency: string;
  currentUser: User | null;
  users: User[];
  isSystemInitialized: boolean;
  
  isOnline: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string) => void;
  
  addCategory: (category: string) => void;
  updateCategory: (oldName: string, newName: string) => void;
  deleteCategory: (category: string) => void;

  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateIngredient: (ingredient: Ingredient) => void;
  addIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  addSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  calculateProductCost: (recipe: RecipeItem[]) => number;
  checkProductStock: (product: Product | CartItem) => boolean;
  getProductMaxStock: (product: Product | CartItem) => number;
  
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  startShift: (startCash: number) => void;
  endShift: (endCash: number) => void;
  
  addOrUpdateCustomer: (customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  updateSettings: (newSettings: AppSettings) => void;
  resetSystem: () => void;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  addUser: (user: User) => boolean;
  updateUser: (user: User) => boolean;
  deleteUser: (id: string) => void;
  activateSystem: (key: string) => Promise<{ success: boolean; message: string }>;
  checkLicense: () => boolean;
  
  // Translation Function
  t: (key: TranslationKey) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- STATE INITIALIZATION ---
  
  const [categories, setCategories] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('pos_categories') || JSON.stringify(INITIAL_CATEGORIES)); } 
      catch { return INITIAL_CATEGORIES; }
  });

  const [products, setProducts] = useState<Product[]>(() => {
      try { return JSON.parse(localStorage.getItem('pos_products') || JSON.stringify(INITIAL_PRODUCTS)); } 
      catch { return INITIAL_PRODUCTS; }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
      try {
          const saved = localStorage.getItem('pos_orders');
          return saved ? JSON.parse(saved).map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) })) : [];
      } catch { return []; }
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
      try { return JSON.parse(localStorage.getItem('pos_ingredients') || JSON.stringify(INITIAL_INGREDIENTS)); }
      catch { return INITIAL_INGREDIENTS; }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
      try { return JSON.parse(localStorage.getItem('pos_suppliers') || '[]'); }
      catch { return []; }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
      try {
          const saved = localStorage.getItem('pos_customers');
          return saved ? JSON.parse(saved).map((c: any) => ({ ...c, lastOrderDate: new Date(c.lastOrderDate) })) : [];
      } catch { return []; }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
      try {
          const saved = localStorage.getItem('pos_expenses');
          return saved ? JSON.parse(saved).map((e: any) => ({ ...e, date: new Date(e.date) })) : [];
      } catch { return []; }
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
      try {
          const saved = localStorage.getItem('pos_shifts');
          return saved ? JSON.parse(saved).map((s: any) => ({ ...s, startTime: new Date(s.startTime), endTime: s.endTime ? new Date(s.endTime) : undefined })) : [];
      } catch { return []; }
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
      const fileData = electronStore.getData();
      let loadedSettings = { ...INITIAL_SETTINGS, deviceId: STATIC_DEVICE_ID };

      if (fileData && fileData.settings) {
          loadedSettings = { ...INITIAL_SETTINGS, ...fileData.settings, deviceId: STATIC_DEVICE_ID };
      } else {
          try {
              const saved = localStorage.getItem('pos_settings');
              if (saved) {
                  const parsed = JSON.parse(saved);
                  loadedSettings = { ...INITIAL_SETTINGS, ...parsed, deviceId: STATIC_DEVICE_ID };
              }
          } catch (e) { console.error("Settings load error", e); }
      }
      
      // Ensure language is set if missing from old config, default to English
      if (!loadedSettings.language) loadedSettings.language = 'en';

      // CRITICAL: Apply direction immediately during initialization for persistence
      document.documentElement.lang = loadedSettings.language;
      document.documentElement.dir = loadedSettings.language === 'ar' ? 'rtl' : 'ltr';

      return loadedSettings;
  });

  const [users, setUsers] = useState<User[]>(() => {
      try { return JSON.parse(localStorage.getItem('pos_users') || '[]'); }
      catch { return []; }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      try { return JSON.parse(localStorage.getItem('pos_current_user') || 'null'); }
      catch { return null; }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const currentShift = shifts.find(s => s.status === 'OPEN') || null;
  const isSystemInitialized = users.length > 0;

  useEffect(() => { localStorage.setItem('pos_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('pos_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('pos_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('pos_ingredients', JSON.stringify(ingredients)); }, [ingredients]);
  useEffect(() => { localStorage.setItem('pos_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('pos_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('pos_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('pos_shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem('pos_users', JSON.stringify(users)); }, [users]);
  
  useEffect(() => { 
      // Force settings to remain activated during save
      const safeSettings = { 
          ...settings, 
          deviceId: STATIC_DEVICE_ID, 
          isActivated: true,
          licenseExpiryDate: '2099-12-31T23:59:59.999Z'
      };
      localStorage.setItem('pos_settings', JSON.stringify(safeSettings));
      localStorage.setItem(SYSTEM_ID_KEY, STATIC_DEVICE_ID);
      
      electronStore.setData({
          deviceId: STATIC_DEVICE_ID,
          settings: safeSettings,
          lastUpdated: new Date().toISOString()
      });

      // --- DYNAMIC DIRECTION HANDLING ---
      document.documentElement.lang = settings.language;
      document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';

  }, [settings]);

  useEffect(() => { 
      if(currentUser) localStorage.setItem('pos_current_user', JSON.stringify(currentUser));
      else localStorage.removeItem('pos_current_user');
  }, [currentUser]);

  // --- ACTIONS ---
  
  // Translation Helper
  const t = (key: TranslationKey): string => {
      const lang = settings.language || 'en';
      return translations[lang][key] || key;
  };

  const addCategory = (category: string) => {
      if (!categories.includes(category)) {
          setCategories(prev => [...prev, category]);
      }
  };

  const updateCategory = (oldName: string, newName: string) => {
      setCategories(prev => prev.map(c => c === oldName ? newName : c));
      setProducts(prev => prev.map(p => p.category === oldName ? { ...p, category: newName } : p));
  };

  const deleteCategory = (category: string) => {
      setCategories(prev => prev.filter(c => c !== category));
  };

  const calculateProductCost = (recipe: RecipeItem[]) => {
      return recipe.reduce((total, item) => {
          const ing = ingredients.find(i => i.id === item.ingredientId);
          return total + (ing ? ing.costPerUnit * item.quantity : 0);
      }, 0);
  };

  const getApplicableRecipeItems = (product: Product | CartItem) => {
      if (!product.recipe || product.recipe.length === 0) return [];
      const cartItem = product as CartItem;
      const sizeName = cartItem.selectedSize?.name;
      if (sizeName) {
          return product.recipe.filter(r => r.sizeName === sizeName || !r.sizeName);
      } else {
          return product.recipe.filter(r => !r.sizeName);
      }
  };

  const checkProductStock = useCallback((product: Product | CartItem): boolean => {
      if (product.isAvailable === false) return false;
      const applicableRecipe = getApplicableRecipeItems(product);
      if (applicableRecipe.length === 0) return true;

      for (const item of applicableRecipe) {
          const ingredient = ingredients.find(i => i.id === item.ingredientId);
          if (!ingredient || ingredient.currentStock < item.quantity) {
              return false; 
          }
      }
      return true;
  }, [ingredients]);

  const getProductMaxStock = useCallback((product: Product | CartItem): number => {
      const applicableRecipe = getApplicableRecipeItems(product);
      if (applicableRecipe.length === 0) return 9999;
      
      let maxPossible = 9999;
      for (const item of applicableRecipe) {
          const ingredient = ingredients.find(i => i.id === item.ingredientId);
          if (!ingredient) return 0;
          if (item.quantity > 0) {
              const possibleWithThisIngredient = Math.floor(ingredient.currentStock / item.quantity);
              if (possibleWithThisIngredient < maxPossible) {
                  maxPossible = possibleWithThisIngredient;
              }
          }
      }
      return Math.max(0, maxPossible);
  }, [ingredients]);

  const deductIngredients = useCallback((cartItems: CartItem[]) => {
      setIngredients(prevIngredients => {
          const newIngredients = prevIngredients.map(i => ({...i}));
          cartItems.forEach(cartItem => {
              const applicableRecipe = getApplicableRecipeItems(cartItem);
              if (applicableRecipe) {
                  applicableRecipe.forEach((rItem: RecipeItem) => {
                      const ingIndex = newIngredients.findIndex(i => i.id === rItem.ingredientId);
                      if (ingIndex > -1) {
                          newIngredients[ingIndex].currentStock -= (rItem.quantity * cartItem.quantity);
                      }
                  });
              }
          });
          return newIngredients;
      });
  }, []);

  const restoreIngredients = useCallback((cartItems: CartItem[]) => {
      setIngredients(prevIngredients => {
          const newIngredients = prevIngredients.map(i => ({...i}));
          cartItems.forEach(cartItem => {
              const applicableRecipe = getApplicableRecipeItems(cartItem);
              if (applicableRecipe) {
                  applicableRecipe.forEach((rItem: RecipeItem) => {
                      const ingIndex = newIngredients.findIndex(i => i.id === rItem.ingredientId);
                      if (ingIndex > -1) {
                          newIngredients[ingIndex].currentStock += (rItem.quantity * cartItem.quantity);
                      }
                  });
              }
          });
          return newIngredients;
      });
  }, []);

  const addOrder = (order: Order) => {
    deductIngredients(order.items);
    const activeShift = shifts.find(s => s.status === 'OPEN');
    if (activeShift) {
        order.shiftId = activeShift.id;
    }
    setOrders(prev => [order, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const cancelOrder = (orderId: string) => {
      const targetOrder = orders.find(o => o.id === orderId);
      if (!targetOrder) return;
      if (targetOrder.status === OrderStatus.CANCELLED) return;

      restoreIngredients(targetOrder.items);

      setOrders(prevOrders => prevOrders.map(o => {
          if (o.id === orderId) {
              return { ...o, status: OrderStatus.CANCELLED, createdAt: new Date(o.createdAt.getTime()) }; 
          }
          return o;
      }));
  };

  const addProduct = (product: Product) => setProducts(prev => [product, ...prev]);
  const updateProduct = (product: Product) => setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  
  const addIngredient = (ing: Ingredient) => setIngredients(prev => [...prev, ing]);
  const updateIngredient = (ing: Ingredient) => setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i));
  const deleteIngredient = (id: string) => setIngredients(prev => prev.filter(i => i.id !== id));

  const addSupplier = (s: Supplier) => setSuppliers(prev => [...prev, s]);
  const deleteSupplier = (id: string) => setSuppliers(prev => prev.filter(s => s.id !== id));

  const addOrUpdateCustomer = (customerData: Partial<Customer>) => {
      if (!customerData.phone) return;
      
      setCustomers(prev => {
          const existingIndex = prev.findIndex(c => c.phone === customerData.phone);
          if (existingIndex > -1) {
              const updatedCustomers = [...prev];
              updatedCustomers[existingIndex] = {
                  ...updatedCustomers[existingIndex],
                  ...customerData,
                  totalOrders: (updatedCustomers[existingIndex].totalOrders || 0) + (customerData.totalOrders || 0),
                  lastOrderDate: customerData.lastOrderDate || updatedCustomers[existingIndex].lastOrderDate
              };
              return updatedCustomers;
          } else {
              const newCustomer: Customer = {
                  id: customerData.id || `cust-${Date.now()}`,
                  name: customerData.name || 'New Customer',
                  phone: customerData.phone!,
                  address: customerData.address || '',
                  totalOrders: customerData.totalOrders || 1,
                  lastOrderDate: customerData.lastOrderDate || new Date(),
                  notes: customerData.notes || ''
              };
              return [newCustomer, ...prev];
          }
      });
  };

  const deleteCustomer = (id: string) => {
      setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const addExpense = (expense: Expense) => setExpenses(prev => [expense, ...prev]);
  const updateExpense = (expense: Expense) => setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
  const deleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  const startShift = (startCash: number) => {
      if (shifts.some(s => s.status === 'OPEN')) return; 
      const newShift: Shift = {
          id: `SH-${Date.now()}`,
          userId: currentUser?.id || 'unknown',
          userName: currentUser?.name || 'Unknown',
          startTime: new Date(),
          startCash,
          status: 'OPEN'
      };
      setShifts(prev => [newShift, ...prev]);
  };

  const endShift = (endCash: number) => {
      const activeShiftIndex = shifts.findIndex(s => s.status === 'OPEN');
      if (activeShiftIndex === -1) return; 

      const activeShift = shifts[activeShiftIndex];
      const shiftOrders = orders.filter(o => o.shiftId === activeShift.id && o.status !== OrderStatus.CANCELLED);
      const cashSales = shiftOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
      const cardSales = shiftOrders.filter(o => o.paymentMethod === 'QR' || o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.total, 0);
      const totalSales = cashSales + cardSales;
      const shiftExpenses = expenses.filter(e => e.shiftId === activeShift.id);
      const totalExpenses = shiftExpenses.reduce((sum, e) => sum + e.amount, 0);
      const systemCash = activeShift.startCash + cashSales - totalExpenses;
      const difference = endCash - systemCash;

      const closedShift: Shift = {
          ...activeShift,
          endTime: new Date(),
          endCash,
          systemCash,
          difference,
          status: 'CLOSED',
          stats: { totalSales, cashSales, cardSales, expensesTotal: totalExpenses }
      };

      const newShifts = [...shifts];
      newShifts[activeShiftIndex] = closedShift;
      setShifts(newShifts);
  };

  const updateSettings = (s: AppSettings) => setSettings(s);
  
  const login = (username: string, pass: string): boolean => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === pass);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };
  
  const logout = () => setCurrentUser(null);
  
  const addUser = (user: User): boolean => {
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) return false;
    setUsers(prev => [...prev, user]);
    return true;
  };
  
  const updateUser = (user: User): boolean => {
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase() && u.id !== user.id)) return false;
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    if (currentUser && currentUser.id === user.id) setCurrentUser(user);
    return true;
  };
  
  const deleteUser = (id: string) => {
      if (users.length <= 1) return;
      setUsers(prev => prev.filter(u => u.id !== id));
  };

  const resetSystem = () => {
    const preservedId = STATIC_DEVICE_ID;
    
    localStorage.clear(); 
    localStorage.setItem(SYSTEM_ID_KEY, preservedId);
    
    // Default Open Settings on Reset
    const preservedSettings: AppSettings = {
        ...INITIAL_SETTINGS,
        deviceId: preservedId,
        isActivated: true,
        licenseExpiryDate: '2099-12-31T23:59:59.999Z',
        language: 'en'
    };
    
    localStorage.setItem('pos_settings', JSON.stringify(preservedSettings));

    electronStore.setData({
        deviceId: preservedId,
        settings: preservedSettings,
        lastUpdated: new Date().toISOString()
    });

    window.location.reload();
  };

  // Deprecated but kept for type compatibility
  const activateSystem = async (key: string) => {
      return { success: true, message: 'Free Version' };
  };

  const checkLicense = () => true; // Always Valid

  const toggleSidebar = () => setIsSidebarCollapsed(p => !p);
  const toggleMobileMenu = () => setIsMobileMenuOpen(p => !p);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <AppContext.Provider value={{ 
      categories, products, orders, ingredients, suppliers, expenses, shifts, currentShift, customers,
      settings, currency: settings.currency, currentUser, users, isSystemInitialized, isOnline,
      isSidebarCollapsed, isMobileMenuOpen, toggleSidebar, toggleMobileMenu, closeMobileMenu,
      addOrder, updateOrderStatus, cancelOrder,
      addCategory, updateCategory, deleteCategory,
      addProduct, updateProduct, deleteProduct, addIngredient, updateIngredient, deleteIngredient, 
      addSupplier, deleteSupplier, calculateProductCost, checkProductStock, getProductMaxStock,
      addExpense, updateExpense, deleteExpense, startShift, endShift,
      addOrUpdateCustomer, deleteCustomer,
      updateSettings, resetSystem, login, logout, addUser, updateUser, deleteUser, activateSystem, checkLicense,
      t // Expose Translation Function
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useStore must be used within an AppProvider');
  return context;
};
