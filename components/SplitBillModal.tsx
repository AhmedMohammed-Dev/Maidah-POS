import React, { useState, useEffect } from 'react';
import { X, CheckCircle, CreditCard, Receipt, ArrowRight, ArrowLeft, ChevronsRight, ChevronsLeft, AlertCircle, Calculator } from 'lucide-react';
import { CartItem } from '../types';
import { useStore } from '../store';

interface SplitBillModalProps {
  cart: CartItem[];
  currency: string;
  onClose: () => void;
  onProceedToPay: (selectedItems: CartItem[]) => void;
}

const SplitBillModal: React.FC<SplitBillModalProps> = ({ cart, currency, onClose, onProceedToPay }) => {
  const { settings } = useStore();
  
  // State for two lists: Remaining (Left) and To Pay (Right)
  const [remainingItems, setRemainingItems] = useState<CartItem[]>([]);
  const [payingItems, setPayingItems] = useState<CartItem[]>([]);

  // Initialize: Copy cart to remainingItems
  useEffect(() => {
      // Deep copy to avoid reference issues
      setRemainingItems(JSON.parse(JSON.stringify(cart)));
  }, [cart]);

  // Helper to find item index
  const findItemIndex = (list: CartItem[], item: CartItem) => {
      return list.findIndex(i => i.id === item.id && i.selectedSize?.name === item.selectedSize?.name);
  };

  const moveItem = (item: CartItem, direction: 'TO_PAY' | 'TO_REMAIN', quantityToMove: number = 1) => {
      const sourceList = direction === 'TO_PAY' ? remainingItems : payingItems;
      const targetList = direction === 'TO_PAY' ? payingItems : remainingItems;
      const setSource = direction === 'TO_PAY' ? setRemainingItems : setPayingItems;
      const setTarget = direction === 'TO_PAY' ? setPayingItems : setRemainingItems;

      const sourceIndex = findItemIndex(sourceList, item);
      if (sourceIndex === -1) return;

      const sourceItem = sourceList[sourceIndex];
      const actualMoveQty = Math.min(quantityToMove, sourceItem.quantity);

      // 1. Update Source List
      const newSourceList = [...sourceList];
      if (sourceItem.quantity === actualMoveQty) {
          newSourceList.splice(sourceIndex, 1); // Remove completely
      } else {
          newSourceList[sourceIndex] = { ...sourceItem, quantity: sourceItem.quantity - actualMoveQty };
      }

      // 2. Update Target List
      const newTargetList = [...targetList];
      const targetIndex = findItemIndex(newTargetList, item);
      
      if (targetIndex > -1) {
          newTargetList[targetIndex] = { ...newTargetList[targetIndex], quantity: newTargetList[targetIndex].quantity + actualMoveQty };
      } else {
          newTargetList.push({ ...sourceItem, quantity: actualMoveQty });
      }

      setSource(newSourceList);
      setTarget(newTargetList);
  };

  const moveAll = (direction: 'TO_PAY' | 'TO_REMAIN') => {
      if (direction === 'TO_PAY') {
          // Merge remaining into paying
          const newPaying = [...payingItems];
          remainingItems.forEach(item => {
              const idx = findItemIndex(newPaying, item);
              if (idx > -1) {
                  newPaying[idx].quantity += item.quantity;
              } else {
                  newPaying.push({ ...item });
              }
          });
          setPayingItems(newPaying);
          setRemainingItems([]);
      } else {
          // Merge paying into remaining
          const newRemaining = [...remainingItems];
          payingItems.forEach(item => {
              const idx = findItemIndex(newRemaining, item);
              if (idx > -1) {
                  newRemaining[idx].quantity += item.quantity;
              } else {
                  newRemaining.push({ ...item });
              }
          });
          setRemainingItems(newRemaining);
          setPayingItems([]);
      }
  };

  // --- Financial Calculations with Tax ---
  const calculateDetails = (items: CartItem[]) => {
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * (settings.taxRate / 100);
      const total = subtotal + tax;
      return { subtotal, tax, total };
  };

  const payDetails = calculateDetails(payingItems);
  const remainDetails = calculateDetails(remainingItems);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <div className="p-2 bg-primary-100 text-primary-600 rounded-xl"><Receipt size={24} /></div>
                تقسيم الفاتورة
            </h3>
            <p className="text-slate-500 font-bold text-sm mt-1 mr-12">انقل الأصناف التي سيتم دفعها الآن إلى القائمة اليسرى</p>
          </div>
          <button onClick={onClose} className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 p-3 rounded-full transition-all border border-slate-100">
            <X size={24} />
          </button>
        </div>

        {/* Body - Split View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50">
            
            {/* RIGHT SIDE: Remaining Bill */}
            <div className="flex-1 flex flex-col border-l border-slate-200 bg-slate-50/50">
                <div className="p-4 bg-slate-100 border-b border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-slate-700">الفاتورة الأصلية / المتبقي</span>
                        <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold">{remainDetails.total.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-end gap-3 text-[10px] font-bold text-slate-400">
                        <span>مجموع: {remainDetails.subtotal.toFixed(2)}</span>
                        <span>+ ضريبة: {remainDetails.tax.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {remainingItems.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                            <CheckCircle size={48} className="mb-2" />
                            <p className="font-bold">الفاتورة فارغة بالكامل</p>
                        </div>
                    )}
                    {remainingItems.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary-200 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="bg-slate-100 text-slate-700 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm shrink-0">{item.quantity}</span>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-slate-500 font-bold">{item.price} {currency}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => moveItem(item, 'TO_PAY', 1)} className="p-2 bg-slate-50 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-lg transition-colors" title="نقل واحد">
                                    <ArrowLeft size={18} className="rtl:rotate-0" />
                                </button>
                                {item.quantity > 1 && (
                                    <button onClick={() => moveItem(item, 'TO_PAY', item.quantity)} className="p-2 bg-slate-50 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-lg transition-colors" title="نقل الكل">
                                        <ChevronsLeft size={18} className="rtl:rotate-0" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CENTER: Actions (Desktop) */}
            <div className="hidden lg:flex flex-col items-center justify-center p-4 gap-4 bg-white border-x border-slate-200 w-24 relative z-10 shadow-sm">
                <button onClick={() => moveAll('TO_PAY')} className="p-3 bg-slate-100 hover:bg-primary-100 text-slate-500 hover:text-primary-600 rounded-xl transition-all shadow-sm active:scale-95" title="نقل الجميع للدفع">
                    <ChevronsLeft size={24} />
                </button>
                <div className="h-px w-10 bg-slate-200 my-2"></div>
                <button onClick={() => moveAll('TO_REMAIN')} className="p-3 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-xl transition-all shadow-sm active:scale-95" title="إرجاع الجميع">
                    <ChevronsRight size={24} />
                </button>
            </div>

            {/* LEFT SIDE: Paying Now */}
            <div className="flex-1 flex flex-col bg-white">
                <div className="p-4 bg-primary-50 border-b border-primary-100">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-primary-800 flex items-center gap-2"><CreditCard size={18} /> للدفع الآن</span>
                        <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm font-bold">{payDetails.total.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-end gap-3 text-[10px] font-bold text-primary-600/70">
                        <span>مجموع: {payDetails.subtotal.toFixed(2)}</span>
                        <span>+ ضريبة: {payDetails.tax.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative">
                    {payingItems.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 m-4 rounded-2xl">
                            <ArrowRight size={48} className="mb-2 opacity-50 rtl:rotate-180" />
                            <p className="font-bold text-lg">اختر أصناف للدفع</p>
                            <p className="text-sm">اضغط على الأسهم لنقل الأصناف هنا</p>
                        </div>
                    )}
                    {payingItems.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="bg-primary-50/50 p-3 rounded-xl border border-primary-100 shadow-sm flex items-center justify-between group">
                            <div className="flex items-center gap-1">
                                {item.quantity > 1 && (
                                    <button onClick={() => moveItem(item, 'TO_REMAIN', item.quantity)} className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors" title="إرجاع الكل">
                                        <ChevronsRight size={18} className="rtl:rotate-0" />
                                    </button>
                                )}
                                <button onClick={() => moveItem(item, 'TO_REMAIN', 1)} className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors" title="إرجاع واحد">
                                    <ArrowRight size={18} className="rtl:rotate-0" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden text-left flex-row-reverse">
                                <span className="bg-white text-primary-700 border border-primary-100 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm shrink-0 shadow-sm">{item.quantity}</span>
                                <div className="min-w-0 text-right">
                                    <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-primary-600 font-bold">{item.price} {currency}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                <AlertCircle size={18} />
                <span>سيتم إنشاء فاتورة فرعية للأصناف المحددة فقط.</span>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto items-center">
                <div className="text-left px-4 flex flex-col items-end">
                    <p className="text-xs font-bold text-slate-400 uppercase">إجمالي المطلوب دفعه (شامل الضريبة)</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-black text-slate-900">{payDetails.total.toFixed(2)}</p>
                        <span className="text-sm font-bold text-slate-500">{currency}</span>
                    </div>
                    {payDetails.tax > 0 && (
                        <p className="text-[10px] text-slate-400 font-bold">
                            (منها {payDetails.tax.toFixed(2)} ضريبة)
                        </p>
                    )}
                </div>
                <button 
                    onClick={() => onProceedToPay(payingItems)}
                    disabled={payingItems.length === 0}
                    className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    <span>متابعة للدفع</span>
                    <ArrowLeft size={20} className="rtl:rotate-0" />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SplitBillModal;