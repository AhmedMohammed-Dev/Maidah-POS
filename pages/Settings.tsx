
import React, { useState } from 'react';
import { useStore } from '../store';
import { Save, Printer, CheckCircle, Store, Coins, Wallet, Trash2, RefreshCw, Upload, Image as ImageIcon, Info, Monitor, Lock, AlertCircle, X, Percent, Heart, Coffee, Smartphone, Copy, ExternalLink, Zap, Infinity, Download, CreditCard, Star, Github, Linkedin, LayoutGrid, Globe, ShieldCheck, Landmark } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';
import { Order, OrderStatus } from '../types';

const Settings = () => {
  const { settings, updateSettings, resetSystem, currency, currentUser, t } = useStore();
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [showTestPrint, setShowTestPrint] = useState(false);
  
  // Factory Reset Security State
  const [showResetModal, setShowResetModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [resetError, setResetError] = useState('');
  
  // Developer Donation State
  const [copiedDev, setCopiedDev] = useState<string | null>(null);

  // --- DEVELOPER INFO ---
  const DEVELOPER_INFO = {
      name: "Ahmed Mohammed",
      github: "https://github.com/AhmedMohammed-Dev",
      linkedin: "https://www.linkedin.com/in/ahmedmohammedmohammed/",
      vodafoneCash: "01142191663",
      paypal: "@Ahmedmuham",
      message: t('settings_dev_message')
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, logo: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Ensure numeric fields are stored as numbers
    const settingsToSave = {
        ...formData,
        defaultStartCash: Number(formData.defaultStartCash),
        costPercentageDanger: Number(formData.costPercentageDanger),
        costPercentageHigh: Number(formData.costPercentageHigh),
        costPercentageIdeal: Number(formData.costPercentageIdeal),
    };
    updateSettings(settingsToSave);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestPrint = () => {
      setShowTestPrint(true);
  };
  
  const handleConfirmReset = () => {
      if (adminPassword === currentUser?.password) {
          resetSystem();
      } else {
          setResetError(t('login_error'));
      }
  };

  const openResetModal = () => {
      setShowResetModal(true);
      setAdminPassword('');
      setResetError('');
  };

  const copyToClipboard = (text: string, type: string) => {
      navigator.clipboard.writeText(text);
      setCopiedDev(type);
      setTimeout(() => setCopiedDev(null), 2000);
  };

  // Dummy order for testing
  const testOrder: Order = {
      id: "TEST-12345",
      items: [
          { id: "1", name: "Product A", price: 50, quantity: 2, category: "ANY" as any, image: "" },
          { id: "2", name: "Product B", price: 30, quantity: 1, category: "ANY" as any, image: "" }
      ],
      total: 130,
      createdAt: new Date(),
      status: OrderStatus.PAID,
      tableNumber: 5,
      customerName: "Test Customer"
  };

  // Improved Styles
  const sectionClass = "bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8 transition-all hover:shadow-md";
  const headerIconClass = (color: string) => `p-3 rounded-2xl ${color} shadow-sm`;
  const labelClass = "block text-sm font-bold text-slate-600 mb-2.5";
  const inputClass = "w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold text-base";
  
  return (
    <div className="p-8 lg:p-12 min-h-screen bg-slate-50/50 pb-32 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('settings_general')}</h1>
           <p className="text-slate-500 font-medium text-lg mt-2">{t('settings_desc')}</p>
        </div>
        <button 
            onClick={handleSave}
            className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl transition-all transform active:scale-95 ${
                saved 
                ? 'bg-green-500 text-white shadow-green-500/20' 
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'
            }`}
        >
            {saved ? <CheckCircle size={24} /> : <Save size={24} />}
            <span className="text-lg">{saved ? t('saved_success') : t('save_changes')}</span>
        </button>
      </div>

      {/* SYSTEM INFO CARD (Replaces License Card) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl shadow-slate-900/10 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                      <Monitor size={32} className="text-blue-400" />
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                          {t('systemTitle')}
                          <span className="flex items-center gap-1 bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30 font-black tracking-wide">
                              v2.1.0 (Open Source)
                          </span>
                      </h2>
                      <p className="text-slate-400 text-sm font-medium">{t('systemSubtitle')}</p>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mt-2">
                          <ShieldCheck size={12} />
                          <span>DEVICE ID: {settings.deviceId}</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Restaurant Info */}
        <div className={sectionClass}>
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className={headerIconClass("bg-orange-100 text-orange-600")}>
                    <Store size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{t('restaurant_info')}</h2>
                    <p className="text-slate-400 font-medium text-sm mt-1">{t('restaurant_info_desc')}</p>
                </div>
            </div>
            <div className="space-y-6">
                
                {/* Language Switcher */}
                <div>
                    <label className={labelClass}>{t('language')}</label>
                    <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setFormData(prev => ({ ...prev, language: 'ar' }))}
                            className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                                formData.language === 'ar' 
                                ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <span>العربية</span>
                        </button>
                        <button 
                            onClick={() => setFormData(prev => ({ ...prev, language: 'en' }))}
                            className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                                formData.language === 'en' 
                                ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <span>English</span>
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                        <Globe size={12} />
                        {t('language_hint')}
                    </p>
                </div>

                {/* Logo Upload Section */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className={labelClass}>{t('settings_logo_upload')}</label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden relative group">
                            {formData.logo ? (
                                <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <ImageIcon className="text-slate-300" size={32} />
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="text-white" size={20} />
                            </div>
                        </div>
                        <div className="flex-1 space-y-3">
                            <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl inline-flex items-center gap-2 transition-colors shadow-sm w-full justify-center">
                                <Upload size={16} />
                                <span>{t('settings_logo_btn')}</span>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                            <p className="text-[10px] text-slate-400 font-medium text-center">{t('settings_logo_help')}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>{t('settings_restaurant_name')}</label>
                    <input 
                        type="text" 
                        name="restaurantName" 
                        value={formData.restaurantName} 
                        onChange={handleChange} 
                        className={inputClass}
                        placeholder="..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2.5">{t('settings_phone')}</label>
                    <input 
                        type="text" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        className={inputClass}
                        placeholder="..."
                    />
                </div>
                <div>
                    <label className={labelClass}>{t('settings_address')}</label>
                    <input 
                        type="text" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleChange} 
                        className={inputClass}
                        placeholder="..."
                    />
                </div>
            </div>
        </div>

        {/* Financial Info */}
        <div className={sectionClass}>
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className={headerIconClass("bg-green-100 text-green-600")}>
                    <Coins size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{t('financial_settings')}</h2>
                    <p className="text-slate-400 font-medium text-sm mt-1">{t('financial_desc')}</p>
                </div>
            </div>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>{t('currency')}</label>
                        <input 
                            type="text" 
                            name="currency" 
                            value={formData.currency} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="..."
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('tax_rate')}</label>
                        <input 
                            type="number" 
                            name="taxRate" 
                            value={formData.taxRate} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="14"
                        />
                    </div>
                </div>
                
                {/* START CASH SETTING */}
                <div>
                    <label className={labelClass}>{t('settings_start_cash')}</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            name="defaultStartCash" 
                            value={formData.defaultStartCash} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="0.00"
                        />
                         <span className="absolute rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                            {currency}
                         </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                        <Lock size={12} />
                        {t('settings_start_cash_hint')}
                    </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 text-sm font-medium flex gap-3 items-start">
                    <div className="mt-0.5"><Wallet size={18} /></div>
                    <p>{t('settings_tax_hint')}</p>
                </div>
            </div>
        </div>

        {/* Cost & Inventory Rules Section */}
        <div className={`${sectionClass} xl:col-span-2`}>
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className={headerIconClass("bg-blue-100 text-blue-600")}>
                    <Percent size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{t('settings_cost_title')}</h2>
                    <p className="text-slate-400 font-medium text-sm mt-1">{t('settings_cost_desc')}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className={`${labelClass} text-green-700`}>{t('settings_cost_ideal')}</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            name="costPercentageIdeal" 
                            value={formData.costPercentageIdeal} 
                            onChange={handleChange} 
                            className={`${inputClass} border-green-200 focus:border-green-500 bg-green-50/30 text-green-800`} 
                            placeholder="28"
                        />
                        <span className="absolute rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-green-600 font-bold">%</span>
                    </div>
                </div>
                <div>
                    <label className={`${labelClass} text-orange-700`}>{t('settings_cost_high')}</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            name="costPercentageHigh" 
                            value={formData.costPercentageHigh} 
                            onChange={handleChange} 
                            className={`${inputClass} border-orange-200 focus:border-orange-500 bg-orange-50/30 text-orange-800`} 
                            placeholder="35"
                        />
                        <span className="absolute rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-orange-600 font-bold">%</span>
                    </div>
                </div>
                <div>
                    <label className={`${labelClass} text-red-700`}>{t('settings_cost_danger')}</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            name="costPercentageDanger" 
                            value={formData.costPercentageDanger} 
                            onChange={handleChange} 
                            className={`${inputClass} border-red-200 focus:border-red-500 bg-red-50/30 text-red-800`} 
                            placeholder="45"
                        />
                        <span className="absolute rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-red-600 font-bold">%</span>
                    </div>
                </div>
            </div>
        </div>

        {/* DEVELOPER SUPPORT SECTION (PREMIUM DARK REDESIGN) */}
        <div className={`xl:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 shadow-2xl mb-8`}>
            {/* Background Effects */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
            
            <div className="relative z-10 p-8 lg:p-10 flex flex-col lg:flex-row gap-10 items-center">
                
                {/* Text Content */}
                <div className="flex-1 space-y-6 text-center lg:text-right">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold backdrop-blur-md shadow-lg">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span>{t('settings_dev_partner')}</span>
                    </div>
                    
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-black text-white mb-3 tracking-tight">{t('settings_dev_support')}</h2>
                        <p className="text-indigo-100/90 text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            {t('settings_dev_message')}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start items-center">
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                            <Heart className="text-pink-500 fill-pink-500 animate-pulse" size={20} />
                            <span className="text-white font-bold text-sm">Thank You</span>
                        </div>
                        {/* GitHub Button */}
                        <a href={DEVELOPER_INFO.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-white font-bold text-sm transition-all hover:scale-105">
                            <Github size={20} />
                            <span>GitHub</span>
                        </a>
                        {/* LinkedIn Button */}
                        <a href={DEVELOPER_INFO.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-xl border border-blue-400/30 text-white font-bold text-sm transition-all hover:scale-105">
                            <Linkedin size={20} />
                            <span>LinkedIn</span>
                        </a>
                    </div>
                </div>

                {/* Donation Cards */}
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-5">
                    
                    {/* Electronic Wallet & InstaPay Card (Combined) */}
                    <div className="flex-1 min-w-[260px] bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-xl hover:bg-white/15 transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
                                <Smartphone size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg">InstaPay / Wallet</p>
                                <p className="text-xs text-purple-200 font-medium">Vodafone / Bank Transfer</p>
                            </div>
                        </div>
                        <div className="bg-black/30 p-1 rounded-xl flex items-center border border-white/10">
                            <code className="flex-1 text-center font-mono font-black text-lg text-white py-2 tracking-wider">
                                {DEVELOPER_INFO.vodafoneCash}
                            </code>
                        </div>
                        <button 
                            onClick={() => copyToClipboard(DEVELOPER_INFO.vodafoneCash, 'wallet')}
                            className={`w-full mt-3 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${copiedDev === 'wallet' ? 'bg-green-500 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                        >
                            {copiedDev === 'wallet' ? <CheckCircle size={18} /> : <Copy size={18} />}
                            {copiedDev === 'wallet' ? t('settings_copied') : t('settings_copy')}
                        </button>
                    </div>

                    {/* PayPal Card (New) */}
                    <div className="flex-1 min-w-[260px] bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-xl hover:bg-white/15 transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                                <Landmark size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg">PayPal</p>
                                <p className="text-xs text-blue-200 font-medium">International Support</p>
                            </div>
                        </div>
                        <div className="bg-black/30 p-1 rounded-xl flex items-center border border-white/10">
                            <code className="flex-1 text-center font-mono font-bold text-md text-white py-2 tracking-wider">
                                {DEVELOPER_INFO.paypal}
                            </code>
                        </div>
                        <a 
                            href={`https://paypal.me/${DEVELOPER_INFO.paypal.replace('@','')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full mt-3 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg bg-white text-blue-600 hover:bg-blue-50"
                        >
                            <ExternalLink size={18} />
                            Open PayPal
                        </a>
                    </div>
                </div>
            </div>
        </div>

        {/* Printer Settings */}
        <div className={`${sectionClass} xl:col-span-2`}>
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className={headerIconClass("bg-indigo-100 text-indigo-600")}>
                    <Printer size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{t('printer_settings')}</h2>
                    <p className="text-slate-400 font-medium text-sm mt-1">{t('printer_desc')}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                     <div>
                        <label className={labelClass}>{t('settings_printer_paper')}</label>
                        <div className="relative">
                            <select 
                                name="printerWidth" 
                                value={formData.printerWidth} 
                                onChange={handleChange} 
                                className={`${inputClass} appearance-none text-slate-900`}
                            >
                                <option value="80mm">80mm (Standard)</option>
                                <option value="58mm">58mm (Small)</option>
                            </select>
                            <div className="absolute rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Printer size={20} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                         <div className="flex items-center justify-between">
                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        name="autoPrint"
                                        checked={formData.autoPrint}
                                        onChange={handleChange}
                                        className="peer sr-only"
                                    />
                                    <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-primary-600"></div>
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 block text-lg group-hover:text-primary-700 transition-colors">{t('auto_print')}</span>
                                    <span className="text-slate-500 text-sm font-medium">Auto-open print dialog after payment</span>
                                </div>
                            </label>
                         </div>
                    </div>

                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 items-start">
                        <Info className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                        <div className="text-xs text-indigo-900 leading-relaxed">
                            <p className="font-bold mb-1">{t('settings_printer_tip')}</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleTestPrint}
                        className="w-full py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Printer size={18} />
                        {t('test_print')}
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className={labelClass}>{t('settings_receipt_header')}</label>
                        <input 
                            type="text" 
                            name="receiptHeader" 
                            value={formData.receiptHeader} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="..."
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('settings_receipt_footer')}</label>
                        <input 
                            type="text" 
                            name="receiptFooter" 
                            value={formData.receiptFooter} 
                            onChange={handleChange} 
                            className={inputClass} 
                            placeholder="..."
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Danger Zone */}
        <div className="xl:col-span-2 bg-white rounded-3xl overflow-hidden border border-red-100 shadow-sm">
            <div className="p-8 bg-red-50/50 border-b border-red-100 flex items-center gap-4">
                 <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                    <Trash2 size={28} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-red-900">{t('settings_danger_zone')}</h2>
                    <p className="text-red-600/80 font-medium">{t('settings_danger_desc')}</p>
                </div>
            </div>
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-slate-600 font-medium max-w-2xl leading-relaxed">
                    {t('settings_reset_text')}
                </p>
                <button 
                    onClick={openResetModal}
                    className="whitespace-nowrap px-8 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-3 shadow-sm hover:shadow-md"
                >
                    <RefreshCw size={20} />
                    <span>{t('settings_reset_factory')}</span>
                </button>
            </div>
        </div>

      </div>

      {showTestPrint && (
          <InvoiceModal 
            order={testOrder}
            total={testOrder.total}
            currency={currency}
            onClose={() => setShowTestPrint(false)}
            onConfirm={() => {}}
            initialView="RECEIPT"
          />
      )}

      {/* Factory Reset Password Modal */}
      {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50">
                     <h3 className="text-lg font-black text-red-900 flex items-center gap-2">
                         <Trash2 size={20} />
                         {t('settings_reset_confirm_title')}
                     </h3>
                     <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600">
                         <X size={20} />
                     </button>
                 </div>
                 
                 <div className="p-6">
                     <div className="flex gap-4 items-start mb-6">
                         <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                             <AlertCircle size={24} />
                         </div>
                         <p className="text-slate-600 text-sm leading-relaxed">
                             {t('settings_reset_text')}
                         </p>
                     </div>

                     <div className="space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('settings_reset_password_label')}</label>
                             <div className="relative">
                                 <input 
                                     type="password" 
                                     className={`w-full pl-3 pr-10 py-3 bg-slate-50 border rounded-xl text-slate-900 font-bold focus:outline-none transition-all ${resetError ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-red-500'}`}
                                     placeholder="••••••"
                                     value={adminPassword}
                                     onChange={(e) => setAdminPassword(e.target.value)}
                                 />
                                 <Lock className="absolute right-3 top-3.5 text-slate-400" size={16} />
                             </div>
                             {resetError && <p className="text-red-500 text-xs font-bold mt-2 animate-in slide-in-from-top-1">{resetError}</p>}
                         </div>

                         <div className="flex gap-3 pt-2">
                             <button 
                                 onClick={() => setShowResetModal(false)}
                                 className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                             >
                                 {t('cancel')}
                             </button>
                             <button 
                                 onClick={handleConfirmReset}
                                 className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                             >
                                 {t('settings_reset_btn')}
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
