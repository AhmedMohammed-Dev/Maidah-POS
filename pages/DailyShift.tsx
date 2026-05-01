

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Shift, OrderStatus } from '../types';
import { 
    Wallet, Play, StopCircle, DollarSign, 
    Plus, Printer, History, Clock, 
    TrendingUp, AlertTriangle, Calculator,
    Coins, CreditCard, Banknote, ArrowRightLeft,
    FileText, PieChart as PieIcon, X, Lock, ShieldCheck, User, CheckCircle, Edit2, Trash2, Save
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

// Denomination Config
const DENOMINATIONS = [200, 100, 50, 20, 10, 5, 1, 0.5];

const DailyShift = () => {
    const { currentShift, shifts, startShift, endShift, addExpense, updateExpense, deleteExpense, expenses, orders, currency, settings, currentUser, t } = useStore();
    
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'EXPENSES' | 'CLOSING'>('DASHBOARD');
    
    // Closing Wizard State
    const [closingStep, setClosingStep] = useState<'COUNT' | 'SUMMARY'>('COUNT');
    const [cashCounts, setCashCounts] = useState<Record<number, number>>({});
    const [manualEndCash, setManualEndCash] = useState('');
    
    // Expenses State
    const [expDesc, setExpDesc] = useState('');
    const [expAmount, setExpAmount] = useState('');
    const [expCategory, setExpCategory] = useState<'PURCHASE' | 'SALARY' | 'UTILITY' | 'OTHER'>('OTHER');
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

    // Timer State
    const [duration, setDuration] = useState('');

    useEffect(() => {
        if (!currentShift) return;
        const updateDuration = () => {
            const start = new Date(currentShift.startTime);
            const now = new Date();
            const diff = now.getTime() - start.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setDuration(`${hours}h ${minutes}m`);
        };
        updateDuration();
        const interval = setInterval(updateDuration, 60000);
        return () => clearInterval(interval);
    }, [currentShift]);

    // --- CALCULATIONS ---
    const shiftStats = useMemo(() => {
        if (!currentShift) return null;

        const shiftOrders = orders.filter(o => o.shiftId === currentShift.id && o.status !== OrderStatus.CANCELLED);
        
        const cashSales = shiftOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
        const cardSales = shiftOrders.filter(o => o.paymentMethod === 'QR' || o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.total, 0);
        const totalSales = cashSales + cardSales;

        const shiftExpenses = expenses.filter(e => e.shiftId === currentShift.id);
        const totalExpenses = shiftExpenses.reduce((sum, e) => sum + e.amount, 0);

        // CASH FLOW EQUATION (Sales in Cash only)
        const expectedCashInDrawer = currentShift.startCash + cashSales - totalExpenses;
        
        // Calculated from Denominations or Manual Input
        const calculatedEndCashFromCount = Object.entries(cashCounts).reduce((sum, [denom, count]) => sum + (parseFloat(denom) * Number(count)), 0);
        
        const finalEndCash = manualEndCash ? parseFloat(manualEndCash) : calculatedEndCashFromCount;

        const difference = finalEndCash - expectedCashInDrawer;

        // Hourly Data for Chart
        const hourlyDataMap = new Map<string, number>();
        shiftOrders.forEach(o => {
            const hour = o.createdAt.getHours();
            const label = `${hour}:00`;
            hourlyDataMap.set(label, (hourlyDataMap.get(label) || 0) + o.total);
        });
        const chartData = Array.from(hourlyDataMap.entries()).map(([time, sales]) => ({ time, sales }));

        return {
            orderCount: shiftOrders.length,
            cashSales,
            cardSales,
            totalSales,
            totalExpenses,
            expectedCashInDrawer,
            shiftExpenses,
            difference,
            finalEndCash,
            chartData
        };
    }, [currentShift, orders, expenses, cashCounts, manualEndCash]);

    const pieData = shiftStats ? [
        { name: t('payment_cash'), value: shiftStats.cashSales, color: '#10b981' }, // Emerald
        { name: t('payment_card'), value: shiftStats.cardSales, color: '#6366f1' }, // Indigo
    ].filter(d => d.value > 0) : [];

    // --- HANDLERS ---
    const handleStart = () => {
        const amount = settings.defaultStartCash || 0;
        startShift(amount);
    };

    const handleDenomChange = (denom: number, val: string) => {
        const count = parseInt(val) || 0;
        setCashCounts(prev => ({ ...prev, [denom]: count }));
        setManualEndCash(''); 
    };

    const handleConfirmClose = () => {
        if (!shiftStats) return;
        endShift(shiftStats.finalEndCash);
        setCashCounts({});
        setManualEndCash('');
        setClosingStep('COUNT');
        setActiveTab('DASHBOARD');
    };

    const handleSaveExpense = () => {
        if (!expDesc || !expAmount) return;
        
        if (editingExpenseId) {
            // Update Existing
            const original = expenses.find(e => e.id === editingExpenseId);
            if(original) {
                updateExpense({
                    ...original,
                    description: expDesc,
                    amount: parseFloat(expAmount),
                    category: expCategory
                });
            }
            setEditingExpenseId(null);
        } else {
            // Add New
            addExpense({
                id: `exp-${Date.now()}`,
                description: expDesc,
                amount: parseFloat(expAmount),
                date: new Date(),
                category: expCategory,
                shiftId: currentShift?.id
            });
        }
        
        setExpDesc(''); 
        setExpAmount('');
        // Optional: Keep category or reset
    };

    const handleEditExpense = (expense: any) => {
        setEditingExpenseId(expense.id);
        setExpDesc(expense.description);
        setExpAmount(expense.amount.toString());
        setExpCategory(expense.category);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const handleCancelEdit = () => {
        setEditingExpenseId(null);
        setExpDesc('');
        setExpAmount('');
    };

    const handleDeleteExpense = (id: string) => {
        if(window.confirm('Delete Expense?')) {
            deleteExpense(id);
        }
    };

    const handlePrintReport = (type: 'X' | 'Z') => {
        if (!currentShift || !shiftStats) return;
        
        const title = type === 'X' ? 'X-Report' : 'Z-Report';
        const receiptWindow = window.open('', '_blank');
        if(!receiptWindow) return;

        receiptWindow.document.write(`
            <html dir="rtl">
            <head><title>${title}</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 20px;">
                <h2>${settings.restaurantName}</h2>
                <h3>${title}</h3>
                <p>Staff: ${currentShift.userName}</p>
                <p>Date: ${new Date().toLocaleString()}</p>
                <hr/>
                <div style="display: flex; justify-content: space-between;"><strong>Sales:</strong> <span>${shiftStats.totalSales}</span></div>
                <div style="display: flex; justify-content: space-between;"><strong>Expenses:</strong> <span>${shiftStats.totalExpenses}</span></div>
                <div style="display: flex; justify-content: space-between;"><strong>Orders:</strong> <span>${shiftStats.orderCount}</span></div>
                <hr/>
                <h3>Expected Cash: ${shiftStats.expectedCashInDrawer}</h3>
                ${type === 'Z' ? `<hr/><h3>Actual Cash: ${shiftStats.finalEndCash}</h3>` : ''}
                ${type === 'Z' && shiftStats.difference !== 0 ? `<p>Diff: ${shiftStats.difference}</p>` : ''}
            </body>
            </html>
        `);
        receiptWindow.document.close();
        receiptWindow.print();
    };

    // --- RENDER HELPERS ---
    const getDiffColor = (diff: number) => {
        if (Math.abs(diff) < 0.5) return 'text-green-800 bg-green-50 border-green-200';
        if (diff > 0) return 'text-blue-800 bg-blue-50 border-blue-200';
        return 'text-red-800 bg-red-50 border-red-200';
    };

    // --- NO ACTIVE SHIFT VIEW ---
    if (!currentShift) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-100 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-purple-700"></div>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl z-10 border-4 border-white/20">
                        <Play fill="currentColor" className="text-indigo-600 translate-x-1" size={40} />
                    </div>
                    
                    <div className="pt-24 pb-12 px-10 text-center mt-12">
                        <h2 className="text-3xl font-black text-slate-900 mb-2">{t('shift_start_title')}</h2>
                        <div className="flex items-center justify-center gap-2 mb-8 bg-slate-100 p-2 rounded-xl w-fit mx-auto pr-4">
                            <User size={16} className="text-slate-500" />
                            <span className="text-sm font-bold text-slate-700">{currentUser?.name}</span>
                        </div>
                        
                        <div className="mb-10 bg-indigo-50 border border-indigo-100 rounded-3xl p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-indigo-700 font-bold text-sm mb-1 flex items-center justify-center gap-1">
                                    <Lock size={14} />
                                    Start Cash
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-5xl font-black text-slate-900">{settings.defaultStartCash.toFixed(2)}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-500 mt-1 block">{currency}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleStart}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <span>{t('shift_open_btn')}</span>
                            <ArrowRightLeft size={20} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- ACTIVE SHIFT DASHBOARD ---
    return (
        <div className="p-4 lg:p-8 min-h-screen bg-slate-50 pb-20 font-sans">
            
            {/* Header Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-2 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Clock className="animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">{currentShift.userName}</h1>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                                {duration}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full lg:w-auto overflow-x-auto">
                    {[
                        { id: 'DASHBOARD', label: t('shift_tab_overview'), icon: FileText },
                        { id: 'EXPENSES', label: t('shift_tab_expenses'), icon: Wallet },
                        { id: 'CLOSING', label: t('shift_tab_closing'), icon: StopCircle },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                if(tab.id === 'CLOSING') setClosingStep('COUNT');
                            }}
                            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-slate-900 text-white shadow-lg' 
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                    <button onClick={() => handlePrintReport('X')} className="px-4 py-3 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" title="Print X Report">
                        <Printer size={18} />
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {activeTab === 'DASHBOARD' && shiftStats && (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                <p className="text-slate-500 text-xs font-bold mb-1 relative z-10">{t('shift_net_sales')}</p>
                                <p className="text-3xl font-black text-slate-900 relative z-10">{shiftStats.totalSales.toFixed(2)} <span className="text-xs">{currency}</span></p>
                            </div>
                            
                            <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
                                <p className="text-slate-300 text-xs font-bold mb-1 relative z-10">{t('shift_cash_drawer')}</p>
                                <p className="text-3xl font-black text-white relative z-10">{shiftStats.expectedCashInDrawer.toFixed(2)} <span className="text-xs text-slate-400">{currency}</span></p>
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                <p className="text-slate-500 text-xs font-bold mb-1 relative z-10">{t('shift_expenses_total')}</p>
                                <p className="text-3xl font-black text-red-600 relative z-10">{shiftStats.totalExpenses.toFixed(2)} <span className="text-xs">{currency}</span></p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-6">Performance</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={shiftStats.chartData}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                                            <RechartsTooltip 
                                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#334155'}}
                                            />
                                            <Area type="monotone" dataKey="sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-6">{t('chart_payment_methods')}</h3>
                                <div className="h-64 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'EXPENSES' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                                    {editingExpenseId ? <Edit2 size={20} /> : <Wallet size={20} />}
                                </div>
                                {editingExpenseId ? t('edit') : t('shift_add_expense')}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t('shift_exp_type')}</label>
                                    <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl">
                                        {[
                                            { id: 'OTHER', label: 'Other' },
                                            { id: 'PURCHASE', label: 'Purchases' },
                                            { id: 'UTILITY', label: 'Bills' },
                                            { id: 'SALARY', label: 'Salary' },
                                        ].map(cat => (
                                            <button 
                                                key={cat.id}
                                                onClick={() => setExpCategory(cat.id as any)}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${expCategory === cat.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t('shift_exp_desc')}</label>
                                    <input 
                                        value={expDesc}
                                        onChange={e => setExpDesc(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:bg-white focus:border-orange-500 outline-none placeholder:text-slate-400"
                                        placeholder="..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t('shift_exp_amount')}</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={expAmount}
                                            onChange={e => setExpAmount(e.target.value)}
                                            className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:bg-white focus:border-orange-500 outline-none placeholder:text-slate-400"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">{currency}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {editingExpenseId && (
                                    <button 
                                        onClick={handleCancelEdit}
                                        className="py-3.5 px-6 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                    >
                                        {t('cancel')}
                                    </button>
                                )}
                                <button 
                                    onClick={handleSaveExpense}
                                    disabled={!expDesc || !expAmount}
                                    className={`flex-1 py-3.5 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                                        editingExpenseId 
                                        ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20' 
                                        : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'
                                    }`}
                                >
                                    {editingExpenseId ? <Save size={18} /> : <Plus size={18} />}
                                    {t('save_btn')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {shiftStats?.shiftExpenses.map(exp => (
                                <div key={exp.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${editingExpenseId === exp.id ? 'border-orange-400 bg-orange-50' : 'border-slate-100 hover:border-orange-200'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs">
                                            {exp.category === 'PURCHASE' ? '🛒' : exp.category === 'SALARY' ? '👷' : exp.category === 'UTILITY' ? '⚡' : '📝'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{exp.description}</p>
                                            <p className="text-xs text-slate-500 font-bold">{new Date(exp.date).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-black text-red-600 text-lg dir-ltr">-{exp.amount} <span className="text-xs text-slate-400">{currency}</span></p>
                                        
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleEditExpense(exp)}
                                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteExpense(exp.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'CLOSING' && shiftStats && (
                    <div className="max-w-4xl mx-auto">
                        
                        {/* STEP 1: COUNT CASH */}
                        {closingStep === 'COUNT' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right duration-300">
                                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                                    <h3 className="font-black text-lg text-slate-800 mb-4 flex items-center gap-2">
                                        <Calculator className="text-slate-400" />
                                        {t('shift_close_count')}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {DENOMINATIONS.map(denom => (
                                            <div key={denom} className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3 border border-slate-100">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-slate-700 shadow-sm border border-slate-200 shrink-0">
                                                    {denom}
                                                </div>
                                                <div className="flex-1">
                                                    <input 
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={cashCounts[denom] || ''}
                                                        onChange={(e) => handleDenomChange(denom, e.target.value)}
                                                        className="w-full bg-transparent font-bold text-lg text-slate-900 outline-none text-right placeholder:text-slate-300"
                                                    />
                                                    <p className="text-[10px] text-slate-500 font-bold text-right">
                                                        = {((cashCounts[denom] || 0) * denom).toFixed(0)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <label className="text-xs font-bold text-slate-500 block mb-1">{t('shift_actual_cash')}</label>
                                        <input 
                                            type="number"
                                            value={manualEndCash}
                                            onChange={e => setManualEndCash(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900"
                                            placeholder="Total Amount"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center gap-6">
                                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl text-center">
                                        <p className="text-slate-400 font-bold text-xs uppercase mb-1">Total</p>
                                        <h3 className="text-5xl font-black text-white">{shiftStats.finalEndCash.toFixed(2)} <span className="text-lg text-slate-500">{currency}</span></h3>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setClosingStep('SUMMARY')}
                                        disabled={shiftStats.finalEndCash === 0 && !manualEndCash}
                                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Review Summary
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: SUMMARY & CONFIRM */}
                        {closingStep === 'SUMMARY' && (
                            <div className="max-w-2xl mx-auto animate-in slide-in-from-right duration-300">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl relative overflow-hidden">
                                    
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-black text-slate-900">{t('shift_close_summary')}</h2>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <span className="font-bold text-slate-500">{t('shift_cash_drawer')}</span>
                                            <span className="font-black text-xl text-slate-900">{shiftStats.expectedCashInDrawer.toFixed(2)} {currency}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <span className="font-bold text-slate-500">{t('shift_actual_cash')}</span>
                                            <span className="font-black text-xl text-slate-900">{shiftStats.finalEndCash.toFixed(2)} {currency}</span>
                                        </div>
                                        
                                        <div className={`flex justify-between items-center p-6 rounded-2xl border-2 ${getDiffColor(shiftStats.difference)}`}>
                                            <div className="flex items-center gap-3">
                                                {shiftStats.difference < 0 ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                                                <div>
                                                    <p className="font-black text-lg">
                                                        {Math.abs(shiftStats.difference) < 0.5 ? t('shift_matched') : shiftStats.difference < 0 ? t('shift_shortage') : t('shift_surplus')}
                                                    </p>
                                                    <p className="text-xs font-bold opacity-80">{t('shift_diff')}</p>
                                                </div>
                                            </div>
                                            <span className="font-black text-3xl dir-ltr">{shiftStats.difference > 0 ? '+' : ''}{shiftStats.difference.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setClosingStep('COUNT')}
                                            className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                        >
                                            {t('edit')}
                                        </button>
                                        <button 
                                            onClick={handleConfirmClose}
                                            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all active:scale-[0.98]"
                                        >
                                            {t('shift_confirm_close')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
};

// Quick helper component for icons if needed
const CheckCircle2 = ({className, size}: {className?: string, size?: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);

export default DailyShift;