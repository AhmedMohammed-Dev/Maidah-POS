import React from 'react';
import { useStore } from '../store';
import { OrderStatus } from '../types';
import { CheckCircle2, Loader2, Maximize2 } from 'lucide-react';

const CustomerDisplay = () => {
  const { orders } = useStore();

  const readyOrders = orders
    .filter(o => o.status === OrderStatus.READY)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const preparingOrders = orders
    .filter(o => o.status === OrderStatus.PREPARING)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-20 bg-slate-950 flex items-center justify-between px-8 border-b border-slate-800">
          <h1 className="text-2xl font-black text-white">شاشة العملاء</h1>
          <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-bold text-slate-400">مباشر</span>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Preparing Column (Right Side in RTL) */}
        <div className="w-1/2 border-l border-slate-800 flex flex-col bg-slate-900 relative">
            <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
            <div className="p-6 bg-slate-800/50 border-b border-slate-700 flex items-center justify-center gap-4 z-10">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <h2 className="text-3xl font-black text-blue-100">تحت التجهيز</h2>
            </div>
            <div className="flex-1 p-6 overflow-y-auto z-10 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    {preparingOrders.map(order => (
                        <div key={order.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors"></div>
                            <span className="text-sm text-slate-400 block mb-2 font-bold">رقم الطلب</span>
                            <span className="text-5xl font-black text-white tracking-widest font-mono">
                                {order.id.split('-')[1]}
                            </span>
                        </div>
                    ))}
                </div>
                {preparingOrders.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 font-bold opacity-50">
                        <Loader2 size={48} className="mb-4" />
                        <p className="text-xl">لا توجد طلبات قيد التحضير</p>
                    </div>
                )}
            </div>
        </div>

        {/* Ready Column (Left Side in RTL) */}
        <div className="w-1/2 flex flex-col bg-green-900/10 relative">
            <div className="absolute inset-0 bg-green-500/5 pointer-events-none"></div>
            <div className="p-6 bg-green-900/20 border-b border-green-900/30 flex items-center justify-center gap-4 z-10">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <h2 className="text-3xl font-black text-green-100">جاهز للاستلام</h2>
            </div>
            <div className="flex-1 p-6 overflow-y-auto z-10 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    {readyOrders.map(order => (
                        <div key={order.id} className="bg-green-600 p-8 rounded-2xl shadow-xl shadow-green-900/20 text-center transform scale-100 animate-in zoom-in duration-300 border border-green-400/20">
                             <div className="flex items-center justify-center mb-2">
                                <CheckCircle2 size={24} className="text-green-200" />
                             </div>
                             <span className="text-sm text-green-100 block mb-2 font-bold">رقم الطلب</span>
                             <span className="text-6xl font-black text-white tracking-widest font-mono">
                                 {order.id.split('-')[1]}
                             </span>
                        </div>
                    ))}
                </div>
                {readyOrders.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 font-bold opacity-50">
                        <CheckCircle2 size={48} className="mb-4" />
                        <p className="text-xl">لا توجد طلبات جاهزة</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplay;