import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Shield, Edit2, ChevronDown, ChevronUp, ChevronRight, Plus, X, Lock, Unlock, Trash2, Check, X as XIcon, Circle, Mail, Phone, Filter, ArrowLeft, Image } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import { getStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { User, UserRole, Permission } from '../types';
import { PERMISSION_LABELS, getDefaultPermissionsForRole } from '../utils/userManager';
import PhoneInput from '../components/PhoneInput';
import { getDialCodeForAppCountry, type PhoneDialCode } from '../utils/phoneValidation';
import PageBackButton from '../components/PageBackButton';

const UsersManagementPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>(getStoreData<User[]>(STORAGE_KEYS.USERS, []));
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'old'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const addAvatarInputRef = useRef<HTMLInputElement>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);
  const addFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: UserRole.STAFF as UserRole,
    comment: '',
    avatar: ''
  });
  const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const [phoneDialCode, setPhoneDialCode] = useState<PhoneDialCode>(() =>
    getDialCodeForAppCountry(settings.country)
  );

  useEffect(() => {
    setPhoneDialCode(getDialCodeForAppCountry(settings.country));
  }, [settings.country]);

  const isAdmin = settings.userRole === UserRole.ADMIN;

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = !searchQuery ||
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.uniqueId && user.uniqueId.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesRole = !filterRole || user.role === filterRole;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortBy === 'old') return (a.createdAt || 0) - (b.createdAt || 0);
        return 0;
      });
  }, [users, searchQuery, filterRole, sortBy]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Date.now().toString(),
      uniqueId: `USR${Date.now().toString().slice(-6)}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      avatar: formData.avatar,
      permissions: getDefaultPermissionsForRole(formData.role),
      active: true,
      isOnline: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastLogin: undefined,
      comment: formData.comment
    };

    const allUsers = [...users, newUser];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
    setUsers(allUsers);

    setFormData({ name: '', email: '', phone: '', role: UserRole.STAFF, comment: '', avatar: '' });
    setShowAddForm(false);
  };

  const startEditingUser = (user: User) => {
    setEditingUserId(user.id);
    setEditFormData(user);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>, target: 'add' | 'edit') => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(t('settings.selectValidImage'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      if (target === 'add') {
        setFormData({ ...formData, avatar: imageData });
      } else {
        setEditFormData({ ...editFormData, avatar: imageData });
      }
    };
    reader.onerror = () => {
      alert(t('settings.imageLoadError'));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateUser = (userId: string, updatedData: Partial<User>) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, ...updatedData, updatedAt: Date.now() } : user
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setEditingUserId(null);
    setEditFormData({});
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm(t('user.deleteConfirm'))) {
      const updatedUsers = users.filter(user => user.id !== userId);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
  };

  const handleToggleActive = (userId: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, active: !user.active } : user
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const handleTogglePermission = (userId: string, permission: Permission) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedPermissions = user.permissions.includes(permission)
      ? user.permissions.filter(p => p !== permission)
      : [...user.permissions, permission];

    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, permissions: updatedPermissions } : u
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const handleResetPermissions = (userId: string, role: UserRole) => {
    const defaultPerms = getDefaultPermissionsForRole(role);
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, permissions: defaultPerms } : user
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex items-center space-x-4">
          <PageBackButton className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-blue-300 transition-all group shadow-sm" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('user.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('user.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm sm:text-base">{t('user.add')}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('user.searchPlaceholder') || "Rechercher un utilisateur..."}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center space-x-2 px-6 py-3 border font-bold rounded-xl shadow-sm transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
        >
          <Filter className="w-5 h-5" />
          <span>{t('button.filter') || "Filtres"}</span>
        </button>
      </div>

      {
        showFilters && (
          <div className="p-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm flex flex-wrap gap-6 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Rôle</label>
              <select className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl outline-none text-xs font-bold" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="">Tous les rôles</option>
                <option value={UserRole.ADMIN}>{t('user.admin')}</option>
                <option value={UserRole.STAFF}>{t('user.staff')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Trier par</label>
              <select className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl outline-none text-xs font-bold" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                <option value="recent">Plus récents</option>
                <option value="old">Plus anciens</option>
              </select>
            </div>
            <button
              onClick={() => { setFilterRole(''); setSortBy('recent'); setSearchQuery(''); }}
              className="mt-auto px-4 py-2 text-red-500 text-[10px] font-bold uppercase hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            >
              Réinitialiser
            </button>
          </div>
        )
      }

      {/* Add User Form */}
      {
        showAddForm && (
          <div ref={addFormRef} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar relative scroll-container">
            <button type="button" onClick={() => addFormRef.current?.scrollBy({ top: -240, behavior: 'smooth' })} className="scroll-button scroll-button-top">
              <ChevronRight className="rotate-90 w-4 h-4" />
            </button>
            <button type="button" onClick={() => addFormRef.current?.scrollBy({ top: 240, behavior: 'smooth' })} className="scroll-button scroll-button-bottom">
              <ChevronRight className="-rotate-90 w-4 h-4" />
            </button>
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{t('user.new')}</h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">{t('clients.name')}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">{t('clients.phone')}</label>
                <PhoneInput
                  dialCode={phoneDialCode}
                  onDialCodeChange={setPhoneDialCode}
                  value={formData.phone}
                  onChange={(phone) => setFormData({ ...formData, phone })}
                  appCountry={settings.country}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">{t('settings.securityLabel')}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={UserRole.STAFF}>{t('user.staff')}</option>
                  <option value={UserRole.ADMIN}>{t('user.admin')}</option>
                </select>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">{t('user.comment')} <span className="text-gray-400 font-normal">({t('user.optional')})</span></label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder={t('user.commentPlaceholder')}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-center">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Image className="w-6 h-6" />
                      <span className="text-xs">{t('user.profilePhoto') || 'Photo'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">{t('user.profilePhoto') || 'Photo de profil'}</label>
                  <input
                    ref={addAvatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarUpload(e, 'add')}
                    className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>
              </div>
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-sm"
                >
                  {t('user.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-all text-sm"
                >
                  {t('user.cancel')}
                </button>
              </div>
            </form>
          </div>
        )
      }

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{t('user.noUsers')}</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 overflow-hidden"
            >
              {/* User Header */}
              <div className={`p-6 ${editingUserId !== user.id ? 'hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer' : ''} transition-colors`}
                onClick={() => editingUserId !== user.id && setExpandedUserId(expandedUserId === user.id ? null : user.id)}>

                {editingUserId === user.id ? (
                  // Edit Mode
                  <div ref={editFormRef} className="flex-1 space-y-4 max-h-[72vh] overflow-y-auto custom-scrollbar relative scroll-container" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => editFormRef.current?.scrollBy({ top: -220, behavior: 'smooth' })} className="scroll-button scroll-button-top">
                      <ChevronRight className="rotate-90 w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => editFormRef.current?.scrollBy({ top: 220, behavior: 'smooth' })} className="scroll-button scroll-button-bottom">
                      <ChevronRight className="-rotate-90 w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 flex items-center gap-4">
                        <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                          {editFormData.avatar ? (
                            <img src={editFormData.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 text-xs">
                              <Image className="w-5 h-5" />
                              <span>{t('user.profilePhoto') || 'Photo'}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">{t('user.profilePhoto') || 'Photo de profil'}</label>
                          <input
                            ref={editAvatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAvatarUpload(e, 'edit')}
                            className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t('clients.name')}</label>
                        <input
                          type="text"
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t('user.uniqueId')}</label>
                        <input
                          type="text"
                          value={editFormData.uniqueId || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, uniqueId: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Email</label>
                        <input
                          type="email"
                          value={editFormData.email || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t('clients.phone')}</label>
                        <PhoneInput
                          dialCode={phoneDialCode}
                          onDialCodeChange={setPhoneDialCode}
                          value={editFormData.phone || ''}
                          onChange={(phone) => setEditFormData({ ...editFormData, phone })}
                          appCountry={settings.country}
                          compact
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t('user.comment')}</label>
                        <input
                          type="text"
                          value={editFormData.comment || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                          placeholder={t('user.commentPlaceholder')}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        onClick={() => handleUpdateUser(user.id, editFormData as User)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all text-sm"
                      >
                        {t('clients.save')}
                      </button>
                      <button
                        onClick={() => {
                          setEditingUserId(null);
                          setEditFormData({});
                        }}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-all text-sm"
                      >
                        {t('user.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="overflow-x-auto">
                      <div className="min-w-max flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center ${user.active
                            ? user.role === UserRole.ADMIN
                              ? 'bg-purple-100 dark:bg-purple-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-gray-100 dark:bg-slate-700'
                            }`}>
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : user.role === UserRole.ADMIN ? (
                              <Shield className={user.active ? 'w-6 h-6 text-purple-600 dark:text-purple-400' : 'w-6 h-6 text-gray-400'} />
                            ) : (
                              <Users className={user.active ? 'w-6 h-6 text-blue-600 dark:text-blue-400' : 'w-6 h-6 text-gray-400'} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-lg ${!user.active ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                              {user.name}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <span className="text-xs font-mono bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                {user.uniqueId}
                              </span>
                              <div className="flex items-center space-x-1">
                                <Circle className={`w-3 h-3 ${user.isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {user.isOnline ? t('user.online') : t('user.offline')}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center space-x-1 truncate">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </span>
                              {user.phone && (
                                <span className="flex items-center space-x-1 truncate">
                                  <Phone className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{user.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === UserRole.ADMIN
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                            }`}>
                            {user.role === UserRole.ADMIN ? t('user.admin') : t('user.staff')}
                          </span>

                          {editingUserId === user.id ? null : (
                            !user.active && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                                {t('user.inactive')}
                              </span>
                            )
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingUser(user);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedUserId(expandedUserId === user.id ? null : user.id);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            {expandedUserId === user.id ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Details - Expanded */}
              {expandedUserId === user.id && (
                <div className="border-t dark:border-slate-700 p-6 bg-gray-50/50 dark:bg-slate-900/20 space-y-6">

                  {/* User Metadata Section */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('user.uniqueId')}</p>
                        <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 break-all">{user.uniqueId}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('user.status')}</p>
                        <div className="flex items-center space-x-2">
                          <Circle className={`w-3 h-3 ${user.isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {user.isOnline ? t('user.online') : t('user.offline')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('user.createdAt')}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{new Date(user.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</p>
                      </div>
                    </div>
                  </div>

                  {user.comment && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border dark:border-blue-800">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">{t('user.comment')}</p>
                      <p className="text-sm text-blue-900 dark:text-blue-100">{user.comment}</p>
                    </div>
                  )}

                  {/* Permissions Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>{t('user.permissions')} ({user.permissions.length}/{Object.keys(Permission).length / 2})</span>
                      </h4>
                      <button
                        onClick={() => handleResetPermissions(user.id, user.role)}
                        className="text-xs px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                      >
                        {t('user.reset')}
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.values(Permission).map(permission => (
                          <button
                            key={permission}
                            onClick={() => handleTogglePermission(user.id, permission as Permission)}
                            className={`p-2 rounded-lg text-left text-xs sm:text-sm font-medium transition-all border ${user.permissions.includes(permission as Permission)
                              ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                              }`}
                          >
                            <div className="flex items-center space-x-2">
                              {user.permissions.includes(permission as Permission) ? (
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              ) : (
                                <XIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              )}
                              <span className="truncate">{t(`permission.${(permission as string).toLowerCase()}`)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t dark:border-slate-700">
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-bold transition-all text-sm ${user.active
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        }`}
                    >
                      {user.active ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          <span>{t('user.deactivate')}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>{t('user.activate')}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-all text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('user.delete')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div >
  );
};

export default UsersManagementPage;
