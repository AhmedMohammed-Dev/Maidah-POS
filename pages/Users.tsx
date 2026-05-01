

import React, { useState } from 'react';
import { useStore } from '../store';
import { Role, User } from '../types';
import { Users as UsersIcon, UserPlus, Shield, Trash2, X, AlertCircle, CheckCircle2, Edit2 } from 'lucide-react';

const Users = () => {
  const { users, addUser, updateUser, deleteUser, currentUser, t } = useStore();

  // New/Edit User State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('CASHIER');
  const [userError, setUserError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Only Admin can see this page
  if (currentUser?.role !== 'ADMIN') {
      return <div className="p-10 text-center font-bold text-red-500">{t('admin_access_denied')}</div>;
  }

  const resetForm = () => {
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewRole('CASHIER');
      setEditingUserId(null);
      setUserError('');
  };

  const handleEditClick = (user: User) => {
      setEditingUserId(user.id);
      setNewName(user.name);
      setNewUsername(user.username);
      setNewPassword(user.password || '');
      setNewRole(user.role);
      setUserError('');
      setSuccessMsg('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveUser = () => {
      setUserError('');
      setSuccessMsg('');
      
      if (!newUsername || !newPassword || !newName) {
          setUserError('Required fields missing.');
          return;
      }

      const userData: User = {
          id: editingUserId || `user-${Date.now()}`,
          username: newUsername,
          password: newPassword,
          name: newName,
          role: newRole
      };

      let success = false;
      if (editingUserId) {
          success = updateUser(userData);
      } else {
          success = addUser(userData);
      }
      
      if (success) {
          setSuccessMsg(editingUserId ? 'User Updated Successfully' : 'User Added Successfully');
          resetForm();
          setTimeout(() => setSuccessMsg(''), 3000);
      } else {
          setUserError('Username already taken.');
      }
  };

  const inputClass = "w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all font-bold shadow-sm";

  return (
    <div className="p-8 min-h-screen bg-slate-50 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
            <UsersIcon size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-black text-slate-900">{t('users_title')}</h1>
            <p className="text-slate-500 font-bold mt-1">{t('users_desc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ADD/EDIT USER FORM */}
        <div className="lg:col-span-4 h-fit bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    {editingUserId ? <Edit2 size={22} className="text-orange-600" /> : <UserPlus size={22} className="text-purple-600" />}
                    {editingUserId ? t('users_edit') : t('users_add_new')}
                </h3>
                {editingUserId && (
                    <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold">
                        <X size={16} />
                        {t('cancel')}
                    </button>
                )}
            </div>

            <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t('users_name')}</label>
                    <input 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        type="text" 
                        placeholder="..."
                        className={inputClass}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t('users_username')}</label>
                    <input 
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        type="text" 
                        placeholder="user123"
                        className={`${inputClass} ${userError ? 'border-red-300 bg-red-50' : ''}`}
                        dir="ltr"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t('users_password')}</label>
                    <input 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        type="text" 
                        placeholder="••••"
                        className={inputClass}
                        dir="ltr"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t('users_role')}</label>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl flex-wrap">
                         <button 
                            onClick={() => setNewRole('CASHIER')}
                            className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${newRole === 'CASHIER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                         >
                             {t('role_cashier')}
                         </button>
                         <button 
                            onClick={() => setNewRole('ADMIN')}
                            className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${newRole === 'ADMIN' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                         >
                             {t('role_admin')}
                         </button>
                         <button 
                            onClick={() => setNewRole('WAITER')}
                            className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${newRole === 'WAITER' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                         >
                             {t('role_waiter')}
                         </button>
                         <button 
                            onClick={() => setNewRole('DRIVER')}
                            className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${newRole === 'DRIVER' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                         >
                             {t('role_driver')}
                         </button>
                    </div>
                 </div>

                 {userError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold animate-in fade-in">
                        <AlertCircle size={16} />
                        <span>{userError}</span>
                    </div>
                 )}

                 {successMsg && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-xl text-xs font-bold animate-in fade-in">
                        <CheckCircle2 size={16} />
                        <span>{successMsg}</span>
                    </div>
                 )}

                 <button 
                    onClick={handleSaveUser}
                    className={`w-full py-4 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 mt-4 ${editingUserId ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'}`}
                >
                    {editingUserId ? <Edit2 size={20} /> : <UserPlus size={20} />}
                    {t('save_btn')}
                </button>
            </div>
        </div>

        {/* USERS LIST */}
        <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 text-lg">{t('users_list')}</h3>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">{users.length} Users</span>
                 </div>
                 
                 <div className="divide-y divide-slate-100">
                     {users.map(user => (
                         <div key={user.id} className={`p-6 flex items-center justify-between group transition-colors ${editingUserId === user.id ? 'bg-orange-50' : 'hover:bg-slate-50'}`}>
                             <div className="flex items-center gap-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${user.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                                     {user.name.charAt(0)}
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-slate-900 text-lg">{user.name}</h4>
                                     <div className="flex items-center gap-3 mt-1">
                                         <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                             {user.role === 'ADMIN' ? <Shield size={10} /> : null}
                                             {user.role === 'ADMIN' ? t('role_admin') : user.role === 'WAITER' ? t('role_waiter') : user.role === 'DRIVER' ? t('role_driver') : t('role_cashier')}
                                         </span>
                                         <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                            @{user.username}
                                         </span>
                                     </div>
                                 </div>
                             </div>

                             {/* Actions */}
                             <div className="flex items-center gap-2">
                                 <button
                                    onClick={() => handleEditClick(user)}
                                    className="p-3 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                                    title={t('edit')}
                                 >
                                    <Edit2 size={20} />
                                 </button>
                                 
                                 {users.length > 1 && user.id !== currentUser?.id ? (
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('Delete User?')) {
                                                deleteUser(user.id);
                                            }
                                        }}
                                        className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title={t('delete')}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                 ) : (
                                    <span className="text-xs text-slate-300 font-bold px-2 select-none opacity-50">Protected</span>
                                 )}
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Users;