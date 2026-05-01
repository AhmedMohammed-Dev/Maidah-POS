
import React, { useState, useEffect } from 'react';
import { generateLicenseKey } from '../utils/security'; // Updated Import
import { Key, Copy, CheckCircle, Shield, Calendar, Monitor, History, LogOut, Search, Laptop2, Lock, Ban, AlertTriangle, X } from 'lucide-react';

// Vendor History Type
interface LicenseRecord {
    id: string;
    deviceId: string;
    clientName: string;
    duration: string;
    key: string;
    createdAt: number;
    expiryDate: number;
    status: 'ACTIVE' | 'REVOKED';
}

const VendorPortal = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard State
  const [view, setView] = useState<'GENERATE' | 'HISTORY'>('GENERATE');
  
  // Generation State
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [clientName, setClientName] = useState('');
  const [duration, setDuration] = useState('30d');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [expiryPreview, setExpiryPreview] = useState<string>('');

  // Revocation State
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<LicenseRecord | null>(null);
  const [terminationKey, setTerminationKey] = useState('');

  // History State
  const [history, setHistory] = useState<LicenseRecord[]>([]);

  // --- LOGIC ---

  useEffect(() => {
      const savedHistory = localStorage.getItem('maidah_vendor_history');
      if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
      }
      
      // Check session
      if (sessionStorage.getItem('maidah_vendor_auth') === 'true') {
          setIsAuthenticated(true);
      }
  }, []);

  // Calculate preview on duration change
  useEffect(() => {
      const now = new Date();
      let addedTime = 0;
      
      if (duration.endsWith('m')) {
          const minutes = parseInt(duration.replace('m', ''));
          addedTime = minutes * 60 * 1000;
      } else {
          const days = parseInt(duration.replace('d', ''));
          addedTime = days * 24 * 60 * 60 * 1000;
      }

      if (duration === '40000d') {
          setExpiryPreview('مدى الحياة (2099)');
      } else {
          const futureDate = new Date(now.getTime() + addedTime);
          setExpiryPreview(futureDate.toLocaleString('ar-EG', { 
              year: 'numeric', month: 'long', day: 'numeric', 
              hour: '2-digit', minute: '2-digit' 
          }));
      }
  }, [duration]);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      // Hardcoded Vendor Password for Demo
      if (password === 'admin123') {
          setIsAuthenticated(true);
          sessionStorage.setItem('maidah_vendor_auth', 'true');
          setLoginError('');
      } else {
          setLoginError('كلمة المرور غير صحيحة');
      }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      sessionStorage.removeItem('maidah_vendor_auth');
  };

  const generateKey = async () => {
      if (!targetDeviceId) return;

      const now = new Date();
      let expiryTime = now.getTime();
      let durationLabel = '';

      if (duration.endsWith('m')) {
           const minutes = parseInt(duration.replace('m', ''));
           expiryTime += (minutes * 60 * 1000);
           durationLabel = `${minutes} دقيقة (تجريبي)`;
      } else {
           const days = parseInt(duration.replace('d', ''));
           if (days > 30000) {
               const future = new Date();
               future.setFullYear(2099);
               expiryTime = future.getTime();
               durationLabel = 'مدى الحياة';
           } else {
               expiryTime += (days * 24 * 60 * 60 * 1000);
               durationLabel = `${days} يوم`;
           }
      }

      const expiryTimestamp = expiryTime.toString();
      
      // NEW: Secure Generation
      const finalKey = await generateLicenseKey(targetDeviceId, expiryTimestamp);

      setGeneratedKey(finalKey);

      // Save to History
      const newRecord: LicenseRecord = {
          id: Date.now().toString(),
          deviceId: targetDeviceId,
          clientName: clientName || 'عميل غير مسجل',
          duration: durationLabel,
          key: finalKey,
          createdAt: Date.now(),
          expiryDate: expiryTime,
          status: 'ACTIVE'
      };

      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('maidah_vendor_history', JSON.stringify(updatedHistory));
  };

  const initiateRevoke = async (record: LicenseRecord) => {
      setRevokeTarget(record);
      
      // Generate Termination Key (Key valid for yesterday)
      const now = new Date();
      const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      const expiryTimestamp = yesterday.getTime().toString();
      
      const killKey = await generateLicenseKey(record.deviceId, expiryTimestamp);
      
      setTerminationKey(killKey);
      setShowRevokeModal(true);
  };

  const confirmRevoke = () => {
      if (!revokeTarget) return;

      // Update History Status
      const updatedHistory = history.map(rec => 
        rec.id === revokeTarget.id ? { ...rec, status: 'REVOKED' as const } : rec
      );
      setHistory(updatedHistory);
      localStorage.setItem('maidah_vendor_history', JSON.stringify(updatedHistory));
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // --- RENDER ---

  if (!isAuthenticated) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                  <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                          <Laptop2 className="text-white" size={32} />
                      </div>
                  </div>
                  <h1 className="text-2xl font-black text-white text-center mb-2">بوابة المطورين</h1>
                  <p className="text-slate-400 text-center text-sm font-bold mb-8">تسجيل الدخول للتحكم في التراخيص</p>
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                          <label className="block text-slate-500 text-xs font-bold mb-2 uppercase">كلمة المرور الرئيسية</label>
                          <div className="relative">
                              <input 
                                  type="password" 
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-700 focus:border-indigo-500 outline-none transition-all font-bold text-center tracking-widest"
                                  placeholder="••••••"
                              />
                              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                          </div>
                      </div>
                      
                      {loginError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
                              {loginError}
                          </div>
                      )}

                      <button 
                          type="submit"
                          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 mt-4"
                      >
                          دخول للوحة التحكم
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
                  M
              </div>
              <div>
                  <h2 className="font-bold text-white leading-tight">بوابة التراخيص</h2>
                  <p className="text-xs text-slate-500">لوحة التحكم</p>
              </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
              <button 
                  onClick={() => setView('GENERATE')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${view === 'GENERATE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                  <Key size={20} />
                  <span>توليد مفتاح جديد</span>
              </button>
              <button 
                  onClick={() => setView('HISTORY')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${view === 'HISTORY' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                  <History size={20} />
                  <span>سجل العمليات</span>
              </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
              <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-slate-800 hover:text-red-300 transition-all font-bold"
              >
                  <LogOut size={20} />
                  <span>تسجيل خروج</span>
              </button>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative">
          <div className="max-w-4xl mx-auto">
              
              {view === 'GENERATE' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <h1 className="text-3xl font-black text-white mb-2">إصدار ترخيص جديد</h1>
                      <p className="text-slate-400 mb-8 font-medium">قم بإدخال بيانات جهاز العميل لتوليد كود التفعيل المشفر.</p>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          
                          <div className="space-y-6">
                              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                                  <label className="block text-slate-400 text-xs font-bold mb-3 uppercase flex items-center gap-2">
                                      <Monitor size={14} />
                                      معرف الجهاز (Device ID)
                                  </label>
                                  <input 
                                      type="text" 
                                      value={targetDeviceId}
                                      onChange={(e) => setTargetDeviceId(e.target.value)}
                                      placeholder="DEV-XXXXXXXX-XXXXXXX"
                                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white font-mono placeholder:text-slate-700 focus:border-indigo-500 outline-none transition-all"
                                      dir="ltr"
                                  />
                                  <p className="text-[10px] text-slate-500 mt-2">انسخ المعرف من شاشة القفل في جهاز العميل</p>
                              </div>

                              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                                  <label className="block text-slate-400 text-xs font-bold mb-3 uppercase flex items-center gap-2">
                                      <Search size={14} />
                                      اسم العميل (اختياري)
                                  </label>
                                  <input 
                                      type="text" 
                                      value={clientName}
                                      onChange={(e) => setClientName(e.target.value)}
                                      placeholder="مثال: مطعم البركة"
                                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                                  />
                              </div>

                              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                                  <label className="block text-slate-400 text-xs font-bold mb-3 uppercase flex items-center gap-2">
                                      <Calendar size={14} />
                                      مدة الصلاحية
                                  </label>
                                  
                                  {/* TESTING OPTIONS */}
                                  <div className="mb-4">
                                      <p className="text-[10px] text-yellow-500 font-bold mb-2 uppercase tracking-wide">تجربة سريعة (Testing)</p>
                                      <div className="grid grid-cols-2 gap-3">
                                          {[
                                              { label: '1 دقيقة (تجريبي)', val: '1m', color: 'bg-yellow-900/20 border-yellow-600 text-yellow-500 hover:bg-yellow-900/40' },
                                              { label: '5 دقائق', val: '5m', color: 'bg-yellow-900/20 border-yellow-600 text-yellow-500 hover:bg-yellow-900/40' },
                                          ].map((opt) => (
                                              <button
                                                  key={opt.val}
                                                  onClick={() => setDuration(opt.val)}
                                                  className={`py-3 rounded-xl font-bold text-xs transition-all border ${
                                                      duration === opt.val 
                                                      ? 'bg-yellow-600 border-yellow-500 text-white shadow-lg shadow-yellow-600/20' 
                                                      : opt.color
                                                  }`}
                                              >
                                                  {opt.label}
                                              </button>
                                          ))}
                                      </div>
                                  </div>

                                  {/* PRODUCTION OPTIONS */}
                                  <div>
                                      <p className="text-[10px] text-indigo-400 font-bold mb-2 uppercase tracking-wide">الاشتراكات (Production)</p>
                                      <div className="grid grid-cols-3 gap-3">
                                          {[
                                              { label: 'شهر', val: '30d' },
                                              { label: '3 شهور', val: '90d' },
                                              { label: '6 شهور', val: '180d' },
                                              { label: 'سنة', val: '365d' },
                                              { label: 'سنتين', val: '730d' },
                                              { label: 'مدى الحياة', val: '40000d' },
                                          ].map((opt) => (
                                              <button
                                                  key={opt.val}
                                                  onClick={() => setDuration(opt.val)}
                                                  className={`py-3 rounded-xl font-bold text-xs transition-all border ${
                                                      duration === opt.val 
                                                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                                                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border-slate-800'
                                                  }`}
                                              >
                                                  {opt.label}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                                  
                                  <div className="mt-4 p-3 bg-black/20 rounded-xl border border-slate-800">
                                      <p className="text-[10px] text-slate-400 text-center">
                                          سيقفل النظام تلقائياً في: <br/>
                                          <span className="text-white font-bold text-sm dir-ltr">{expiryPreview}</span>
                                      </p>
                                  </div>
                              </div>

                              <button 
                                  onClick={generateKey}
                                  disabled={!targetDeviceId}
                                  className="w-full py-5 bg-white text-slate-900 rounded-xl font-black text-lg hover:bg-indigo-50 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                  <Shield size={24} />
                                  تشفير وإصدار الكود
                              </button>
                          </div>

                          {/* Result Panel */}
                          <div className="relative">
                              {generatedKey ? (
                                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl border border-indigo-500/30 sticky top-6 shadow-2xl animate-in zoom-in-95 duration-300">
                                      <div className="flex items-center gap-3 mb-6">
                                          <div className="p-2 bg-green-500 rounded-full">
                                              <CheckCircle size={24} className="text-white" />
                                          </div>
                                          <div>
                                              <h3 className="font-black text-white text-lg">تم التوليد بنجاح</h3>
                                              <p className="text-indigo-200 text-sm">تشفير HMAC-SHA256 نشط</p>
                                          </div>
                                      </div>

                                      <div className="space-y-4">
                                          <div>
                                              <label className="text-indigo-300 text-xs font-bold uppercase mb-1 block">كود التفعيل</label>
                                              <div className="relative group cursor-pointer" onClick={() => copyToClipboard(generatedKey)}>
                                                  <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/30 break-all font-mono text-sm leading-relaxed text-indigo-50 hover:bg-black/60 transition-colors">
                                                      {generatedKey}
                                                  </div>
                                                  <div className="absolute top-2 left-2 p-1.5 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <Copy size={14} />
                                                  </div>
                                              </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-500/20">
                                              <div>
                                                  <label className="text-slate-400 text-[10px] font-bold uppercase block">العميل</label>
                                                  <span className="font-bold text-white">{clientName || '-'}</span>
                                              </div>
                                              <div>
                                                  <label className="text-slate-400 text-[10px] font-bold uppercase block">انتهاء الصلاحية</label>
                                                  <span className="font-bold text-green-400 text-xs">
                                                       {expiryPreview}
                                                  </span>
                                              </div>
                                          </div>

                                          <button 
                                              onClick={() => copyToClipboard(generatedKey)}
                                              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                          >
                                              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                                              {copied ? 'تم النسخ' : 'نسخ الكود'}
                                          </button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="h-full border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 p-8 min-h-[300px]">
                                      <Key size={48} className="mb-4 opacity-20" />
                                      <p className="font-bold">بانتظار البيانات...</p>
                                  </div>
                              )}
                          </div>

                      </div>
                  </div>
              ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex justify-between items-center mb-8">
                          <div>
                              <h1 className="text-3xl font-black text-white">سجل التراخيص</h1>
                              <p className="text-slate-400 font-medium mt-1">إدارة الاشتراكات وإلغاء التراخيص</p>
                          </div>
                          <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-slate-400 font-mono font-bold">
                              {history.length} RECORDS
                          </div>
                      </div>

                      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                          <div className="overflow-x-auto">
                              <table className="w-full text-right text-sm">
                                  <thead className="bg-slate-950 text-slate-500 font-bold uppercase text-xs">
                                      <tr>
                                          <th className="p-4">العميل</th>
                                          <th className="p-4">الجهاز</th>
                                          <th className="p-4">تاريخ الإصدار</th>
                                          <th className="p-4">الصلاحية</th>
                                          <th className="p-4">الحالة</th>
                                          <th className="p-4">الإجراءات</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800">
                                      {history.map((record) => (
                                          <tr key={record.id} className="hover:bg-slate-800/50 transition-colors">
                                              <td className="p-4 font-bold text-white">{record.clientName}</td>
                                              <td className="p-4 font-mono text-slate-400 text-xs">{record.deviceId}</td>
                                              <td className="p-4 text-slate-400">{new Date(record.createdAt).toLocaleDateString('ar-EG')}</td>
                                              <td className="p-4 text-slate-400 font-bold">{record.duration}</td>
                                              <td className="p-4">
                                                  <span className={`px-2 py-1 rounded text-xs border font-bold ${
                                                      record.status === 'REVOKED' 
                                                      ? 'bg-red-900/50 text-red-300 border-red-500/20' 
                                                      : 'bg-green-900/50 text-green-300 border-green-500/20'
                                                  }`}>
                                                      {record.status === 'REVOKED' ? 'ملغي' : 'نشط'}
                                                  </span>
                                              </td>
                                              <td className="p-4 flex gap-2">
                                                  <button 
                                                      onClick={() => copyToClipboard(record.key)}
                                                      className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
                                                      title="نسخ الكود"
                                                  >
                                                      <Copy size={16} />
                                                  </button>
                                                  {record.status !== 'REVOKED' && (
                                                      <button 
                                                          onClick={() => initiateRevoke(record)}
                                                          className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-slate-700 rounded-lg"
                                                          title="إلغاء التفعيل"
                                                      >
                                                          <Ban size={16} />
                                                      </button>
                                                  )}
                                              </td>
                                          </tr>
                                      ))}
                                      {history.length === 0 && (
                                          <tr>
                                              <td colSpan={6} className="p-8 text-center text-slate-600 font-bold">
                                                  لا يوجد سجلات سابقة
                                              </td>
                                          </tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              )}

              {/* Revocation Modal */}
              {showRevokeModal && revokeTarget && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                          <div className="flex justify-between items-start mb-4">
                              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                  <Ban className="text-red-500" />
                                  إلغاء التفعيل
                              </h3>
                              <button onClick={() => setShowRevokeModal(false)} className="text-slate-500 hover:text-white">
                                  <X size={20} />
                              </button>
                          </div>
                          
                          <div className="mb-6">
                              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                  لإيقاف عمل النظام على جهاز العميل، قم بإدخال <b>كود الإلغاء</b> التالي في شاشة التفعيل الخاصة به.
                              </p>
                              
                              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-4">
                                  <label className="text-red-400 text-xs font-bold uppercase mb-2 block">كود الإلغاء (Kill Code)</label>
                                  <div className="flex gap-2">
                                      <code className="flex-1 bg-black/50 p-3 rounded-lg text-red-200 font-mono text-xs break-all border border-red-500/20 select-all">
                                          {terminationKey}
                                      </code>
                                      <button 
                                          onClick={() => copyToClipboard(terminationKey)}
                                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
                                      >
                                          {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                                      </button>
                                  </div>
                              </div>
                              
                              <p className="text-slate-500 text-xs flex items-center gap-1">
                                  <AlertTriangle size={12} />
                                  بمجرد إدخال هذا الكود، سيتم قفل النظام فوراً.
                              </p>
                          </div>

                          <div className="flex gap-3">
                              <button 
                                  onClick={() => setShowRevokeModal(false)}
                                  className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors"
                              >
                                  تراجع
                              </button>
                              <button 
                                  onClick={() => {
                                      confirmRevoke();
                                      setShowRevokeModal(false);
                                  }}
                                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                              >
                                  تأكيد الإلغاء
                              </button>
                          </div>
                      </div>
                  </div>
              )}

          </div>
      </main>
    </div>
  );
};

export default VendorPortal;
