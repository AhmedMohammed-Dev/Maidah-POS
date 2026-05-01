
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Shield, User, Lock, ArrowLeft, ArrowRight, CheckCircle2, UserPlus } from 'lucide-react';
import Logo from '../components/Logo';

const Setup = () => {
  const { addUser, t, settings, login } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isRTL = settings.language === 'ar';

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !username || !password) {
        setError('يرجى ملء جميع الحقول');
        return;
    }

    if (password !== confirmPassword) {
        setError(t('setup_pass_mismatch'));
        return;
    }

    // Create First Admin
    const adminUser = {
        id: `admin-${Date.now()}`,
        name: name,
        username: username,
        password: password,
        role: 'ADMIN' as const
    };

    const added = addUser(adminUser);
    
    if (added) {
        setSuccess(true);
        // Auto login
        login(username, password);
        
        setTimeout(() => {
            navigate('/');
        }, 1500);
    } else {
        setError('حدث خطأ أثناء إنشاء الحساب');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      
      {/* Decorative Side */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div className="relative z-10 text-center max-w-lg">
            <div className="mb-10 flex justify-center">
                <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/20 ring-1 ring-white/10">
                    <Logo size={80} />
                </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-6 leading-tight">{t('setup_title')}</h1>
            <p className="text-indigo-200 text-xl font-medium leading-relaxed">
                {t('setup_desc')}
            </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 relative">
         <div className="w-full max-w-md">
            
            <div className="text-center mb-10">
                <div className="lg:hidden flex justify-center mb-6">
                    <Logo size={50} />
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm border border-indigo-100">
                    <Shield size={32} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">{t('setup_title')}</h2>
                <p className="text-slate-500 font-medium text-sm">{t('setup_desc')}</p>
            </div>

            <form onSubmit={handleSetup} className="space-y-5">
                
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('setup_admin_name')}</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full py-3.5 px-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            placeholder="ex: Ahmed Mohammed"
                        />
                        <div className={`absolute top-3.5 ${isRTL ? 'left-4' : 'right-4'} text-slate-400`}>
                            <UserPlus size={20} />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('setup_admin_user')}</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="block w-full py-3.5 px-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            placeholder="admin"
                            dir="ltr"
                        />
                        <div className={`absolute top-3.5 ${isRTL ? 'left-4' : 'right-4'} text-slate-400`}>
                            <User size={20} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('setup_admin_pass')}</label>
                        <div className="relative group">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full py-3.5 px-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                placeholder="••••"
                                dir="ltr"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('setup_admin_confirm')}</label>
                        <div className="relative group">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full py-3.5 px-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                placeholder="••••"
                                dir="ltr"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-red-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-4 bg-green-50 text-green-700 text-sm font-bold rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-green-100">
                        <CheckCircle2 size={18} />
                        {t('setup_success')}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={success}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-900/20 transform active:scale-[0.98] transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <span>{t('setup_create_btn')}</span>
                    {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                </button>
            </form>
         </div>
      </div>
    </div>
  );
};

export default Setup;
    