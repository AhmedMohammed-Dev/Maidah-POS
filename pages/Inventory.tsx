

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Ingredient, Product, Supplier } from '../types';
import { 
    Package, Plus, Search, Scale, Trash2, Truck, AlertTriangle, 
    TrendingDown, X, TrendingUp, ChevronRight, PieChart as PieIcon,
    AlertCircle, Save, Edit,
    DollarSign, ListChecks, ChefHat, Info, ArrowRightLeft,
    Target, Phone, UserSquare, Settings2, PenSquare, Tag, Calculator, Layers, Contact, Briefcase, User, CheckCircle2, Maximize2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const Inventory = () => {
    const { 
        ingredients, addIngredient, deleteIngredient, updateIngredient,
        products, updateProduct, calculateProductCost, 
        suppliers, addSupplier, deleteSupplier,
        currency, settings, t
    } = useStore();
    
    const [activeTab, setActiveTab] = useState<'STOCK' | 'RECIPE' | 'SUPPLIERS'>('STOCK');
    
    // --- STATE: Ingredients Management (Add/Edit) ---
    const [showIngModal, setShowIngModal] = useState(false);
    const [editingIngId, setEditingIngId] = useState<string | null>(null);
    const [newIngName, setNewIngName] = useState('');
    const [newIngUnit, setNewIngUnit] = useState('kg');
    const [newIngCost, setNewIngCost] = useState('');
    const [newIngStock, setNewIngStock] = useState(''); // Only used for new items
    const [newIngMinStock, setNewIngMinStock] = useState('5');

    // --- STATE: Stock Actions (Restock/Waste) ---
    const [showStockActionModal, setShowStockActionModal] = useState(false);
    const [selectedIngForAction, setSelectedIngForAction] = useState<Ingredient | null>(null);
    const [actionType, setActionType] = useState<'RESTOCK' | 'WASTE'>('RESTOCK');
    const [actionAmount, setActionAmount] = useState('');
    
    // --- STATE: Search ---
    const [searchIng, setSearchIng] = useState('');
    const [searchProd, setSearchProd] = useState('');
    const [searchSup, setSearchSup] = useState('');

    // --- STATE: Recipes ---
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [recipeIngId, setRecipeIngId] = useState('');
    const [recipeQty, setRecipeQty] = useState('');
    const [useSmallUnit, setUseSmallUnit] = useState(true);
    const [activeSize, setActiveSize] = useState<string>(''); // Currently selected size for editing recipe

    // --- STATE: Suppliers ---
    const [editingSupId, setEditingSupId] = useState<string | null>(null);
    const [newSupName, setNewSupName] = useState('');
    const [newSupPhone, setNewSupPhone] = useState('');
    const [newSupContact, setNewSupContact] = useState('');

    // Update active size when product changes
    useEffect(() => {
        if (selectedProduct) {
            if (selectedProduct.sizes && selectedProduct.sizes.length > 0) {
                setActiveSize(selectedProduct.sizes[0].name);
            } else {
                setActiveSize('');
            }
        }
    }, [selectedProduct]);

    // --- CALCULATIONS ---
    const stockStats = useMemo(() => {
        const totalItems = ingredients.length;
        const totalValue = ingredients.reduce((sum, ing) => sum + (ing.currentStock * ing.costPerUnit), 0);
        const lowStockItems = ingredients.filter(ing => ing.currentStock <= ing.minStockLevel);
        return { totalItems, totalValue, lowStockItems };
    }, [ingredients]);

    const filteredIngredients = ingredients.filter(ing => 
        ing.name.toLowerCase().includes(searchIng.toLowerCase())
    );

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchProd.toLowerCase())
    );

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchSup.toLowerCase()) ||
        s.contactPerson?.toLowerCase().includes(searchSup.toLowerCase()) ||
        s.phone.includes(searchSup)
    );

    const selectedRecipeIngredient = useMemo(() => 
        ingredients.find(i => i.id === recipeIngId), 
    [recipeIngId, ingredients]);

    // Helpers
    const getUnitLabel = (unit: string, small: boolean) => {
        if (unit === 'kg') return small ? 'g' : 'kg';
        if (unit === 'liter') return small ? 'ml' : 'L';
        return unit; 
    };

    const convertQtyToStockUnit = (qty: number, unit: string, isSmall: boolean) => {
        if (!isSmall) return qty;
        if (unit === 'kg' || unit === 'liter') return qty / 1000;
        return qty;
    };

    const formatDisplayQty = (qty: number, unit: string) => {
        if ((unit === 'kg' || unit === 'liter') && qty < 1) {
            return `${(qty * 1000).toFixed(0)} ${unit === 'kg' ? 'g' : 'ml'}`;
        }
        return `${qty} ${unit}`;
    };

    // Recipe Analysis (Size Aware)
    const recipeAnalysis = useMemo(() => {
        if (!selectedProduct) return null;
        
        // Filter recipe items by current activeSize
        const recipeItems = (selectedProduct.recipe || []).filter(item => {
            if (activeSize) return item.sizeName === activeSize;
            return !item.sizeName; // If no active size (standard product), show items with no sizeName
        });

        const totalCost = calculateProductCost(recipeItems);
        
        // Get price for the selected size
        let sellingPrice = selectedProduct.price;
        if (activeSize && selectedProduct.sizes) {
            const sizeObj = selectedProduct.sizes.find(s => s.name === activeSize);
            if (sizeObj) sellingPrice = sizeObj.price;
        }

        const profit = sellingPrice - totalCost;
        const costPercentage = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;
        
        // Use settings for thresholds
        const danger = settings.costPercentageDanger || 45;
        const high = settings.costPercentageHigh || 35;
        const ideal = settings.costPercentageIdeal || 28;

        let status = { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300' };
        
        if (costPercentage > danger) {
            status = { label: 'Danger', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' };
        } else if (costPercentage > high) {
            status = { label: 'High', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300' };
        } else if (costPercentage > ideal) {
            status = { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' };
        }

        const chartData = recipeItems.map(item => {
            const ing = ingredients.find(i => i.id === item.ingredientId);
            const cost = ing ? (item.quantity * ing.costPerUnit) : 0;
            return {
                name: ing?.name || 'Unknown',
                value: cost,
                unitCost: ing?.costPerUnit,
                qty: item.quantity,
                unit: ing?.unit || '',
                displayQty: ing ? formatDisplayQty(item.quantity, ing.unit) : ''
            };
        }).filter(d => d.value > 0);

        chartData.sort((a, b) => b.value - a.value);

        return { totalCost, sellingPrice, profit, costPercentage, chartData, status, recipeItems };
    }, [selectedProduct, ingredients, settings, activeSize]);

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899'];

    // --- HANDLERS ---

    const openCreateModal = () => {
        setEditingIngId(null);
        setNewIngName('');
        setNewIngUnit('kg');
        setNewIngCost('');
        setNewIngStock('');
        setNewIngMinStock('5');
        setShowIngModal(true);
    };

    const openEditModal = (ing: Ingredient) => {
        setEditingIngId(ing.id);
        setNewIngName(ing.name);
        setNewIngUnit(ing.unit);
        setNewIngCost(ing.costPerUnit.toString());
        setNewIngMinStock(ing.minStockLevel.toString());
        setNewIngStock(ing.currentStock.toString());
        setShowIngModal(true);
    };

    const handleSaveIngredient = () => {
        if (!newIngName || !newIngCost) return;

        const cost = parseFloat(newIngCost);
        const minStock = parseFloat(newIngMinStock) || 0;

        if (editingIngId) {
            const existingIng = ingredients.find(i => i.id === editingIngId);
            if (existingIng) {
                updateIngredient({
                    ...existingIng,
                    name: newIngName,
                    unit: newIngUnit,
                    costPerUnit: cost,
                    minStockLevel: minStock
                });
            }
        } else {
            const initialStock = parseFloat(newIngStock) || 0;
            addIngredient({
                id: `ing-${Date.now()}`,
                name: newIngName,
                unit: newIngUnit,
                costPerUnit: cost,
                currentStock: initialStock,
                minStockLevel: minStock
            });
        }
        setShowIngModal(false);
    };

    const openStockAction = (ing: Ingredient, type: 'RESTOCK' | 'WASTE') => {
        setSelectedIngForAction(ing);
        setActionType(type);
        setActionAmount('');
        setShowStockActionModal(true);
    };

    const handleExecuteStockAction = () => {
        if (!selectedIngForAction || !actionAmount) return;
        
        const amount = parseFloat(actionAmount);
        if (isNaN(amount) || amount < 0) return;

        let updatedIng = { ...selectedIngForAction };

        if (actionType === 'RESTOCK') {
            updatedIng.currentStock += amount;
        } else if (actionType === 'WASTE') {
            updatedIng.currentStock = Math.max(0, updatedIng.currentStock - amount);
        }

        updateIngredient(updatedIng);
        setShowStockActionModal(false);
    };

    const handleSaveSupplier = () => {
        if (!newSupName) return;

        if (editingSupId) {
            deleteSupplier(editingSupId);
            addSupplier({
                id: editingSupId,
                name: newSupName,
                phone: newSupPhone,
                contactPerson: newSupContact
            });
            setEditingSupId(null);
        } else {
            addSupplier({
                id: `sup-${Date.now()}`,
                name: newSupName,
                phone: newSupPhone,
                contactPerson: newSupContact
            });
        }
        setNewSupName(''); setNewSupPhone(''); setNewSupContact('');
    };

    const handleEditSupplier = (sup: Supplier) => {
        setEditingSupId(sup.id);
        setNewSupName(sup.name);
        setNewSupPhone(sup.phone);
        setNewSupContact(sup.contactPerson || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelSupEdit = () => {
        setEditingSupId(null);
        setNewSupName(''); setNewSupPhone(''); setNewSupContact('');
    };

    const handleAddToRecipe = () => {
        if (!selectedProduct || !recipeIngId || !recipeQty || !selectedRecipeIngredient) return;
        
        // Check duplicate for this specific size
        const exists = selectedProduct.recipe?.some(r => r.ingredientId === recipeIngId && r.sizeName === activeSize);
        if (exists) {
            alert('Duplicate ingredient for this size');
            return;
        }

        const finalQty = convertQtyToStockUnit(parseFloat(recipeQty), selectedRecipeIngredient.unit, useSmallUnit);
        
        // Create new item with sizeName if activeSize is set
        const newItem = { 
            ingredientId: recipeIngId, 
            quantity: finalQty,
            sizeName: activeSize || undefined
        };

        const newRecipe = [...(selectedProduct.recipe || []), newItem];
        updateProduct({ ...selectedProduct, recipe: newRecipe });
        setSelectedProduct({ ...selectedProduct, recipe: newRecipe }); 
        setRecipeQty('');
    };

    const handleRemoveFromRecipe = (ingId: string) => {
        if (!selectedProduct) return;
        // Remove item matching id AND activeSize
        const newRecipe = selectedProduct.recipe?.filter(r => !(r.ingredientId === ingId && (r.sizeName === activeSize || (!r.sizeName && !activeSize)))) || [];
        updateProduct({ ...selectedProduct, recipe: newRecipe });
        setSelectedProduct({ ...selectedProduct, recipe: newRecipe });
    };

    const inputClass = "w-full p-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-0 outline-none transition-all font-bold text-sm shadow-sm hover:border-slate-400";

    return (
        <div className="p-4 lg:p-8 min-h-screen bg-slate-100 pb-20 font-sans">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Package className="text-blue-600" size={32} />
                        {t('inv_page_title')}
                    </h1>
                    <p className="text-slate-600 font-bold mt-2 text-sm">{t('inv_desc')}</p>
                </div>
                
                {/* Stats Bar */}
                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2">
                    <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 min-w-fit">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">{t('kpi_inventory_value')}</p>
                            <p className="text-lg font-black text-slate-900">{stockStats.totalValue.toFixed(0)} {currency}</p>
                        </div>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 min-w-fit">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                            <Package size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">{t('items_count')}</p>
                            <p className="text-lg font-black text-slate-900">{stockStats.totalItems}</p>
                        </div>
                    </div>
                    {stockStats.lowStockItems.length > 0 && (
                        <div className="bg-red-50 px-5 py-3 rounded-2xl border-2 border-red-200 shadow-sm flex items-center gap-3 min-w-fit animate-pulse">
                            <div className="p-2 bg-red-200 text-red-800 rounded-lg">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-red-600 font-bold uppercase">{t('alert_stock_low')}</p>
                                <p className="text-lg font-black text-red-800">{stockStats.lowStockItems.length}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-300 shadow-sm w-full md:w-fit mb-8 flex overflow-x-auto gap-2">
                {[
                    { id: 'STOCK', label: t('inv_tab_stock'), icon: Package },
                    { id: 'RECIPE', label: t('inv_tab_recipe'), icon: Scale },
                    { id: 'SUPPLIERS', label: t('inv_tab_suppliers'), icon: Truck }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)} 
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap border-2 ${
                            activeTab === tab.id 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                            : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-800'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* --- TAB: STOCK MANAGEMENT --- */}
            {activeTab === 'STOCK' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                         <div className="relative flex-1 max-w-md">
                             <input 
                                type="text" 
                                placeholder={t('inv_search_ing')} 
                                value={searchIng}
                                onChange={(e) => setSearchIng(e.target.value)}
                                className="w-full pl-4 pr-12 py-3.5 rounded-2xl border-2 border-slate-300 bg-white focus:border-blue-600 outline-none font-bold text-sm shadow-sm text-slate-900"
                             />
                             <Search className="absolute right-4 top-3.5 text-slate-500" size={20} />
                         </div>
                         <button 
                            onClick={openCreateModal} 
                            className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                         >
                             <Plus size={20} />
                             <span>{t('inv_add_ing')}</span>
                         </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-300 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-black tracking-wider border-b-2 border-slate-200">
                                    <tr>
                                        <th className="px-6 py-5">{t('inv_col_name')}</th>
                                        <th className="px-6 py-5">{t('inv_col_cost')}</th>
                                        <th className="px-6 py-5">{t('inv_col_stock')}</th>
                                        <th className="px-6 py-5">{t('inv_col_value')}</th>
                                        <th className="px-6 py-5 text-center">{t('inv_col_actions')}</th>
                                        <th className="px-6 py-5 text-center">{t('edit')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredIngredients.map(ing => {
                                        const isLow = ing.currentStock <= ing.minStockLevel;
                                        return (
                                            <tr key={ing.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="block font-black text-slate-900 text-base">{ing.name}</span>
                                                    <span className="text-xs text-slate-500 font-bold">1 {ing.unit}</span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-700">{ing.costPerUnit} {currency}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1.5 rounded-lg font-black text-sm border ${isLow ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                                                            {ing.currentStock}
                                                        </span>
                                                        {isLow && <AlertTriangle size={18} className="text-red-600 animate-pulse" />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-black text-slate-900">{(ing.currentStock * ing.costPerUnit).toFixed(1)} {currency}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openStockAction(ing, 'RESTOCK')} className="flex items-center gap-1 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors border border-emerald-300">
                                                            <Plus size={16} /> {t('inv_btn_restock')}
                                                        </button>
                                                        <button onClick={() => openStockAction(ing, 'WASTE')} className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors border border-red-300">
                                                            <TrendingDown size={16} /> {t('inv_btn_waste')}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditModal(ing)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><PenSquare size={18} /></button>
                                                        <button onClick={() => deleteIngredient(ing.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: MENU ENGINEERING --- */}
            {activeTab === 'RECIPE' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[calc(100vh-200px)] animate-in slide-in-from-bottom-4 duration-300">
                    
                    {/* LEFT: Product Selection */}
                    <div className="lg:col-span-3 flex flex-col h-[600px] lg:h-full bg-white rounded-[2.5rem] border border-slate-300 shadow-xl overflow-hidden">
                        <div className="p-6 bg-slate-900 text-white">
                            <h3 className="font-black text-lg flex items-center gap-2 mb-4">
                                <ChefHat size={20} className="text-yellow-400" />
                                {t('products')}
                            </h3>
                            <div className="relative">
                                <input 
                                    value={searchProd} 
                                    onChange={e => setSearchProd(e.target.value)} 
                                    placeholder={t('search_placeholder')}
                                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder:text-slate-400 focus:border-yellow-500 outline-none font-bold text-sm" 
                                />
                                <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2 bg-slate-100">
                            {filteredProducts.map(p => {
                                const hasRecipe = p.recipe && p.recipe.length > 0;
                                return (
                                    <div 
                                        key={p.id} 
                                        onClick={() => setSelectedProduct(p)} 
                                        className={`p-4 rounded-2xl cursor-pointer flex justify-between items-center transition-all group border-2 ${selectedProduct?.id === p.id ? 'bg-white shadow-md border-yellow-500' : 'bg-white border-transparent hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                {p.image ? (
                                                    <img src={p.image} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package size={20} className="text-slate-400" />
                                                )}
                                                {hasRecipe && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white z-10"></div>}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`font-black text-sm truncate max-w-[110px] ${selectedProduct?.id === p.id ? 'text-slate-900' : 'text-slate-700'}`}>{p.name}</p>
                                                <p className="text-xs text-slate-500 font-bold">{p.price} {currency}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className={`text-slate-400 transition-transform ${selectedProduct?.id === p.id ? 'rotate-180 text-yellow-600' : 'group-hover:text-slate-600'}`} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: Workspace */}
                    <div className="lg:col-span-9 flex flex-col h-full">
                        {selectedProduct && recipeAnalysis ? (
                            <div className="h-full flex flex-col gap-6">
                                
                                {/* Size Tabs (If applicable) */}
                                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2 w-fit">
                                        {selectedProduct.sizes.map(size => (
                                            <button
                                                key={size.name}
                                                onClick={() => setActiveSize(size.name)}
                                                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                                    activeSize === size.name 
                                                    ? 'bg-slate-900 text-white shadow-sm' 
                                                    : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                            >
                                                {size.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Top: KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-300 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Selling Price {activeSize ? `(${activeSize})` : ''}</span>
                                            <div className="p-2 bg-blue-100 text-blue-700 rounded-full group-hover:scale-110 transition-transform"><DollarSign size={16}/></div>
                                        </div>
                                        <div>
                                            <span className="text-3xl font-black text-slate-900">{recipeAnalysis.sellingPrice}</span>
                                            <span className="text-xs font-bold text-slate-500 mr-1">{currency}</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-200 shadow-sm flex flex-col justify-between group hover:border-red-300 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{t('inv_recipe_cost')}</span>
                                            <div className="p-2 bg-red-100 text-red-700 rounded-full group-hover:scale-110 transition-transform"><TrendingDown size={16}/></div>
                                        </div>
                                        <div>
                                            <span className="text-3xl font-black text-red-600">{recipeAnalysis.totalCost.toFixed(2)}</span>
                                            <span className="text-xs font-bold text-slate-500 mr-1">{currency}</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-200 shadow-sm flex flex-col justify-between group hover:border-green-300 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{t('inv_profit')}</span>
                                            <div className="p-2 bg-green-100 text-green-700 rounded-full group-hover:scale-110 transition-transform"><TrendingUp size={16}/></div>
                                        </div>
                                        <div>
                                            <span className="text-3xl font-black text-green-600">{recipeAnalysis.profit.toFixed(2)}</span>
                                            <span className="text-xs font-bold text-slate-500 mr-1">{currency}</span>
                                        </div>
                                    </div>

                                    <div className={`p-5 rounded-[2rem] border-2 shadow-sm flex flex-col justify-between relative overflow-hidden ${recipeAnalysis.status.bg} ${recipeAnalysis.status.border}`}>
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <span className={`text-xs font-bold uppercase ${recipeAnalysis.status.color}`}>{t('inv_cost_percent')}</span>
                                            <div className={`p-2 rounded-full bg-white/60 ${recipeAnalysis.status.color}`}><PieIcon size={16}/></div>
                                        </div>
                                        <div className="relative z-10">
                                            <span className={`text-3xl font-black ${recipeAnalysis.status.color}`}>{recipeAnalysis.costPercentage.toFixed(1)}%</span>
                                            <span className={`text-xs font-bold block mt-1 ${recipeAnalysis.status.color}`}>{recipeAnalysis.status.label}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Workspace */}
                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                        <div className="p-6 border-b border-slate-200 flex flex-col bg-slate-50">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                                        <ListChecks className="text-slate-600" size={20} />
                                                        Recipe Items {activeSize ? `(${activeSize})` : ''}
                                                    </h3>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col md:flex-row items-end gap-3 bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-sm">
                                                <div className="flex-1 w-full">
                                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block uppercase">Select Ingredient</label>
                                                    <select 
                                                        value={recipeIngId} 
                                                        onChange={e => setRecipeIngId(e.target.value)} 
                                                        className="w-full bg-slate-50 p-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                                    >
                                                        <option value="">...</option>
                                                        {ingredients.map(ing => (
                                                            <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {selectedRecipeIngredient && (selectedRecipeIngredient.unit === 'kg' || selectedRecipeIngredient.unit === 'liter') && (
                                                    <div className="w-full md:w-auto">
                                                        <label className="text-xs font-bold text-slate-600 mb-1.5 block uppercase">Unit</label>
                                                        <button 
                                                            onClick={() => setUseSmallUnit(!useSmallUnit)}
                                                            className="flex items-center justify-between gap-2 w-full md:w-36 bg-slate-100 hover:bg-slate-200 p-3 rounded-xl text-xs font-bold text-slate-800 transition-colors border border-slate-300"
                                                        >
                                                            <span>{getUnitLabel(selectedRecipeIngredient.unit, useSmallUnit)}</span>
                                                            <ArrowRightLeft size={14} className="text-slate-500" />
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="w-full md:w-32">
                                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block uppercase">Qty</label>
                                                    <input 
                                                        type="number" 
                                                        value={recipeQty} 
                                                        onChange={e => setRecipeQty(e.target.value)} 
                                                        placeholder="0" 
                                                        className="w-full bg-slate-50 p-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 outline-none text-center focus:border-blue-600 focus:ring-1 focus:ring-blue-600" 
                                                    />
                                                </div>

                                                <button 
                                                    onClick={handleAddToRecipe}
                                                    disabled={!recipeIngId || !recipeQty}
                                                    className="w-full md:w-auto h-[46px] px-6 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-lg"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-white">
                                            {recipeAnalysis.chartData.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                    <Scale size={48} className="mb-4 opacity-30" />
                                                    <p className="font-bold text-slate-500">Recipe is empty {activeSize ? `for ${activeSize}` : ''}</p>
                                                </div>
                                            ) : (
                                                recipeAnalysis.chartData.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900">{item.name}</p>
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mt-1">
                                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">{item.displayQty}</span>
                                                                    <span className="text-slate-400">×</span>
                                                                    <span>{item.unitCost} {currency}/{item.unit}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className="font-black text-slate-900 text-lg">{item.value.toFixed(2)} <span className="text-xs font-normal text-slate-500">{currency}</span></p>
                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    // Find item in the full recipe array
                                                                    const rItem = selectedProduct.recipe?.find(r => 
                                                                        ingredients.find(i=>i.id === r.ingredientId)?.name === item.name &&
                                                                        (r.sizeName === activeSize || (!r.sizeName && !activeSize))
                                                                    );
                                                                    if(rItem) handleRemoveFromRecipe(rItem.ingredientId);
                                                                }}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-sm p-6 flex flex-col">
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <PieIcon className="text-slate-600" size={20} />
                                            {t('inv_cost_percent')}
                                        </h3>
                                        <div className="flex-1 relative min-h-[200px]">
                                            {recipeAnalysis.chartData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={recipeAnalysis.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                                            {recipeAnalysis.chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-bold">No Data</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-300 text-slate-400">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <Target size={40} className="opacity-30" />
                                </div>
                                <h3 className="text-xl font-black text-slate-600 mb-2">{t('inv_select_product')}</h3>
                            </div>
                        )}
                    </div>
                </div>
            )}

             {/* --- TAB: SUPPLIERS --- */}
             {activeTab === 'SUPPLIERS' && (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-300">
                     {/* LEFT: ADD/EDIT FORM */}
                     <div className="lg:col-span-4 h-fit bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-6">
                         <div className="flex items-center justify-between mb-8">
                             <h3 className="font-black text-slate-900 text-xl flex items-center gap-3">
                                 <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                                     {editingSupId ? <Edit size={20} /> : <Briefcase size={20} />}
                                 </div>
                                 {editingSupId ? t('edit') : t('inv_add_supplier')}
                             </h3>
                             {editingSupId && (
                                 <button onClick={handleCancelSupEdit} className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">{t('cancel')}</button>
                             )}
                         </div>

                         <div className="space-y-5">
                             <div>
                                 <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide flex items-center gap-2">
                                     <Truck size={14} className="text-blue-500" />
                                     {t('inv_supplier_name')}
                                 </label>
                                 <input 
                                    value={newSupName} 
                                    onChange={e => setNewSupName(e.target.value)} 
                                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white outline-none font-bold text-slate-900 transition-all shadow-sm" 
                                    placeholder="..." 
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide flex items-center gap-2">
                                     <Phone size={14} className="text-blue-500" />
                                     {t('customer_phone')}
                                 </label>
                                 <input 
                                    value={newSupPhone} 
                                    onChange={e => setNewSupPhone(e.target.value)} 
                                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white outline-none font-bold text-slate-900 transition-all shadow-sm dir-ltr text-right" 
                                    placeholder="01xxxxxxxxx" 
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wide flex items-center gap-2">
                                     <Contact size={14} className="text-blue-500" />
                                     {t('inv_supplier_contact')}
                                 </label>
                                 <input 
                                    value={newSupContact} 
                                    onChange={e => setNewSupContact(e.target.value)} 
                                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white outline-none font-bold text-slate-900 transition-all shadow-sm" 
                                    placeholder="..." 
                                 />
                             </div>
                             <button 
                                onClick={handleSaveSupplier} 
                                disabled={!newSupName} 
                                className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2 text-lg active:scale-95 ${editingSupId ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-600/20' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'}`}
                             >
                                 {editingSupId ? <Edit size={20} /> : <Save size={20} />}
                                 {editingSupId ? t('save_btn') : t('save_btn')}
                             </button>
                         </div>
                     </div>

                     {/* RIGHT: LIST */}
                     <div className="lg:col-span-8 flex flex-col gap-6">
                         
                         {/* Search Bar */}
                         <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                             <Search className="text-slate-400 ml-2" size={24} />
                             <input 
                                type="text" 
                                placeholder={t('search')} 
                                value={searchSup}
                                onChange={(e) => setSearchSup(e.target.value)}
                                className="flex-1 bg-transparent outline-none font-bold text-lg text-slate-900 placeholder:text-slate-400 h-full py-2"
                             />
                             {searchSup && (
                                 <button onClick={() => setSearchSup('')} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                                     <X size={16} />
                                 </button>
                             )}
                         </div>

                         {/* Cards Grid */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             {filteredSuppliers.map(sup => (
                                 <div key={sup.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-lg transition-all group relative overflow-hidden">
                                     
                                     {/* Background Decor */}
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-bl-full -mr-8 -mt-8 -z-0"></div>

                                     <div className="relative z-10">
                                         <div className="flex justify-between items-start mb-6">
                                             <div className="flex items-center gap-4">
                                                 <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl uppercase shadow-lg shadow-slate-900/20 border-4 border-white">
                                                     {sup.name.charAt(0)}
                                                 </div>
                                                 <div>
                                                     <h4 className="font-black text-slate-900 text-xl leading-tight line-clamp-1">{sup.name}</h4>
                                                     <div className="flex items-center gap-1 mt-1">
                                                         <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-100 flex items-center gap-1 w-fit">
                                                             <CheckCircle2 size={10} />
                                                             Active
                                                         </span>
                                                     </div>
                                                 </div>
                                             </div>
                                             
                                             {/* Actions */}
                                             <div className="flex gap-2">
                                                 <button 
                                                    onClick={() => handleEditSupplier(sup)}
                                                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                                                    title={t('edit')}
                                                 >
                                                     <Edit size={18} />
                                                 </button>
                                                 <button 
                                                    onClick={() => {
                                                        if(window.confirm('Delete Supplier?')) deleteSupplier(sup.id);
                                                    }}
                                                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                                                    title={t('delete')}
                                                 >
                                                     <Trash2 size={18} />
                                                 </button>
                                             </div>
                                         </div>

                                         <div className="space-y-3">
                                             <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors">
                                                 <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                                                     <Phone size={18} />
                                                 </div>
                                                 <div className="flex-1">
                                                     <p className="text-[10px] font-bold text-slate-400 uppercase">{t('customer_phone')}</p>
                                                     <p className="font-bold text-slate-800 text-sm dir-ltr tracking-wider">{sup.phone || '-'}</p>
                                                 </div>
                                             </div>
                                             
                                             <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors">
                                                 <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600">
                                                     <User size={18} />
                                                 </div>
                                                 <div className="flex-1">
                                                     <p className="text-[10px] font-bold text-slate-400 uppercase">{t('inv_supplier_contact')}</p>
                                                     <p className="font-bold text-slate-800 text-sm">{sup.contactPerson || '-'}</p>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
            )}

            {/* --- MODAL: STOCK ACTIONS (Restock / Waste) --- */}
            {showStockActionModal && selectedIngForAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden border border-slate-200">
                        <div className={`absolute top-0 left-0 w-full h-2 ${actionType === 'RESTOCK' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        
                        <div className="flex justify-between items-start mb-6 mt-2">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 mb-1">
                                    {actionType === 'RESTOCK' ? t('inv_btn_restock') : t('inv_btn_waste')}
                                </h3>
                                <p className="text-sm font-bold text-slate-500">{selectedIngForAction.name}</p>
                            </div>
                            <button onClick={() => setShowStockActionModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-2 block">
                                    {t('shift_exp_amount')} ({selectedIngForAction.unit})
                                </label>
                                <input 
                                    type="number" 
                                    autoFocus
                                    value={actionAmount}
                                    onChange={e => setActionAmount(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-300 rounded-xl text-xl font-black text-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="0"
                                />
                            </div>

                            <button 
                                onClick={handleExecuteStockAction}
                                disabled={!actionAmount}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                    actionType === 'RESTOCK' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 
                                    'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                }`}
                            >
                                <Save size={20} />
                                {t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: ADD / EDIT INGREDIENT --- */}
            {showIngModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col relative my-auto animate-in zoom-in-95 duration-300">
                        
                        {/* Elegant Header */}
                        <div className="relative bg-gradient-to-l from-slate-900 to-slate-800 p-8 text-white overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                        {editingIngId ? <Settings2 size={28} className="text-white" /> : <Package size={28} className="text-white" />}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight mb-1">
                                            {editingIngId ? t('edit') : t('inv_add_ing')}
                                        </h2>
                                    </div>
                                </div>
                                <button onClick={() => setShowIngModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Body Content */}
                        <div className="p-8 bg-white flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                {/* Section 1: Basic Info */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('inv_col_name')}</label>
                                        <input 
                                            value={newIngName} 
                                            onChange={e => setNewIngName(e.target.value)} 
                                            className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:ring-0 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                                            placeholder="..." 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Unit</label>
                                        <div className="relative">
                                            <select 
                                                value={newIngUnit} 
                                                onChange={e => setNewIngUnit(e.target.value)} 
                                                className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:ring-0 outline-none font-bold text-slate-900 appearance-none cursor-pointer transition-all"
                                            >
                                                <option value="kg">Kg</option>
                                                <option value="liter">Liter</option>
                                                <option value="piece">Piece</option>
                                                <option value="box">Box</option>
                                            </select>
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <ChevronRight size={20} className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Financials & Stock */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('inv_col_cost')}</label>
                                        <div className="relative group">
                                            <input 
                                                type="number" 
                                                value={newIngCost} 
                                                onChange={e => setNewIngCost(e.target.value)} 
                                                className="w-full p-4 pl-12 rounded-xl bg-emerald-50/50 border-2 border-emerald-100 focus:border-emerald-500 focus:bg-white outline-none font-black text-emerald-700 transition-all placeholder:text-emerald-300/50" 
                                                placeholder="0.00" 
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm bg-white px-2 py-1 rounded-lg shadow-sm border border-emerald-100">
                                                {currency}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2">
                                                {t('inv_col_stock')}
                                            </label>
                                            {editingIngId ? (
                                                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center">
                                                    <span className="font-black text-xl text-slate-800">{newIngStock}</span>
                                                    <span className="text-xs font-bold text-slate-500 block mt-1">{newIngUnit}</span>
                                                </div>
                                            ) : (
                                                <input 
                                                    type="number" 
                                                    value={newIngStock} 
                                                    onChange={e => setNewIngStock(e.target.value)} 
                                                    className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-slate-900 outline-none font-bold text-center" 
                                                    placeholder="0" 
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2">Alert Limit</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={newIngMinStock} 
                                                    onChange={e => setNewIngMinStock(e.target.value)} 
                                                    className="w-full p-4 rounded-xl bg-red-50/50 border-2 border-red-100 focus:border-red-400 focus:bg-white outline-none font-bold text-center text-red-800" 
                                                    placeholder="5" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                            <button 
                                onClick={() => setShowIngModal(false)}
                                className="px-6 py-4 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-100 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                onClick={handleSaveIngredient}
                                disabled={!newIngName || !newIngCost}
                                className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save size={20} />
                                {t('save_btn')}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;