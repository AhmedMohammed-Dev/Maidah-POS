
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { OrderStatus } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line
} from 'recharts';
import { 
    TrendingUp, DollarSign, ShoppingBag, 
    Clock, Award, PieChart as PieChartIcon, Wallet, ArrowDownRight, ArrowUpRight,
    Calendar, Package, AlertTriangle, Scale, Filter, Download, Bell, XCircle, CreditCard, Users, Heart
} from 'lucide-react';

const Admin = () => {
  const { orders, expenses, ingredients, shifts, currency, currentUser, products, categories, checkProductStock, t, settings } = useStore();
  const isRTL = settings.language === 'ar';
  
  // Permission Check
  if (currentUser?.role !== 'ADMIN') {
      return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-400">
              <AlertTriangle size={48} className="mb-4 text-red-400" />
              <h2 className="text-xl font-bold text-slate-700">{t('admin_access_denied')}</h2>
          </div>
      );
  }

  // --- STATE: Date Filtering ---
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('MONTH');

  // --- ANALYTICS ENGINE ---
  const analytics = useMemo(() => {
    // 1. Determine Date Range
    const now = new Date();
    let startDate = new Date(0); // Epoch
    let endDate = new Date(); // Now

    if (dateFilter === 'TODAY') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (dateFilter === 'WEEK') {
        const first = now.getDate() - now.getDay();
        startDate = new Date(now.setDate(first));
        startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'MONTH') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter Data based on Range
    const filteredOrders = orders.filter(o => o.status !== OrderStatus.CANCELLED && new Date(o.createdAt) >= startDate && new Date(o.createdAt) <= endDate);
    const filteredExpenses = expenses.filter(e => new Date(e.date) >= startDate && new Date(e.date) <= endDate);
    const filteredShifts = shifts.filter(s => s.status === 'CLOSED' && new Date(s.startTime) >= startDate && new Date(s.startTime) <= endDate);

    // --- DONATION CALCULATIONS (New) ---
    const totalDonations = filteredOrders.reduce((sum, order) => {
        const orderDonations = order.items
            .filter(item => item.isDonation)
            .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
        return sum + orderDonations;
    }, 0);

    // --- FINANCIAL METRICS ---
    const totalGrossRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0); // Money in drawer (Sales + Donations)
    const totalBusinessRevenue = totalGrossRevenue - totalDonations; // Actual Sales
    
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Net Profit = (Business Sales - Expenses). We exclude donations as they are pass-through.
    const netProfit = totalBusinessRevenue - totalExpenses;
    
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? (totalGrossRevenue / totalOrders) : 0;

    // --- INVENTORY METRICS (Snapshot - Not Time Based) ---
    const totalStockValue = ingredients.reduce((sum, ing) => sum + (ing.currentStock * ing.costPerUnit), 0);
    const lowStockItems = ingredients.filter(ing => ing.currentStock <= ing.minStockLevel && ing.currentStock > 0);
    const outOfStockItems = ingredients.filter(ing => ing.currentStock <= 0); // Critical
    const topCostIngredients = [...ingredients].sort((a, b) => b.costPerUnit - a.costPerUnit).slice(0, 5);

    // --- PRODUCT AVAILABILITY IMPACT ---
    const unavailableProducts = products.filter(p => !checkProductStock(p));

    // --- SHIFT METRICS ---
    const totalCashShortage = filteredShifts.reduce((sum, s) => sum + (s.difference && s.difference < 0 ? s.difference : 0), 0);
    const totalCashSurplus = filteredShifts.reduce((sum, s) => sum + (s.difference && s.difference > 0 ? s.difference : 0), 0);

    // --- CHARTS DATA PREP ---
    
    // 1. Sales vs Expenses Over Time (Daily)
    const timelineMap = new Map<string, { date: string, sales: number, expenses: number }>();
    
    filteredOrders.forEach(o => {
        const dateKey = new Date(o.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
        if (!timelineMap.has(dateKey)) timelineMap.set(dateKey, { date: dateKey, sales: 0, expenses: 0 });
        
        // Only count Business Sales in the chart, not donations
        const businessSales = o.items.filter(i => !i.isDonation).reduce((s, i) => s + (i.price * i.quantity), 0);
        timelineMap.get(dateKey)!.sales += businessSales;
    });
    
    filteredExpenses.forEach(e => {
        const dateKey = new Date(e.date).toLocaleDateString('en-CA');
        if (!timelineMap.has(dateKey)) timelineMap.set(dateKey, { date: dateKey, sales: 0, expenses: 0 });
        timelineMap.get(dateKey)!.expenses += e.amount;
    });

    const timelineData = Array.from(timelineMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({
            ...item,
            profit: item.sales - item.expenses // Add Profit Calculation for visual logic
        }));

    // 2. Sales by Category (Exclude Donations from Category Chart)
    const categoryData = categories.map(cat => {
        const value = filteredOrders.flatMap(o => o.items).filter(i => i.category === cat && !i.isDonation).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        return { name: cat, value };
    }).filter(d => d.value > 0);

    // 3. Payment Methods Analysis
    const paymentData = [
        { name: t('payment_cash'), value: filteredOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0), color: '#10b981' },
        { name: t('payment_card'), value: filteredOrders.filter(o => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.total, 0), color: '#3b82f6' },
        { name: t('payment_qr'), value: filteredOrders.filter(o => o.paymentMethod === 'QR').reduce((sum, o) => sum + o.total, 0), color: '#8b5cf6' },
    ].filter(d => d.value > 0);

    // 4. Peak Hours Analysis
    const hoursData = new Array(24).fill(0).map((_, i) => ({ hour: i, sales: 0, orders: 0 }));
    filteredOrders.forEach(o => {
        const h = new Date(o.createdAt).getHours();
        hoursData[h].sales += o.total;
        hoursData[h].orders += 1;
    });
    // Filter out hours with 0 sales for cleaner chart (optional, but keeping 24h is good for context)
    const peakHoursData = hoursData.map(d => ({
        time: `${d.hour}:00`,
        sales: d.sales,
        orders: d.orders
    }));

    // 5. Staff Performance (Top 5)
    const staffStats: Record<string, { name: string, count: number, total: number }> = {};
    filteredOrders.forEach(o => {
        const staffName = o.createdBy || 'Unknown';
        if (!staffStats[staffName]) staffStats[staffName] = { name: staffName, count: 0, total: 0 };
        staffStats[staffName].count += 1;
        staffStats[staffName].total += o.total;
    });
    const topStaff = Object.values(staffStats).sort((a, b) => b.total - a.total).slice(0, 5);

    // 6. Top Selling Products
    const productStats: Record<string, { qty: number, revenue: number }> = {};
    filteredOrders.flatMap(o => o.items).filter(i => !i.isDonation).forEach(item => {
        if (!productStats[item.name]) productStats[item.name] = { qty: 0, revenue: 0 };
        productStats[item.name].qty += item.quantity;
        productStats[item.name].revenue += (item.price * item.quantity);
    });
    
    const topProducts = Object.entries(productStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    return {
        totalGrossRevenue, totalBusinessRevenue, totalDonations, totalExpenses, netProfit, totalOrders, averageOrderValue,
        totalStockValue, lowStockItems, outOfStockItems, topCostIngredients, unavailableProducts,
        totalCashShortage, totalCashSurplus,
        timelineData, categoryData, topProducts, paymentData, peakHoursData, topStaff
    };
  }, [orders, expenses, ingredients, shifts, dateFilter, products, categories]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-slate-50 pb-24 font-sans">
      
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <PieChartIcon className="text-indigo-600" size={32} />
               {t('admin_dashboard_title')}
           </h1>
           <p className="text-slate-500 font-bold mt-2">{t('admin_dashboard_desc')}</p>
        </div>

        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
            {[
                { id: 'TODAY', label: t('filter_today') },
                { id: 'WEEK', label: t('filter_week') },
                { id: 'MONTH', label: t('filter_month') },
                { id: 'ALL', label: t('filter_all') },
            ].map((f) => (
                <button
                    key={f.id}
                    onClick={() => setDateFilter(f.id as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        dateFilter === f.id 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
      </div>

      {/* ALERT CENTER */}
      {(analytics.outOfStockItems.length > 0 || analytics.lowStockItems.length > 0) && (
          <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
              <div className="bg-white rounded-[2rem] border border-red-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-red-50 bg-red-50/30 flex items-center gap-3">
                      <div className="p-2 bg-red-100 text-red-600 rounded-xl animate-pulse"><Bell size={20}/></div>
                      <h3 className="font-black text-red-900 text-lg">{t('admin_dashboard_title')}</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Critical Alerts */}
                      {analytics.outOfStockItems.length > 0 && (
                          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                              <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                                  <XCircle size={16} />
                                  {t('alert_stock_critical')}
                              </h4>
                              <div className="space-y-2">
                                  {analytics.outOfStockItems.map(ing => (
                                      <div key={ing.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                          <span className="text-sm font-bold text-slate-800">{ing.name}</span>
                                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">0 {ing.unit}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                      {/* Warning Alerts */}
                      {analytics.lowStockItems.length > 0 && (
                          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                              <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                                  <AlertTriangle size={16} />
                                  {t('alert_stock_warning')}
                              </h4>
                              <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                  {analytics.lowStockItems.map(ing => (
                                      <div key={ing.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
                                          <span className="text-sm font-bold text-slate-800">{ing.name}</span>
                                          <div className="text-xs font-bold flex items-center gap-2">
                                              <span className="text-orange-600">{ing.currentStock}</span>
                                              <span className="text-slate-400">|</span>
                                              <span className="text-slate-500">Min: {ing.minStockLevel}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* KPI CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Revenue */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <DollarSign size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{t('kpi_revenue')}</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-1">{analytics.totalBusinessRevenue.toFixed(0)} <span className="text-sm font-bold text-slate-400">{currency}</span></h3>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <ShoppingBag size={12} /> {analytics.totalOrders} Orders
              </p>
          </div>

          {/* Donations (NEW CARD) */}
          <div className="bg-pink-50 p-6 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <Heart size={24} fill="currentColor" />
                  </div>
                  <span className="text-xs font-bold text-pink-700 bg-white px-2 py-1 rounded-lg">{t('kpi_donations')}</span>
              </div>
              <h3 className="text-3xl font-black text-pink-700 mb-1">{analytics.totalDonations.toFixed(0)} <span className="text-sm font-bold text-pink-400">{currency}</span></h3>
          </div>

          {/* Net Profit */}
          <div className="bg-slate-900 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl backdrop-blur-sm">
                          <TrendingUp size={24} />
                      </div>
                      <span className="text-xs font-bold text-slate-400">{t('kpi_net_profit')}</span>
                  </div>
                  <h3 className={`text-3xl font-black mb-1 ${analytics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {analytics.netProfit.toFixed(0)} <span className="text-sm font-bold text-slate-500">{currency}</span>
                  </h3>
              </div>
          </div>

          {/* Inventory Value */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <Package size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{t('kpi_inventory_value')}</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-1">{analytics.totalStockValue.toFixed(0)} <span className="text-sm font-bold text-slate-400">{currency}</span></h3>
          </div>

          {/* Shift Anomalies */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <Scale size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{t('kpi_shortage')}</span>
              </div>
              <h3 className="text-3xl font-black text-red-600 mb-1 dir-ltr">{analytics.totalCashShortage.toFixed(2)} <span className="text-sm font-bold text-slate-400">{currency}</span></h3>
          </div>
      </div>

      {/* DETAILED CHARTS ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          
          {/* 1. Main Sales Chart (BAR CHART - UPDATED) */}
          <div className="xl:col-span-2 bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                  <div>
                      <h3 className="text-xl font-black text-slate-900">{t('chart_revenue_expenses')}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg"><div className="w-3 h-3 rounded bg-indigo-500"></div> Sales</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg"><div className="w-3 h-3 rounded bg-red-500"></div> Expenses</div>
                  </div>
              </div>
              <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.timelineData} margin={{top: 10, right: 10, left: 0, bottom: 0}} barGap={8}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} tickFormatter={(str) => new Date(str).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {day: 'numeric', month: 'short'})} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                          <Tooltip 
                            contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', padding: '12px'}} 
                            cursor={{fill: '#f8fafc'}}
                            formatter={(value: number, name: string, props: any) => {
                                // Custom format for profit in tooltip if needed, or just standard display
                                return [`${value} ${currency}`, name];
                            }}
                            labelFormatter={(label) => {
                                const dayData = analytics.timelineData.find(d => d.date === label);
                                const profit = dayData ? dayData.profit : 0;
                                return (
                                    <div className="mb-2 border-b border-slate-600 pb-2">
                                        <p>{new Date(label).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {weekday: 'long', day:'numeric', month:'long'})}</p>
                                        <p className={`text-xs font-bold mt-1 ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            Net Profit: {profit.toFixed(0)} {currency}
                                        </p>
                                    </div>
                                );
                            }}
                          />
                          <Bar dataKey="sales" name="Revenue" fill="#6366f1" radius={[6, 6, 6, 6]} barSize={16} />
                          <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[6, 6, 6, 6]} barSize={16} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* 2. Payment Methods (Pie) - NEW */}
          <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Wallet size={20}/></div>
                  <div>
                      <h3 className="text-xl font-black text-slate-900">{t('chart_payment_methods')}</h3>
                  </div>
              </div>
              <div className="flex-1 relative min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={analytics.paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                              {analytics.paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff'}} itemStyle={{fontWeight: 'bold'}} formatter={(value: number) => [`${value} ${currency}`, '']} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* SECOND ROW: Peak Hours & Staff Performance (NEW) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          
          {/* Peak Hours (Bar) */}
          <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><Clock size={20}/></div>
                  <div>
                      <h3 className="text-xl font-black text-slate-900">{t('chart_peak_hours')}</h3>
                  </div>
              </div>
              <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.peakHoursData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} interval={3} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff'}} itemStyle={{fontWeight: 'bold', color: '#fff'}} />
                          <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} name="Orders" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Top Staff (List) */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 pb-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><Users size={20}/></div>
                  <div>
                      <h3 className="text-xl font-black text-slate-900">{t('chart_top_staff')}</h3>
                  </div>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar p-4">
                  {analytics.topStaff.map((staff, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 mb-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-purple-200 transition-colors">
                          <div className="flex items-center gap-4">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx===0 ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                  #{idx + 1}
                              </span>
                              <div>
                                  <p className="font-bold text-slate-900">{staff.name}</p>
                                  <p className="text-xs font-bold text-slate-500">{staff.count} Orders</p>
                              </div>
                          </div>
                          <span className="font-black text-slate-900">{staff.total.toFixed(0)} {currency}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* BOTTOM LISTS ROW (Existing) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Products Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 text-yellow-600 rounded-xl"><Award size={20}/></div>
                      <h3 className="font-black text-slate-900 text-lg">{t('list_top_products')}</h3>
                  </div>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar p-4">
                  {analytics.topProducts.map((prod, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 mb-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-yellow-200 transition-colors">
                          <div className="flex items-center gap-4">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx===0 ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' : 'bg-slate-200 text-slate-600'}`}>
                                  #{idx + 1}
                              </span>
                              <div>
                                  <p className="font-bold text-slate-900">{prod.name}</p>
                                  <p className="text-xs font-bold text-slate-500">{prod.qty} Sold</p>
                              </div>
                          </div>
                          <span className="font-black text-slate-900">{prod.revenue.toFixed(0)} {currency}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Inventory Health Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 text-pink-600 rounded-xl"><Scale size={20}/></div>
                      <h3 className="font-black text-slate-900 text-lg">{t('list_costly_ingredients')}</h3>
                  </div>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar p-4">
                  {analytics.topCostIngredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 mb-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-pink-200 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="bg-pink-100 text-pink-600 w-10 h-10 rounded-xl flex items-center justify-center">
                                  <Package size={18} />
                              </div>
                              <div>
                                  <p className="font-bold text-slate-900">{ing.name}</p>
                                  <p className="text-xs font-bold text-slate-500">Stock: {ing.currentStock} {ing.unit}</p>
                              </div>
                          </div>
                          <div className="text-left">
                              <p className="font-black text-slate-900">{ing.costPerUnit} {currency}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Unit Price</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

      </div>
    </div>
  );
};

export default Admin;
