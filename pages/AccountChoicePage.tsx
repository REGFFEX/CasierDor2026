import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, ArrowRight, CheckCircle, AlertCircle, Shield, Users, Database, Package, ShoppingCart, Settings } from 'lucide-react';
import { useAuth } from '../utils/authContext';
import { getStoreData, STORAGE_KEYS } from '../store';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const AccountChoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [systemData, setSystemData] = useState({
    productsCount: 0,
    clientsCount: 0,
    salesCount: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadUsersAndSystemData();
  }, []);

  const loadUsersAndSystemData = () => {
    try {
      setIsLoading(true);

      // Charger les utilisateurs
      const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
      if (usersData) {
        const parsedUsers = JSON.parse(usersData);
        setUsers(parsedUsers);
      }

      // Charger les données système pour l'interconnexion
      const products = getStoreData(STORAGE_KEYS.PRODUCTS, []);
      const clients = getStoreData(STORAGE_KEYS.CLIENTS, []);
      const sales = getStoreData(STORAGE_KEYS.SALES, []);

      const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);

      setSystemData({
        productsCount: products.length,
        clientsCount: clients.length,
        salesCount: sales.length,
        totalRevenue
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = async (user: UserData) => {
    try {
      setSelectedUser(user);

      // Simuler la connexion avec l'utilisateur sélectionné
      await login({
        email: user.email,
        password: 'password' // Mot de passe par défaut pour les comptes créés localement
      });

      // Mettre à jour la date de dernière connexion
      const updatedUsers = users.map(u =>
        u.id === user.id
          ? { ...u, lastLogin: new Date().toISOString() }
          : u
      );
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

      // Rediriger vers le tableau de bord
      navigate('/', { replace: true });

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      alert('Erreur lors de la connexion avec ce compte');
    }
  };

  const handleCreateNewAccount = () => {
    navigate('/register', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900 dark:text-white">Chargement des comptes...</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">Récupération des données système</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
            <Users className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choix du Compte
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sélectionnez un compte existant ou créez un nouveau compte pour continuer
          </p>
        </div>

        {/* Carte de données système */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-500" />
            Données Système Interconnectées
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <Package className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{systemData.productsCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Produits</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <Users className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{systemData.clientsCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Clients</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <ShoppingCart className="w-6 h-6 text-purple-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{systemData.salesCount}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Ventes</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
              <Settings className="w-6 h-6 text-orange-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{systemData.totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Revenus</div>
            </div>
          </div>
        </div>

        {/* Liste des comptes existants */}
        {users.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-500" />
              Comptes Existants ({users.length})
            </h2>
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email} • {user.role}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  {user.lastLogin && (
                    <div className="text-xs text-gray-400 mt-2">
                      Dernière connexion: {new Date(user.lastLogin).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Option créer un nouveau compte */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Créer un Nouveau Compte</h3>
              <p className="text-blue-100">
                Créez un compte utilisateur avec des droits d'accès personnalisés
              </p>
            </div>
            <button
              onClick={handleCreateNewAccount}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nouveau Compte</span>
            </button>
          </div>
        </div>

        {/* Message d'aide */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Shield className="w-4 h-4" />
            <span>
              Tous les comptes sont sécurisés et interconnectés avec les données du système
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountChoicePage;
