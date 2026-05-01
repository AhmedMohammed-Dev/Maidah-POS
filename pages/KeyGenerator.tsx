
import React, { useState } from 'react';
import { generateLicenseKey } from '../utils/security'; // Updated Import
import { Key, Copy, CheckCircle, Shield, Calendar, Monitor, AlertTriangle } from 'lucide-react';

const KeyGenerator = () => {
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [duration, setDuration] = useState('30d'); // Default 30 days
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  const generateKey = async () => {
      if (!targetDeviceId) return;

      const now = new Date();
      let expiryTime = now.getTime();

      // Parse duration logic
      if (duration.endsWith('m')) {
          // Minutes
          const minutes = parseInt(duration.replace('m', ''));
          expiryTime += (minutes * 60 * 1000);
      } else if (duration.endsWith('d')) {
          // Days
          const days = parseInt(duration.replace('d', ''));
          if (days > 30000) {
             const future = new Date();
             future.setFullYear(2099);
             expiryTime = future.getTime();
          } else {
             expiryTime += (days * 24 * 60 * 60 * 1000);
          }
      }

      const expiryTimestamp = expiryTime.toString();

      // Use Secure Async Generation
      const finalKey = await generateLicenseKey(targetDeviceId, expiryTimestamp);
      
      setGeneratedKey(finalKey);
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
         <div className="bg-slate-950 p-6 border-b border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                <Shield size={32} />
            </div>
            <div>
                <h1 className="text-2xl font-black text-white">مولد مفاتيح التفعيل</h1>
                <p className="text-slate-400 font-bold">نظام المائدة - لوحة المطور (Legacy)</p>
            </div>
         </div>

         <div className="p-8 space-y-8">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="text-blue-400 shrink-0 mt-1" />
                <div className="text-sm text-blue-200">
                    <p className="font-bold mb-1">تعليمات الاستخدام:</p>
                    <p>استخدم هذه الأداة لتوليد أكواد تفعيل لعملائك. اطلب من العميل إرسال "معرف الجهاز" الخاص به، ثم اختر مدة الاشتراك المناسبة.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-slate-300 text-sm font-bold mb-2 flex items-center gap-2">
                        <Monitor size={16} />
                        معرف جهاز العميل (Device ID)
                    </label>
                    <input 
                        type="text" 
                        value={targetDeviceId}
                        onChange={(e) => setTargetDeviceId(e.target.value)}
                        placeholder="DEV-XXXXXXXX-XXXXXXX"
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white font-mono placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        dir="ltr"
                    />
                </div>

                <div>
                    <label className="block text-slate-300 text-sm font-bold mb-2 flex items-center gap-2">
                        <Calendar size={16} />
                        مدة الصلاحية
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'دقيقة (تجربة)', val: '1m', color: 'bg-yellow-600/20 border-yellow-600 text-yellow-500' },
                            { label: '5 دقائق', val: '5m', color: 'bg-yellow-600/20 border-yellow-600 text-yellow-500' },
                            { label: 'شهر واحد', val: '30d' },
                            { label: '3 شهور', val: '90d' },
                            { label: '6 شهور', val: '180d' },
                            { label: 'سنة كاملة', val: '365d' },
                            { label: 'مدى الحياة', val: '40000d' },
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => setDuration(opt.val)}
                                className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                                    duration === opt.val 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                                    : opt.color || 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={generateKey}
                    disabled={!targetDeviceId}
                    className="w-full py-4 bg-white text-slate-900 rounded-xl font-black text-lg hover:bg-indigo-50 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Key size={20} />
                    توليد الكود
                </button>
            </div>

            {generatedKey && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-4">
                    <label className="block text-indigo-400 text-xs font-bold mb-2 uppercase tracking-wider">كود التفعيل الناتج</label>
                    <div className="flex gap-2">
                        <code className="flex-1 bg-black/50 p-4 rounded-xl text-white font-mono break-all border border-slate-800 text-sm leading-relaxed select-all">
                            {generatedKey}
                        </code>
                        <button 
                            onClick={copyToClipboard}
                            className={`px-4 rounded-xl flex flex-col items-center justify-center gap-1 min-w-[80px] transition-all ${copied ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                            <span className="text-[10px] font-bold">{copied ? 'منسوخ' : 'نسخ'}</span>
                        </button>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-slate-500 text-xs">
                             ينتهي في: <span className="text-slate-300 font-bold">
                                {duration.endsWith('m') 
                                    ? `${parseInt(duration)} دقائق من لحظة التوليد`
                                    : new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG')
                                }
                             </span>
                        </p>
                    </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default KeyGenerator;
