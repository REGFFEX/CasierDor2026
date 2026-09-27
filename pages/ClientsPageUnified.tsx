/**
 * Example: Unified List System applied to ClientsPage
 * 
 * This demonstrates how to use the new unified list system
 * to replace the existing clients page implementation
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Phone, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import PageBackButton from '../components/PageBackButton';
import { useLanguage } from '../utils/languageContext';
import { getStoreData, setStoreData, STORAGE_KEYS, moveToTrash, DEFAULT_SETTINGS } from '../store';
import { Client, StoreSettings, ClientType, ContactMethod } from '../types';
import {
  UnifiedList,
  ViewMode,
  ViewConfig,
  FilterOption,
  SortOption,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuItem,
  FloatingActionButton,
  FABAction,
} from '../components/design-system';

const ClientsPageUnified: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>(getStoreData(STORAGE_KEYS.CLIENTS, []));
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // View Configuration
  const viewConfig: ViewConfig = {
    availableViews: ['list', 'cards'], // Clients work well in list and card views
    defaultView: 'list',
    searchableFields: ['name', 'code', 'phone', 'email'],
    filters: [
      { id: ClientType.SIMPLE_CLIENT, label: 'Client simple' },
      { id: ClientType.INDIVIDUAL, label: 'Particulier' },
      { id: ClientType.COMPANY, label: 'Entreprise' },
      { id: ClientType.WHOLESALE, label: 'Grossiste' },
    ],
    sortOptions: [
      { id: 'name_asc', label: 'Nom A → Z' },
      { id: 'name_desc', label: 'Nom Z → A' },
      { id: 'recent', label: 'Plus récent' },
      { id: 'oldest', label: 'Plus ancien' },
    ],
    multiSelectFilters: true,
  };

  // Render item based on view mode
  const renderItem = (client: Client, viewMode: ViewMode) => {
    if (viewMode === 'list') {
      return (
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {client.name}
              </h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">{client.code}</span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {client.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {client.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'cards') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white truncate">
                {client.name}
              </h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">{client.code}</span>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 flex-1">
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="truncate">{client.phone}</span>
              </div>
            )}
            {client.note && (
              <p className="text-xs truncate">{client.note}</p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Context menu actions for each client
  const getClientActions = (client: Client): ContextMenuItem[] => [
    {
      id: 'view',
      label: 'Voir',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => console.log('View client:', client.id),
    },
    {
      id: 'edit',
      label: 'Modifier',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => {
        setEditingClient(client);
        setIsModalOpen(true);
      },
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: <Trash2 className="w-4 h-4" />,
      danger: true,
      onClick: () => {
        if (confirm(t('clients.deleteConfirm').replace('{0}', client.name))) {
          const newList = clients.filter(c => c.id !== client.id);
          setClients(newList);
          setStoreData(STORAGE_KEYS.CLIENTS, newList);
          moveToTrash(client, 'CLIENT');
        }
      },
    },
  ];

  // FAB actions
  const fabActions: FABAction[] = [
    {
      id: 'new-client',
      label: 'Nouveau client',
      icon: <User className="w-5 h-5" />,
      onClick: () => {
        setEditingClient(null);
        setIsModalOpen(true);
      },
    },
  ];

  // Multi-select action
  const handleMultiSelectAction = (selectedClients: Client[]) => {
    console.log('Bulk action on clients:', selectedClients);
    // Implement bulk delete, export, etc.
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <PageBackButton />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('clients.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('clients.subtitle')}</p>
        </div>
      </div>

      {/* Unified List */}
      <UnifiedList
        items={clients}
        viewConfig={viewConfig}
        renderItem={(client, viewMode) => renderItem(client, viewMode)}
        storageKey="clients_list"
        onItemClick={(client) => {
          console.log('Client clicked:', client);
        }}
        onItemSelect={(client, selected) => {
          console.log('Client selection changed:', client.id, selected);
        }}
        onMultiSelectAction={handleMultiSelectAction}
        primaryAction={{
          label: t('clients.addNew'),
          icon: <Plus className="w-5 h-5" />,
          onClick: () => {
            setEditingClient(null);
            setIsModalOpen(true);
          },
        }}
      />

      {/* Floating Action Button for mobile */}
      <FloatingActionButton
        actions={fabActions}
        position="bottom-right"
        size="md"
      />

      {/* Client Form Modal (simplified) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingClient ? t('clients.editClient') : t('clients.newClient')}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingClient(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 dark:text-gray-400">
                Formulaire de client (à implémenter)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPageUnified;
