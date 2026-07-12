
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, User, Phone, FileText, Filter } from 'lucide-react';
import ScrollablePanel from '../components/ScrollablePanel';
import PageBackButton from '../components/PageBackButton';
import { enumLabel } from '../utils/enumLabels';
import { useLanguage } from '../utils/languageContext';
import { getStoreData, setStoreData, STORAGE_KEYS, addActivity, moveToTrash, DEFAULT_SETTINGS } from '../store';
import { Client, LogAction, UserRole, StoreSettings, ClientType, ContactMethod } from '../types';
import HighlightQuery from '../components/HighlightQuery';
import { validatePhoneNumber, formatPhoneMessage, getDialCodeForAppCountry, type PhoneDialCode } from '../utils/phoneValidation';
import PhoneInput from '../components/PhoneInput';
import { getActivityUserName } from '../utils/companyProfile';

const ClientsPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>(getStoreData(STORAGE_KEYS.CLIENTS, []));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterContact, setFilterContact] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || c.type === filterType;
    const matchesContact = !filterContact || c.contactMethod === filterContact;
    return matchesSearch && matchesType && matchesContact;
  });

  const handleDelete = (client: Client) => {
    if (confirm(t('clients.deleteConfirm').replace('{0}', client.name))) {
      const newList = clients.filter(c => c.id !== client.id);
      setClients(newList);
      setStoreData(STORAGE_KEYS.CLIENTS, newList);
      moveToTrash(client, 'CLIENT');
    }
  };

  const ClientForm = () => {
    interface ClientFormState extends Partial<Client> {
      country?: string;
    }

    const [formData, setFormData] = useState<ClientFormState>((editingClient as ClientFormState) || {
      code: `CL-${(clients.length + 1).toString().padStart(3, '0')}`,
      name: '',
      phone: '',
      country: '+242',
      type: ClientType.SIMPLE_CLIENT,
      contactMethod: ContactMethod.PHONE,
      note: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      let newList;
      if (editingClient) {
        newList = clients.map(c => c.id === editingClient.id ? { ...c, ...formData, updatedAt: Date.now() } as Client : c);
      } else {
        const newClient: Client = {
          ...formData,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: Date.now(),
          updatedAt: Date.now()
        } as Client;
        newList = [newClient, ...clients];
      }
      setClients(newList);
      setStoreData(STORAGE_KEYS.CLIENTS, newList);

      // Log l'activité
      const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      addActivity({
        userName: getActivityUserName(settings),
        userRole: settings.userRole || UserRole.ADMIN,
        action: editingClient ? LogAction.UPDATE : LogAction.CREATE,
        details: `${editingClient ? 'Modification' : 'Création'} du client: ${formData.name}`,
        module: 'CLIENT'
      });

      setIsModalOpen(false);
      setEditingClient(null);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
          <div className="p-8 border-b flex items-center justify-between bg-gray-50 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900">{editingClient ? t('clients.editClient') : t('clients.newClient')}</h2>
            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">{t('clients.close')}</button>
          </div>
          <ScrollablePanel maxHeight="calc(90vh - 5.5rem)" innerClassName="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.code')}</label>
              <input required className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.fullName')} *</label>
              <input required className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.phone')}</label>
              <PhoneInput
                value={formData.phone || ''}
                dialCode={(formData.country as PhoneDialCode) || getDialCodeForAppCountry('cg')}
                onChange={(v) => setFormData({ ...formData, phone: v })}
                onDialCodeChange={(d) => setFormData({ ...formData, country: d })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Type Client</label>
                <select className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as ClientType })}>
                  {Object.entries(ClientType).map(([key, value]) => (
                    <option key={key} value={value}>{value} ({key})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Contact</label>
                <select className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none" value={formData.contactMethod} onChange={e => setFormData({ ...formData, contactMethod: e.target.value as ContactMethod })}>
                  {Object.values(ContactMethod).map((v) => (
                    <option key={v} value={v}>{enumLabel(t, 'contactMethod', v)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.note')}</label>
              <textarea className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} rows={3} />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 mt-4">
              {t('clients.save')}
            </button>
          </form>
          </ScrollablePanel>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <PageBackButton />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('clients.title')}</h1>
            <p className="text-gray-500">{t('clients.subtitle')}</p>
          </div>
        </div>
        <button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5">
          <Plus className="w-5 h-5" />
          <span>{t('clients.addNew')}</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('clients.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 bg-white border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-6 py-3 border font-bold rounded-2xl shadow-sm transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter className="w-5 h-5" />
          <span>{t('stock.filter')}</span>
        </button>
      </div>

      {showFilters && (
        <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.type')}</label>
            <select className="px-4 py-2 bg-gray-50 border rounded-xl outline-none text-xs font-bold" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">{t('clients.type.all')}</option>
                  {Object.values(ClientType).map((v) => <option key={v} value={v}>{enumLabel(t, 'clientType', v)}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.contactMethod')}</label>
            <select className="px-4 py-2 bg-gray-50 border rounded-xl outline-none text-xs font-bold" value={filterContact} onChange={e => setFilterContact(e.target.value)}>
              <option value="">{t('clients.contact.all')}</option>
              {Object.values(ContactMethod).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setFilterType(''); setFilterContact(''); setSearchQuery(''); }}
            className="mt-auto px-4 py-2 text-red-500 text-[10px] font-bold uppercase hover:bg-red-50 rounded-xl transition-all"
          >
            {t('stock.reset')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-lg">
                {client.name.charAt(0)}
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(client)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              <HighlightQuery text={client.name} query={searchQuery} />
            </h3>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                <HighlightQuery text={client.code} query={searchQuery} />
              </p>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase">
                {client.type}
              </span>
            </div>
            {client.createdAt && (
              <p className="text-[9px] text-gray-400 italic mb-4">
                {t('clients.registeredOn')} {new Date(client.createdAt).toLocaleDateString()}
              </p>
            )}
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="w-4 h-4 mr-2" />
                {client.phone || t('clients.notProvided')}
              </div>
              {client.note && (
                <div className="flex items-start text-sm text-gray-500">
                  <FileText className="w-4 h-4 mr-2 mt-0.5" />
                  <span className="italic">{client.note}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && <ClientForm />}
    </div>
  );
};

export default ClientsPage;
