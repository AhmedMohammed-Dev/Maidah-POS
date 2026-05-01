
import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Shift } from '../types';
import { FileText, Clock, AlertTriangle, CheckCircle2, Eye, X, Wallet, TrendingUp, DollarSign, Download, Printer, Calendar, Filter } from 'lucide-react';

const ShiftHistory = () => {
    const { shifts, expenses, currency, currentUser, settings, t } = useStore();
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

    // --- FILTER STATE ---
    const getLocalDateString = (date = new Date()) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    const [filterMode, setFilterMode] = useState<'ALL' | 'TODAY' | 'MONTH' | 'CUSTOM'>('MONTH');
    const [startDate, setStartDate] = useState(getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1))); // Start of month
    const [endDate, setEndDate] = useState(getLocalDateString());

    // Only Admin can see this page
    if (currentUser?.role !== 'ADMIN') {
        return <div className="p-10 text-center font-bold text-red-500">{t('admin_access_denied')}</div>;
    }

    // --- FILTER LOGIC ---
    const filteredShifts = useMemo(() => {
        let data = shifts.filter(s => s.status === 'CLOSED');

        if (filterMode === 'TODAY') {
            const todayStr = getLocalDateString();
            data = data.filter(s => getLocalDateString(new Date(s.startTime)) === todayStr);
        } else if (filterMode === 'MONTH') {
            const now = new Date();
            data = data.filter(s => {
                const d = new Date(s.startTime);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else if (filterMode === 'CUSTOM') {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include full end day
            data = data.filter(s => {
                const d = new Date(s.startTime);
                return d >= start && d <= end;
            });
        }

        return data.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }, [shifts, filterMode, startDate, endDate]);

    // --- SUMMARY STATS ---
    const summary = useMemo(() => {
        return filteredShifts.reduce((acc, curr) => ({
            sales: acc.sales + (curr.stats?.totalSales || 0),
            expenses: acc.expenses + (curr.stats?.expensesTotal || 0),
            diff: acc.diff + (curr.difference || 0),
            count: acc.count + 1
        }), { sales: 0, expenses: 0, diff: 0, count: 0 });
    }, [filteredShifts]);

    // --- EXPORT TO CSV ---
    const exportToCSV = () => {
        const headers = ["Date", "Staff", "Start Time", "End Time", "Sales", "Expenses", "Expected Cash", "Actual Cash", "Variance"];
        
        const rows = filteredShifts.map(s => [
            new Date(s.startTime).toLocaleDateString(),
            s.userName,
            new Date(s.startTime).toLocaleTimeString(),
            s.endTime ? new Date(s.endTime).toLocaleTimeString() : '-',
            (s.stats?.totalSales || 0).toFixed(2),
            (s.stats?.expensesTotal || 0).toFixed(2),
            (s.systemCash || 0).toFixed(2),
            (s.endCash || 0).toFixed(2),
            (s.difference || 0).toFixed(2)
        ]);

        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Shift_Report_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- PRINT SUMMARY REPORT ---
    const handlePrintSummary = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateLabel = filterMode === 'TODAY' ? 'Today' : filterMode === 'MONTH' ? 'This Month' : filterMode === 'ALL' ? 'All' : `${startDate} to ${endDate}`;

        const html = `
            <!DOCTYPE html>
            <html dir="${settings.language === 'ar' ? 'rtl' : 'ltr'}">
            <head>
                <title>Shift Summary</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
                    .stat-box { border: 1px solid #ccc; padding: 15px; border-radius: 8px; text-align: center; }
                    .stat-label { font-size: 14px; color: #555; font-weight: bold; margin-bottom: 5px; }
                    .stat-value { font-size: 24px; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #f4f4f4; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #777; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${settings.restaurantName}</h2>
                    <h3>Shift Summary Report</h3>
                    <p>Period: ${dateLabel}</p>
                </div>

                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-label">Total Shifts</div>
                        <div class="stat-value">${summary.count}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Total Sales</div>
                        <div class="stat-value">${summary.sales.toFixed(2)} ${currency}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Total Expenses</div>
                        <div class="stat-value">${summary.expenses.toFixed(2)} ${currency}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Net Variance</div>
                        <div class="stat-value" style="color: ${summary.diff < 0 ? 'red' : 'green'}">
                            ${summary.diff.toFixed(2)} ${currency}
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Staff</th>
                            <th>Sales</th>
                            <th>Expenses</th>
                            <th>Variance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredShifts.map(s => `
                            <tr>
                                <td>${new Date(s.startTime).toLocaleDateString()}</td>
                                <td>${s.userName}</td>
                                <td>${(s.stats?.totalSales || 0).toFixed(2)}</td>
                                <td>${(s.stats?.expensesTotal || 0).toFixed(2)}</td>
                                <td style="color: ${s.difference && s.difference < 0 ? 'red' : 'inherit'}">${(s.difference || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };

    // Helpers for detailed view
    const getShiftExpenses = (shiftId: string) => expenses.filter(e => e.shiftId === shiftId);
    const getShiftDuration = (shift: Shift) => {
        if(!shift.endTime) return '0h';
        const diff = new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const getDiffColor = (diff: number | undefined) => {
        if (!diff) return 'text-slate-500';
        if (Math.abs(diff) < 0.5) return 'text-green-600';
        if (diff > 0) return 'text-blue-600';
        return 'text-red-600';
    };

    return (
        <div className="p-4 lg:p-8 min-h-screen bg-slate-50 pb-20 relative font-sans">
            
            {/* Header & Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
                        <FileText size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">{t('history_title')}</h1>
                        <p className="text-slate-500 font-bold mt-1">{t('history_desc')}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handlePrintSummary}
                        disabled={filteredShifts.length === 0}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Printer size={18} />
                        <span className="hidden md:inline">{t('history_print')}</span>
                    </button>
                    <button 
                        onClick={exportToCSV}
                        disabled={filteredShifts.length === 0}
                        className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} />
                        <span>{t('history_export')}</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold">
                    <Filter size={18} />
                    <span>Filter:</span>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {[
                        { id: 'TODAY', label: t('filter_today') },
                        { id: 'MONTH', label: t('filter_month') },
                        { id: 'ALL', label: t('filter_all') },
                        { id: 'CUSTOM', label: t('filter_custom') },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setFilterMode(opt.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterMode === opt.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {filterMode === 'CUSTOM' && (
                    <div className="flex items-center gap-2 flex-1 w-full md:w-auto animate-in fade-in">
                        <div className="relative flex-1">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none"
                            />
                            <Calendar size={16} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                        </div>
                        <span className="text-slate-400 font-bold">-</span>
                        <div className="relative flex-1">
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none"
                            />
                            <Calendar size={16} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Cards (Filtered) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold mb-1">Closed Shifts</p>
                    <p className="text-xl font-black text-slate-900">{summary.count}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold mb-1">{t('shift_net_sales')}</p>
                    <p className="text-xl font-black text-indigo-600">{summary.sales.toFixed(0)} {currency}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold mb-1">{t('shift_expenses_total')}</p>
                    <p className="text-xl font-black text-red-600">{summary.expenses.toFixed(0)} {currency}</p>
                </div>
                <div className={`p-4 rounded-2xl border shadow-sm ${summary.diff < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    <p className={`text-xs font-bold mb-1 ${summary.diff < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {summary.diff < 0 ? t('shift_shortage') : t('shift_surplus')}
                    </p>
                    <p className={`text-xl font-black ${summary.diff < 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {summary.diff.toFixed(2)} {currency}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-5">{t('history_col_date')}</th>
                                <th className="px-6 py-5">{t('history_col_staff')}</th>
                                <th className="px-6 py-5">{t('history_col_duration')}</th>
                                <th className="px-6 py-5">Start Cash</th>
                                <th className="px-6 py-5">{t('history_col_sales')}</th>
                                <th className="px-6 py-5">Expenses</th>
                                <th className="px-6 py-5">{t('history_col_diff')}</th>
                                <th className="px-6 py-5 text-center">{t('details')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredShifts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                                        <FileText size={48} className="mx-auto mb-3 opacity-30" />
                                        <p className="font-bold">No records found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredShifts.map((shift) => {
                                    const diff = shift.difference || 0;
                                    
                                    return (
                                        <tr key={shift.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-sm">{new Date(shift.startTime).toLocaleDateString()}</span>
                                                    <span className="text-xs text-slate-400 font-bold mt-0.5">{new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                        {shift.userName.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">{shift.userName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                                                    {getShiftDuration(shift)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{shift.startCash.toFixed(2)}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                {shift.stats?.totalSales.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-red-500">
                                                {shift.stats?.expensesTotal.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-1 font-black text-sm ${getDiffColor(diff)}`}>
                                                    {Math.abs(diff) < 0.5 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                                    <span>{Math.abs(diff) < 0.5 ? 'OK' : diff.toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => setSelectedShift(shift)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAILED MODAL */}
            {selectedShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">{t('shift_close_summary')}</h2>
                                <p className="text-sm text-slate-500 font-bold flex items-center gap-2 mt-1">
                                    <Clock size={14} />
                                    {new Date(selectedShift.startTime).toLocaleString()} 
                                    <span className="text-slate-300">|</span>
                                    By: {selectedShift.userName}
                                </p>
                            </div>
                            <button onClick={() => setSelectedShift(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                                    <p className="text-xs font-bold text-green-600 uppercase mb-1 flex items-center gap-1"><TrendingUp size={14}/> {t('shift_net_sales')}</p>
                                    <p className="text-2xl font-black text-slate-900">{selectedShift.stats?.totalSales.toFixed(2)} {currency}</p>
                                    <div className="flex gap-2 mt-2 text-xs font-bold text-slate-500">
                                        <span>Cash: {selectedShift.stats?.cashSales.toFixed(2)}</span>
                                        <span className="text-slate-300">|</span>
                                        <span>Card: {selectedShift.stats?.cardSales.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                                    <p className="text-xs font-bold text-red-600 uppercase mb-1 flex items-center gap-1"><Wallet size={14}/> {t('shift_expenses_total')}</p>
                                    <p className="text-2xl font-black text-red-600">-{selectedShift.stats?.expensesTotal.toFixed(2)} {currency}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><DollarSign size={14}/> {t('shift_cash_drawer')}</p>
                                    <p className="text-2xl font-black text-slate-900">{selectedShift.systemCash?.toFixed(2)} {currency}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">System Calculated</p>
                                </div>
                            </div>

                            {/* Expenses Detail List */}
                            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Expense Details</h3>
                            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden mb-6">
                                {getShiftExpenses(selectedShift.id).length > 0 ? (
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-slate-100 text-slate-500 font-bold">
                                            <tr>
                                                <th className="p-3">Time</th>
                                                <th className="p-3">Description</th>
                                                <th className="p-3">Type</th>
                                                <th className="p-3">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {getShiftExpenses(selectedShift.id).map(exp => (
                                                <tr key={exp.id}>
                                                    <td className="p-3 text-slate-500 font-mono text-xs">{new Date(exp.date).toLocaleTimeString()}</td>
                                                    <td className="p-3 font-bold text-slate-800">{exp.description}</td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600">
                                                            {exp.category}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-black text-red-500 dir-ltr text-left">-{exp.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 font-bold text-sm">
                                        No expenses recorded
                                    </div>
                                )}
                            </div>

                            {/* Closing Info */}
                            <div className="flex gap-4 items-center p-4 bg-slate-900 text-white rounded-2xl">
                                <div className={`p-3 rounded-full ${Math.abs(selectedShift.difference || 0) < 0.5 ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {Math.abs(selectedShift.difference || 0) < 0.5 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400 font-bold uppercase">Result</p>
                                    <p className="font-bold text-lg">
                                        {Math.abs(selectedShift.difference || 0) < 0.5 
                                            ? t('shift_matched') 
                                            : `${selectedShift.difference! > 0 ? t('shift_surplus') : t('shift_shortage')} of ${Math.abs(selectedShift.difference!)}`}
                                    </p>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-slate-400 font-bold">{t('shift_actual_cash')}</p>
                                    <p className="text-2xl font-black text-white">{selectedShift.endCash?.toFixed(2)}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftHistory;
