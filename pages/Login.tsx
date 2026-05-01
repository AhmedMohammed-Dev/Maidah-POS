
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Lock, User, Github, Linkedin, Zap, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, t, settings } = useStore();
  const navigate = useNavigate();

  // Determine Direction
  const isRTL = settings.language === 'ar';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate a small delay for better UX feeling
    setTimeout(() => {
        if (login(username, password)) {
          navigate('/');
        } else {
          setError(t('login_error'));
          setIsLoading(false);
        }
    }, 600);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900">
      
      {/* Right Side - Image & Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=1974&auto=format&fit=crop" 
                alt="POS Background" 
                className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/90 to-primary-900/40"></div>
        </div>

        <div className="relative z-10 text-center p-12 max-w-lg">
            <div className="mb-8 flex justify-center">
                <div className="p-6 bg-white/10 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20">
                    <Logo size={100} />
                </div>
            </div>
            <h1 className="text-5xl font-black text-white mb-6 leading-tight">{t('systemTitle')}</h1>
            <p className="text-slate-300 text-lg font-medium leading-relaxed">
                {t('systemSubtitle')}
            </p>
        </div>

        {/* Decor Circles */}
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary-600 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
      </div>

      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-slate-50 relative overflow-y-auto">
         <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-slate-100 relative z-10">
            <div className={`mb-10 text-center ${isRTL ? 'lg:text-right' : 'lg:text-left'}`}>
                <div className="lg:hidden flex justify-center mb-6">
                    <Logo size={64} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">{t('login_title')}</h2>
                <p className="text-slate-500 font-bold">{t('login_desc')}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">{t('username')}</label>
                    <div className="relative group">
                        <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                            <User className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`block w-full py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                            placeholder="admin"
                            dir="ltr"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">{t('password')}</label>
                    <div className="relative group">
                        <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                            <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`block w-full py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                            placeholder="••••••••"
                            dir="ltr"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl shadow-slate-900/20 transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span>{t('login_btn')}</span>
                            {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center flex flex-col items-center gap-3">
                 <p className="text-xs text-slate-400 font-bold">
                    {t('systemTitle')} - {t('version')}
                 </p>
                 <div className="flex gap-2">
                    <a href="https://github.com/AhmedMohammed-Dev" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-900 transition-colors font-bold px-3 py-1 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200">
                        <Github size={12} />
                        <span>GitHub</span>
                    </a>
                    <a href="https://www.linkedin.com/in/ahmedmohammedmohammed/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-blue-700 transition-colors font-bold px-3 py-1 rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-100">
                        <Linkedin size={12} />
                        <span>LinkedIn</span>
                    </a>
                 </div>
                 <p className="text-[10px] text-slate-300 font-medium">{t('developedBy')} Ahmed Mohammed</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Login;
