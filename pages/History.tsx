import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Order, OrderStatus } from '../types';
import { Search, Calendar, Printer, Filter, Clock, User, FileText, Download, Eye, XCircle, CheckCircle, ChevronDown, ListFilter, UserCheck, Banknote, CreditCard, Wallet, ArrowRight } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

const History = () => {
  const { orders, currency, t, settings } = useStore();
  const isRTL = settings.language === 'ar';
  
  const getLocalDateString = (date = new Date()) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: getLocalDateString(),
    end: getLocalDateString()
  });
  const [filterMode, setFilterMode] = useState<'ALL' | 'DATE_RANGE'>('DATE_RANGE');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (filterMode === 'DATE_RANGE') {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);

      result = result.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    }

    if (statusFilter !== 'ALL') {
        result = result.filter(o => o.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.customerName?.toLowerCase().includes(q) ||
        (o.createdBy && o.createdBy.toLowerCase().includes(q)) ||
        (typeof o.tableNumber === 'string' && o.tableNumber.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [orders, filterMode, dateRange, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      count: filteredOrders.length,
      revenue: filteredOrders.reduce((sum, o) => sum + o.total, 0),
      successful: filteredOrders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.SERVED).length,
      cancelled: filteredOrders.filter(o => o.status === OrderStatus.CANCELLED).length
    };
  }, [filteredOrders]);

  const exportToCSV = () => {
    const headers = [t('history_col_order'), t('history_col_time'), t('history_col_staff'), t('history_col_customer'), t('history_col_method'), t('history_col_items'), t('history_col_total'), t('history_col_status')];
    const rows = filteredOrders.map(order => [
        `#${order.id.split('-')[1] || order.id}`,
        `${order.createdAt.toLocaleDateString()} ${order.createdAt.toLocaleTimeString()}`,
        order.createdBy || "N/A",
        order.customerName || "-",
        getPaymentLabel(order.paymentMethod),
        `"${order.items.map(i => `${i.quantity}x ${i.name}`).join(' - ')}"`,
        order.total,
        getStatusText(order.status)
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Order_Report_${getLocalDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderStatus.READY: return 'bg-purple-100 text-purple-700 border-purple-200';
      case OrderStatus.SERVED: return 'bg-teal-100 text-teal-700 border-teal-200';
      case OrderStatus.PAID: return 'bg-green-100 text-green-700 border-green-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusText = (status: OrderStatus) => {
      switch (status) {
        case OrderStatus.PENDING: return t('kds_pending');
        case OrderStatus.PREPARING: return t('kds_preparing');
        case OrderStatus.READY: return t('kds_ready');
        case OrderStatus.SERVED: return t('kds_mark_served');
        case OrderStatus.PAID: return t('history_stats_successful');
        case OrderStatus.CANCELLED: return t('kds_cancelled');
        default: return status;
      }
  };

  const getPaymentIcon = (method?: 'CASH' | 'QR' | 'CARD') => {
      switch(method) {
          case 'CASH': return <Banknote size={16} />;
          case 'QR': return <Wallet size={16} />;
          case 'CARD': return <CreditCard size={16} />;
          default: return <Banknote size={16} />;
      }
  };

  const getPaymentLabel = (method?: 'CASH' | 'QR' | 'CARD') => {
      switch(method) {
          case 'CASH': return t('payment_cash');
          case 'QR': return t('payment_qr');
          case 'CARD': return t('payment_card');
          default: return t('payment_cash');
      }
  };

  const handlePrintClick = (e: React.MouseEvent, order: Order) => {
      e.stopPropagation();
      setSelectedOrder(order);
  };

  const handleViewClick = (e: React.MouseEvent, order: Order) => {
      e.stopPropagation();
      setSelectedOrder(order);
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-slate-50 pb-20">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <FileText className="text-primary-500" size={32} />
              {t('history_page_title')}
          </h1>
          <p className="text-slate-500 font-bold mt-1">{t('history_page_desc')}</p>
        </div>
        
        <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 active:scale-95"
        >
            <Download size={18} />
            <span>{t('history_export')}</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row items-end lg:items-center gap-5">
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4 lg:col-span-3 w-full">
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('history_search_scope')}</label>
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button 
                              onClick={() => setFilterMode('DATE_RANGE')}
                              className={`flex-1 py-2.5 px-2 text-sm font-bold rounded-lg transition-all ${filterMode === 'DATE_RANGE' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              {t('history_date_specific')}
                          </button>
                          <button 
                              onClick={() => setFilterMode('ALL')}
                              className={`flex-1 py-2.5 px-2 text-sm font-bold rounded-lg transition-all ${filterMode === 'ALL' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              {t('history_date_all')}
                          </button>
                      </div>
                  </div>

                  {filterMode === 'DATE_RANGE' && (
                      <div className="md:col-span-8 lg:col-span-9 flex flex-col md:flex-row gap-4 items-end md:items-center w-full animate-in fade-in slide-in-from-right-2">
                          <div className="flex-1 w-full">
                              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('history_date_from')}</label>
                              <div className="relative group">
                                  <input 
                                      type="date" 
                                      value={dateRange.start}
                                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                      className="w-full pl-4 pr-10 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-primary-500 outline-none transition-colors"
                                  />
                                  <Calendar className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 text-slate-400 group-hover:text-primary-500 transition-colors pointer-events-none`} size={18} />
                              </div>
                          </div>
                          <div className="hidden md:flex text-slate-300 pb-3">
                              <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />
                          </div>
                          <div className="flex-1 w-full">
                              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('history_date_to')}</label>
                              <div className="relative group">
                                  <input 
                                      type="date" 
                                      value={dateRange.end}
                                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                      className="w-full pl-4 pr-10 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-primary-500 outline-none transition-colors"
                                  />
                                  <Calendar className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 text-slate-400 group-hover:text-primary-500 transition-colors pointer-events-none`} size={18} />
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4 lg:min-w-[450px]">
                   <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('history_status_filter')}</label>
                      <div className="relative">
                          <select 
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                              className={`w-full ${isRTL ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-primary-500 outline-none appearance-none cursor-pointer hover:bg-white transition-colors`}
                          >
                              <option value="ALL">{t('all_category')}</option>
                              {Object.values(OrderStatus).map(status => (
                                  <option key={status} value={status}>{getStatusText(status)}</option>
                              ))}
                          </select>
                          <ListFilter className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3.5 text-slate-400 pointer-events-none`} size={18} />
                          <ChevronDown className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-4 text-slate-400 pointer-events-none`} size={14} />
                      </div>
                   </div>

                   <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('search')}</label>
                      <div className="relative">
                          <input 
                              type="text" 
                              placeholder={t('history_quick_search')} 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className={`w-full ${isRTL ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-primary-500 outline-none hover:bg-white transition-colors placeholder:text-slate-400`}
                          />
                          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3.5 text-slate-400 pointer-events-none`} size={18} />
                      </div>
                   </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">{t('history_stats_count')}</p>
            <p className="text-3xl font-black text-slate-800">{stats.count}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">{t('history_stats_revenue')}</p>
            <p className="text-3xl font-black text-primary-600">{stats.revenue.toFixed(2)} <span className="text-sm text-slate-400 font-bold">{currency}</span></p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">{t('history_stats_successful')}</p>
            <p className="text-3xl font-black text-green-600">{stats.successful}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">{t('history_stats_cancelled')}</p>
            <p className="text-3xl font-black text-red-500">{stats.cancelled}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-right">
                 <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black tracking-wider">
                     <tr>
                         <th className="px-6 py-5">{t('history_col_order')}</th>
                         <th className="px-6 py-5">{t('history_col_time')}</th>
                         <th className="px-6 py-5">{t('history_col_staff')}</th>
                         <th className="px-6 py-5">{t('history_col_customer')}</th>
                         <th className="px-6 py-5">{t('history_col_method')}</th>
                         <th className="px-6 py-5">{t('history_col_items')}</th>
                         <th className="px-6 py-5">{t('history_col_status')}</th>
                         <th className="px-6 py-5">{t('history_col_total')}</th>
                         <th className="px-6 py-5 text-center">{t('actions')}</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {filteredOrders.length === 0 ? (
                         <tr>
                             <td colSpan={9} className="px-6 py-20 text-center text-slate-400">
                                 <p className="font-bold text-lg">{t('history_no_records')}</p>
                             </td>
                         </tr>
                     ) : (
                         filteredOrders.map(order => (
                             <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                 <td className="px-6 py-4"><span className="font-mono font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg text-sm border border-slate-200">#{order.id.split('-')[1] || order.id}</span></td>
                                 <td className="px-6 py-4">
                                     <div className="flex flex-col">
                                         <span className="text-sm font-bold text-slate-700">{order.createdAt.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</span>
                                         <span className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5"><Clock size={12} />{order.createdAt.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {hour: '2-digit', minute:'2-digit'})}</span>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4"><span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{order.createdBy || "N/A"}</span></td>
                                 <td className="px-6 py-4">
                                     <div className="font-bold text-slate-900 text-sm">{order.tableNumber === 'TA' ? t('order_type_takeaway') : `${t('table_number')} ${order.tableNumber}`}</div>
                                     {order.customerName && <div className="flex items-center gap-1 text-xs text-primary-600 mt-1 font-bold"><User size={12} />{order.customerName}</div>}
                                 </td>
                                 <td className="px-6 py-4">
                                     <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg w-fit">
                                         <span className="text-slate-400">{getPaymentIcon(order.paymentMethod)}</span>
                                         <span>{getPaymentLabel(order.paymentMethod)}</span>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 max-w-xs">
                                     <p className="text-sm font-bold text-slate-700 truncate">{order.items.map(i => `${i.quantity}x ${i.name}`).join('، ')}</p>
                                     <p className="text-xs text-slate-400 mt-0.5 font-bold">{order.items.length} {t('items_count')}</p>
                                 </td>
                                 <td className="px-6 py-4">
                                     <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${getStatusColor(order.status)}`}>
                                         <CheckCircle size={12} />
                                         {getStatusText(statusFilter === 'ALL' ? order.status : statusFilter as OrderStatus)}
                                     </span>
                                 </td>
                                 <td className="px-6 py-4"><span className="font-black text-slate-900 text-lg">{order.total.toFixed(2)}</span></td>
                                 <td className="px-6 py-4 text-center">
                                     <div className="flex justify-center gap-2">
                                         <button onClick={(e) => handleViewClick(e, order)} className="p-2 text-slate-500 hover:text-blue-600"><Eye size={18} /></button>
                                         <button onClick={(e) => handlePrintClick(e, order)} className="p-2 text-slate-500 hover:text-slate-900"><Printer size={18} /></button>
                                     </div>
                                 </td>
                             </tr>
                         ))
                     )}
                 </tbody>
             </table>
         </div>
      </div>

      {selectedOrder && (
          <InvoiceModal 
            order={selectedOrder}
            total={selectedOrder.total}
            currency={currency}
            onClose={() => setSelectedOrder(null)}
            onConfirm={() => {}} 
            initialView="RECEIPT"
          />
      )}
    </div>
  );
};

export default History;
