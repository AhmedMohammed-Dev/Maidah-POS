import { Printer, X, CheckCircle, Banknote, Copy, Share2, Receipt, CreditCard, Calculator, AlertCircle, Wallet, Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { useStore } from '../store';

interface InvoiceModalProps {
  total: number;
  currency: string;
  onClose: () => void;
  onConfirm: (method: 'CASH' | 'QR' | 'CARD') => void;
  order: Order | null;
  initialView?: 'PAYMENT' | 'RECEIPT';
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ 
  total, 
  currency,
  onClose, 
  onConfirm, 
  order, 
  initialView = 'PAYMENT' 
}) => {
  const { settings, t } = useStore();
  const [step, setStep] = useState<'PAYMENT' | 'RECEIPT'>(initialView);
  const [method, setMethod] = useState<'CASH' | 'QR' | 'CARD'>('CASH');
  const [copied, setCopied] = useState(false);
  
  const [cashReceived, setCashReceived] = useState<string>('');
  const [changeDue, setChangeDue] = useState<number>(0);

  const WALLET_NUMBER = settings.phone || "0000000000";
  const displayTotal = order ? order.total : total;
  const taxRate = settings.taxRate;
  
  const calculatedSubtotal = displayTotal / (1 + taxRate/100);
  const calculatedTax = displayTotal - calculatedSubtotal;

  const displaySubtotalStr = calculatedSubtotal.toFixed(2);
  const displayTaxStr = calculatedTax.toFixed(2);
  const displayTotalStr = displayTotal.toFixed(2);

  useEffect(() => {
    const received = parseFloat(cashReceived) || 0;
    if (received >= displayTotal) {
      setChangeDue(received - displayTotal);
    } else {
      setChangeDue(0);
    }
  }, [cashReceived, displayTotal]);

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount.toString());
  };

  const handleClearCash = () => {
    setCashReceived('');
  };

  const generateReceiptHtml = () => {
    if (!order) return '';
    const isRTL = settings.language === 'ar';
    const lang = settings.language || 'ar';
    const labels = {
        receipt: t('receipt_total'),
        orderNo: t('inv_order_no'),
        table: t('table_number'),
        takeaway: t('order_type_takeaway'),
        customer: t('customer_name'),
        payment: t('history_col_method'),
        cash: t('payment_cash'),
        card: t('payment_card'),
        qr: t('payment_qr'),
        subtotal: t('receipt_subtotal'),
        tax: t('receipt_tax'),
        total: t('receipt_total'),
        received: t('inv_cash_received'),
        change: t('inv_change_due')
    };

    const receiptWidth = settings.printerWidth === '58mm' ? '58mm' : '80mm';
    const logoHtml = settings.logo ? `<div style="text-align:center;margin-bottom:10px;"><img src="${settings.logo}" style="max-width:60%;max-height:80px;filter:grayscale(100%);"/></div>` : '';

    const itemsHtml = order.items.map(item => `
      <div style="margin-bottom:8px;font-size:12px;font-weight:bold;">
        <div style="display:flex;justify-content:space-between;">
           <span>${item.name} ${item.selectedSize ? `(${item.selectedSize.name})` : ''}</span>
           <span>${(item.price * item.quantity).toFixed(2)}</span>
        </div>
        <div style="font-size:10px;color:#555;">${item.quantity} x ${item.price}</div>
      </div>
    `).join('');

    return `
      <html lang="${lang}" dir="${isRTL ? 'rtl' : 'ltr'}">
      <body style="font-family:sans-serif;width:${receiptWidth};margin:0 auto;padding:10px;">
        ${logoHtml}
        <h2 style="text-align:center;margin:5px 0;">${settings.restaurantName}</h2>
        <p style="text-align:center;font-size:12px;">${settings.address}</p>
        <hr style="border-top:1px dashed #000;"/>
        <div style="font-size:11px;">
          <p>${labels.orderNo}: ${order.id.split('-')[1]}</p>
          <p>${labels.payment}: ${order.paymentMethod}</p>
        </div>
        <hr style="border-top:1px solid #000;"/>
        ${itemsHtml}
        <hr style="border-top:1px dashed #000;"/>
        <div style="font-weight:bold;">
          <div style="display:flex;justify-content:space-between;"><span>${labels.subtotal}:</span><span>${displaySubtotalStr}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:16px;margin-top:10px;"><span>${labels.total}:</span><span>${displayTotalStr} ${settings.currency}</span></div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const htmlContent = generateReceiptHtml();
    if (!htmlContent) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute'; iframe.style.width = '0px'; iframe.style.height = '0px';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open(); doc.write(htmlContent); doc.close();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    }
  };

  const handlePay = () => {
    if (method === 'CASH') {
        const received = parseFloat(cashReceived) || 0;
        if (received < displayTotal && cashReceived !== '') return;
    }
    onConfirm(method);
    setStep('RECEIPT');
  };

  if (step === 'PAYMENT') {
    const isInsufficient = method === 'CASH' && cashReceived !== '' && (parseFloat(cashReceived) || 0) < displayTotal;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 pb-4 flex justify-between items-center shrink-0">
            <h3 className="text-2xl font-black text-slate-800">{t('checkout_title')}</h3>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg mb-6 text-center">
                <p className="text-slate-400 font-bold mb-1 text-xs uppercase tracking-widest">{t('inv_total_required')}</p>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-5xl font-black tracking-tight">{displayTotalStr}</span>
                    <span className="text-xl text-slate-400 font-bold">{currency}</span>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <button onClick={() => setMethod('CASH')} className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${method === 'CASH' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <div className={`p-3 rounded-xl ${method === 'CASH' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-500'}`}><Banknote size={24} /></div>
                    <div className="text-right flex-1 font-bold text-lg">{t('inv_pay_cash')}</div>
                    {method === 'CASH' && <CheckCircle className="text-primary-500" size={20} />}
                </button>

                {method === 'CASH' && (
                    <div className="bg-white p-5 rounded-3xl border-2 border-primary-100 shadow-sm space-y-4 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase flex justify-between tracking-widest">
                                <span>{t('inv_cash_received')}</span>
                                <span className="text-primary-600 font-black">{currency}</span>
                            </label>
                            <div className="relative">
                                <input 
                                    type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} autoFocus
                                    className={`w-full p-6 bg-slate-50 border-2 rounded-2xl font-black text-5xl text-slate-900 text-center focus:bg-white outline-none transition-all ${isInsufficient ? 'border-red-300' : 'border-slate-200 focus:border-primary-500'}`}
                                    placeholder="0"
                                />
                                {cashReceived && <button onClick={handleClearCash} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleQuickCash(Math.ceil(displayTotal))} className="py-3 bg-white text-primary-600 rounded-xl text-xs font-black border-2 border-primary-100 transition-colors hover:bg-primary-50">بالضبط</button>
                            {[50, 100, 200].map(amt => <button key={amt} onClick={() => handleQuickCash(amt)} className="py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-black border-2 border-slate-200 hover:bg-slate-200 transition-colors">{amt}</button>)}
                        </div>

                        <div className={`p-5 rounded-2xl border-2 flex flex-col ${changeDue > 0 ? 'bg-green-50 border-green-200' : isInsufficient ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                            <span className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">{t('inv_change_due')}</span>
                            <div className="flex justify-between items-baseline">
                                <span className={`text-4xl font-black ${changeDue > 0 ? 'text-green-700' : isInsufficient ? 'text-red-700' : 'text-slate-400'}`}>
                                    {isInsufficient ? '-' : ''}{changeDue > 0 ? changeDue.toFixed(2) : '0.00'}
                                </span>
                                <span className="text-sm font-bold text-slate-400">{currency}</span>
                            </div>
                        </div>
                        
                        {isInsufficient && (
                            <div className="p-3 bg-red-100 text-red-700 rounded-xl text-xs font-black flex items-center gap-2 animate-pulse">
                                <AlertCircle size={14} /> {t('inv_insufficient_cash')}
                            </div>
                        )}
                    </div>
                )}

                <button onClick={() => setMethod('CARD')} className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${method === 'CARD' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <div className={`p-3 rounded-xl ${method === 'CARD' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><CreditCard size={24} /></div>
                    <div className="text-right flex-1 font-bold text-lg">{t('inv_pay_card')}</div>
                    {method === 'CARD' && <CheckCircle className="text-blue-500" size={20} />}
                </button>

                <button onClick={() => setMethod('QR')} className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${method === 'QR' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <div className={`p-3 rounded-xl ${method === 'QR' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Wallet size={24} /></div>
                    <div className="text-right flex-1 font-bold text-lg">{t('inv_pay_qr')}</div>
                    {method === 'QR' && <CheckCircle className="text-indigo-500" size={20} />}
                </button>
            </div>
          </div>

          <div className="p-6 shrink-0 border-t border-slate-50">
             <button onClick={handlePay} disabled={isInsufficient} className={`w-full py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-2 ${isInsufficient ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98]'}`}>
                 <span>{t('inv_confirm_receipt')}</span>
                 <CheckCircle size={24} />
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in">
        <div className="w-full max-w-sm flex flex-col gap-6 items-center animate-in zoom-in-95 duration-300">
            <div className="bg-green-500 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
                <CheckCircle size={18} fill="currentColor" className="text-green-800" />
                <span className="font-bold text-sm">{t('inv_success')}</span>
            </div>
            <div className="w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 mb-1">{settings.restaurantName}</h2>
                <p className="text-xs text-slate-400 font-bold mb-6">{settings.address}</p>
                <div className="py-6 border-y border-slate-100">
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{t('inv_order_no')}</p>
                    <p className="text-3xl font-black text-slate-900 font-mono">#{order?.id.split('-')[1]}</p>
                    <div className="mt-4 flex justify-between items-center text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl">
                        <span>{t('receipt_total')}</span>
                        <span>{displayTotalStr} {currency}</span>
                    </div>
                </div>
                <div className="mt-6 flex gap-3">
                    <button onClick={handlePrint} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"><Printer size={18} /> {t('inv_print')}</button>
                    <button onClick={onClose} className="p-4 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"><X size={20}/></button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default InvoiceModal;
