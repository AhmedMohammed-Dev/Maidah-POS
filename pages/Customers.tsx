
import React, { useState } from 'react';
import { useStore } from '../store';
import { Customer } from '../types';
import { Contact, Search, Plus, MapPin, Phone, Edit, Trash2, X, Save, ShoppingBag, Clock, FileText, User, AlertTriangle } from 'lucide-react';

const Customers = () => {
  const { customers, addOrUpdateCustomer, deleteCustomer, t } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit/Add Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
      name: '',
      phone: '',
      address: '',
      notes: ''
  });

  const filteredCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery)
  );

  const handleOpenModal = (e?: React.MouseEvent, customer?: Customer) => {
      if (e) e.stopPropagation();
      
      if (customer) {
          setEditingCustomer(customer);
          setFormData({
              name: customer.name,
              phone: customer.phone,
              address: customer.address,
              notes: customer.notes || ''
          });
      } else {
          setEditingCustomer(null);
          setFormData({ name: '', phone: '', address: '', notes: '' });
      }
      setShowModal(true);
  };

  const handleSave = () => {
      if (!formData.name || !formData.phone) return;

      if (editingCustomer) {
          addOrUpdateCustomer({
              ...editingCustomer,
              ...formData
          });
      } else {
          addOrUpdateCustomer({
              id: `cust-${Date.now()}`,
              totalOrders: 0,
              lastOrderDate: new Date(),
              ...formData
          });
      }
      setShowModal(false);
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); 
      setCustomerToDelete(id);
      setShowDeleteModal(true);
  };

  const confirmDelete = () => {
      if (customerToDelete) {
          deleteCustomer(customerToDelete);
          setShowDeleteModal(false);
          setCustomerToDelete(null);
      }
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                <Contact size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900">{t('cust_title')}</h1>
                <p className="text-slate-500 font-bold mt-1">{t('cust_desc')}</p>
            </div>
        </div>
        <button 
            onClick={(e) => handleOpenModal(e)}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
        >
            <Plus size={20} />
            <span>{t('cust_add')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <Search className="text-slate-400" size={24} />
          <input 
              type="text" 
              placeholder={t('cust_search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none font-bold text-lg text-slate-900 placeholder:text-slate-400"
          />
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group relative overflow-hidden">
                  
                  {/* Card Header & Actions */}
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-600 font-black text-xl shadow-inner">
                              {customer.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className="font-black text-slate-900 text-lg leading-tight">{customer.name}</h3>
                              <div className="flex items-center gap-1 mt-1 text-xs font-bold text-slate-400">
                                  <Clock size={12} />
                                  <span>{t('cust_since')} {new Date(customer.lastOrderDate).toLocaleDateString()}</span>
                              </div>
                          </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 relative z-10">
                          <button 
                            onClick={(e) => handleOpenModal(e, customer)} 
                            className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors"
                            title={t('edit')}
                          >
                              <Edit size={16} />
                          </button>
                          <button 
                            onClick={(e) => initiateDelete(e, customer.id)} 
                            className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors"
                            title={t('delete')}
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-2 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-500 shadow-sm">
                              <Phone size={16} />
                          </div>
                          <span className="font-bold text-slate-800 text-sm dir-ltr tracking-wider">{customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-orange-500 shadow-sm">
                              <MapPin size={16} />
                          </div>
                          <span className="font-bold text-slate-700 text-sm truncate flex-1">{customer.address || t('cust_no_address')}</span>
                      </div>
                      {customer.notes && (
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-yellow-500 shadow-sm">
                                  <FileText size={16} />
                              </div>
                              <span className="font-bold text-slate-600 text-xs truncate flex-1">{customer.notes}</span>
                          </div>
                      )}
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-bold border border-green-100">
                          <ShoppingBag size={14} />
                          <span>{customer.totalOrders} {t('cust_orders')}</span>
                      </div>
                  </div>
              </div>
          ))}
          {filteredCustomers.length === 0 && (
              <div className="col-span-full py-24 text-center text-slate-400 flex flex-col items-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Contact size={40} className="opacity-30" />
                  </div>
                  <p className="font-black text-xl text-slate-600">No Customers Found</p>
              </div>
          )}
      </div>

      {/* Add/Edit Modal (Improved UI) */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white/20">
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
                              {editingCustomer ? <Edit size={20} /> : <Plus size={20} />}
                          </div>
                          <div>
                              <h3 className="font-black text-xl text-slate-900">
                                  {editingCustomer ? t('edit') : t('cust_add')}
                              </h3>
                          </div>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-2 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all border border-slate-200">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-8 space-y-5">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                              <User size={16} className="text-blue-500" />
                              {t('customer_name')}
                          </label>
                          <input 
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                              placeholder="..."
                              autoFocus
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                              <Phone size={16} className="text-blue-500" />
                              {t('customer_phone')}
                          </label>
                          <input 
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400 dir-ltr text-right font-mono"
                              placeholder="01xxxxxxxxx"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                              <MapPin size={16} className="text-blue-500" />
                              {t('customer_address')}
                          </label>
                          <textarea 
                              value={formData.address}
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400 min-h-[100px] resize-none"
                              placeholder="..."
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                              <FileText size={16} className="text-blue-500" />
                              Notes
                          </label>
                          <input 
                              value={formData.notes}
                              onChange={(e) => setFormData({...formData, notes: e.target.value})}
                              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-900 transition-all placeholder:text-slate-400"
                              placeholder="..."
                          />
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                      <button 
                          onClick={() => setShowModal(false)}
                          className="px-6 py-4 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                          {t('cancel')}
                      </button>
                      <button 
                          onClick={handleSave}
                          disabled={!formData.name || !formData.phone}
                          className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Save size={20} />
                          {t('save_btn')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200 border border-slate-200">
                  <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                      <AlertTriangle size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Delete Customer?</h3>
                  <div className="flex gap-4">
                      <button 
                          onClick={() => setShowDeleteModal(false)}
                          className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                      >
                          {t('cancel')}
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 active:scale-95"
                      >
                          {t('confirm')}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Customers;
