import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ShieldCheck, Key, Lock, Copy, CheckCircle2, AlertTriangle, Phone, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Activation = () => {
  const { settings, activateSystem } = useStore();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
      // Logic to determine if we are here because of expiration
      if (settings.licenseExpiryDate) {
          const expiry = new Date(settings.licenseExpiryDate);
          if (new Date() > expiry) {
              setIsExpired(true);
          } else {
              setIsExpired(false);
          }
      } else {
          setIsExpired(false);
      }
  }, [settings]);

  const handleCopy = () => {
    navigator.clipboard.writeText(settings.deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await activateSystem(inputKey);
    
    if (result.success) {
        setSuccess(true);
        setError('');
        setTimeout(() => {
            navigate('/login');
        }, 1500);
    } else {
        setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600 rounded-full blur-[150px] opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-20 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-white/30 ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>
                {success ? <CheckCircle2 size={40} className="text-green-400" /> : <Lock size={40} />}
            </div>

            <h1 className="text-3xl font-black text-white mb-2">
                {isExpired ? 'انتهت صلاحية الترخيص' : 'النظام محمي'}
            </h1>
            <p className="text-slate-300 mb-8 font-medium leading-relaxed">
                {isExpired 
                    ? 'عذراً، لقد انتهت مدة صلاحية نسختك الحالية. يرجى التواصل مع المزود للحصول على كود تجديد الاشتراك.'
                    : 'هذه النسخة من النظام مقفلة وتعمل على هذا الجهاز فقط. يرجى إدخال كود التفعيل للمتابعة.'}
            </p>

            {!success ? (
                <>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/10 mb-6 text-right">
                        <label className="text-xs font-bold text-slate-400 block mb-2">معرف الجهاز (Device ID)</label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-black/30 p-3 rounded-lg text-primary-400 font-mono font-bold tracking-wider text-center border border-white/5 select-all">
                                {settings.deviceId}
                            </code>
                            <button 
                                onClick={handleCopy}
                                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                title="نسخ المعرف"
                            >
                                {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            أرسل هذا الكود للمسؤول للحصول على مفتاح التفعيل
                        </p>
                    </div>

                    <form onSubmit={handleActivate} className="space-y-4">
                        <div className="text-right">
                            <label className="text-xs font-bold text-white block mb-2">
                                {isExpired ? 'كود التجديد (New Activation Key)' : 'كود التفعيل (Activation Key)'}
                            </label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={inputKey}
                                    onChange={(e) => setInputKey(e.target.value)}
                                    className="w-full p-4 pl-12 rounded-xl bg-white text-slate-900 font-mono font-bold text-lg focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all placeholder:text-slate-400"
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    dir="ltr"
                                />
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm font-bold flex items-center gap-2 justify-center animate-in fade-in">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isExpired ? <RefreshCw size={24} /> : <ShieldCheck size={24} />}
                            {isExpired ? 'تجديد الاشتراك' : 'تفعيل النظام'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                            <Phone size={16} />
                            <span>للدعم الفني: </span>
                            <span dir="ltr" className="font-mono text-white">01142191663</span>
                        </div>
                    </div>
                </>
            ) : (
                <div className="py-8 animate-in zoom-in duration-300">
                    <h3 className="text-2xl font-bold text-green-400 mb-2">تم التفعيل بنجاح!</h3>
                    <p className="text-slate-300">جاري توجيهك إلى النظام...</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Activation;