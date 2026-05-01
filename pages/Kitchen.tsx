
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { OrderStatus, Order } from '../types';
import { Clock, CheckCircle, Loader2, Utensils, ExternalLink, Zap, AlertTriangle, XCircle, X } from 'lucide-react';

const Kitchen = () => {
  const { orders, updateOrderStatus, t, settings } = useStore();
  const isRTL = settings.language === 'ar';
  
  const [acknowledgedCancelledIds, setAcknowledgedCancelledIds] = useState<Set<string>>(new Set());
  const [tempCancelledOrders, setTempCancelledOrders] = useState<string[]>([]);

  useEffect(() => {
      const cancelled = orders.filter(o => o.status === OrderStatus.CANCELLED);
      cancelled.forEach(order => {
          if (!acknowledgedCancelledIds.has(order.id)) {
              setAcknowledgedCancelledIds(prev => new Set(prev).add(order.id));
              setTempCancelledOrders(prev => prev.includes(order.id) ? prev : [...prev, order.id]);
              setTimeout(() => {
                  setTempCancelledOrders(current => current.filter(id => id !== order.id));
              }, 7000);
          }
      });
  }, [orders, acknowledgedCancelledIds]); 

  const displayOrders = useMemo(() => {
      return orders.filter(o => {
          if (o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING || o.status === OrderStatus.READY) {
              return o.items.some(i => !i.isDonation);
          }
          if (o.status === OrderStatus.CANCELLED && tempCancelledOrders.includes(o.id)) {
              return true;
          }
          return false;
      }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [orders, tempCancelledOrders]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.READY: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return t('kds_pending');
      case OrderStatus.PREPARING: return t('kds_preparing');
      case OrderStatus.READY: return t('kds_ready');
      case OrderStatus.CANCELLED: return t('kds_cancelled');
      default: return status;
    }
  };

  const handleNextStatus = (orderId: string, currentStatus: OrderStatus) => {
    if (currentStatus === OrderStatus.CANCELLED) {
        setTempCancelledOrders(prev => prev.filter(id => id !== orderId));
        return;
    }
    let nextStatus = currentStatus;
    if (currentStatus === OrderStatus.PENDING) nextStatus = OrderStatus.PREPARING;
    else if (currentStatus === OrderStatus.PREPARING) nextStatus = OrderStatus.READY;
    else if (currentStatus === OrderStatus.READY) nextStatus = OrderStatus.SERVED;
    updateOrderStatus(orderId, nextStatus);
  };

  const formatTime = (date: Date) => {
      return date.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="p-4 lg:p-6 h-screen overflow-hidden flex flex-col bg-slate-100 font-sans">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            {t('kds_title')}
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                <Zap size={12} fill="currentColor" /> {t('kds_live')}
            </span>
        </h1>
        <div className="flex gap-2">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 font-bold">
                {displayOrders.length} {t('history_stats_count')}
            </div>
        </div>
      </div>

      {displayOrders.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[2rem] border-2 border-dashed border-slate-300">
            <Utensils size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-medium">{t('kds_no_orders')}</p>
         </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayOrders.map(order => (
              <div key={order.id} className={`bg-white rounded-[2rem] shadow-md border-2 overflow-hidden flex flex-col ${order.status === OrderStatus.READY ? 'border-green-400' : 'border-slate-200'}`}>
                <div className={`p-5 flex justify-between items-center ${order.status === OrderStatus.PENDING ? 'bg-yellow-50' : 'bg-slate-50'}`}>
                  <div>
                    <span className="text-xs text-slate-500 block uppercase font-bold">{t('table_number')}</span>
                    <span className="text-3xl font-black text-slate-900">#{order.tableNumber}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-black border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </div>
                </div>
                <div className="p-5 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-4 border-b border-slate-50 pb-2">
                        <Clock size={14} /> {formatTime(order.createdAt)}
                    </div>
                    <ul className="space-y-3">
                        {order.items.filter(i => !i.isDonation).map((item, idx) => (
                            <li key={idx} className="flex gap-3">
                                <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0">{item.quantity}</span>
                                <div>
                                    <p className="font-bold text-slate-800">{item.name}</p>
                                    {item.selectedSize && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold">{item.selectedSize.name}</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4 border-t border-slate-50 bg-slate-50">
                    <button onClick={() => handleNextStatus(order.id, order.status)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
                        <CheckCircle size={20} />
                        {order.status === OrderStatus.PENDING ? t('kds_start_prep') : order.status === OrderStatus.PREPARING ? t('kds_mark_ready') : t('kds_mark_served')}
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Kitchen;
