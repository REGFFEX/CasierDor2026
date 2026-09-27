/**
 * Test Data Generator Page
 * 
 * Page pour générer et gérer les données de test
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Trash2, RefreshCw, CheckCircle, AlertCircle, Copy, User } from 'lucide-react';
import PageBackButton from '../components/PageBackButton';
import { useLanguage } from '../utils/languageContext';
import { generateCompleteTestData, cleanupTestData, printTestCredentials, TEST_ACCOUNTS } from '../utils/testDataGenerator';

const TestDataPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [productCount, setProductCount] = useState(20);
  const [clientCount, setClientCount] = useState(15);
  const [saleCount, setSaleCount] = useState(30);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage(null);

    try {
      await generateCompleteTestData({
        forceRegenerate: true,
        productCount,
        clientCount,
        saleCount
      });
      
      setMessage({
        type: 'success',
        text: `${productCount} produits, ${clientCount} clients, ${saleCount} ventes générés avec succès !`
      });
      
      printTestCredentials();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erreur lors de la génération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCleanup = () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les données de test ?')) {
      return;
    }

    setIsCleaning(true);
    setMessage(null);

    try {
      cleanupTestData();
      setMessage({
        type: 'success',
        text: 'Toutes les données de test ont été supprimées'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erreur lors du nettoyage: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const copyCredentials = (email: string, password: string) => {
    const text = `Email: ${email}\nMot de passe: ${password}`;
    navigator.clipboard.writeText(text);
    alert('Identifiants copiés dans le presse-papier !');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4">
        <PageBackButton />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Données de Test</h1>
          <p className="text-gray-500 dark:text-gray-400">Générez des données complètes pour tester l'application</p>
        </div>
      </div>

      {/* Message de statut */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Identifiants de connexion */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Identifiants de connexion
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-blue-900 dark:text-blue-100">Administrateur</span>
              <button
                onClick={() => copyCredentials(TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password)}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                title="Copier"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-mono text-gray-900 dark:text-white">{TEST_ACCOUNTS.admin.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mot de passe:</span>
                <span className="font-mono text-gray-900 dark:text-white">{TEST_ACCOUNTS.admin.password}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-purple-900 dark:text-purple-100">Staff</span>
              <button
                onClick={() => copyCredentials(TEST_ACCOUNTS.staff.email, TEST_ACCOUNTS.staff.password)}
                className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800 rounded-lg transition-colors"
                title="Copier"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-mono text-gray-900 dark:text-white">{TEST_ACCOUNTS.staff.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mot de passe:</span>
                <span className="font-mono text-gray-900 dark:text-white">{TEST_ACCOUNTS.staff.password}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration de génération */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Configuration de génération
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de produits
            </label>
            <input
              type="number"
              value={productCount}
              onChange={(e) => setProductCount(Number(e.target.value))}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de clients
            </label>
            <input
              type="number"
              value={clientCount}
              onChange={(e) => setClientCount(Number(e.target.value))}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de ventes
            </label>
            <input
              type="number"
              value={saleCount}
              onChange={(e) => setSaleCount(Number(e.target.value))}
              min="1"
              max="200"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Générer les données
              </>
            )}
          </button>

          <button
            onClick={handleCleanup}
            disabled={isCleaning}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCleaning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Nettoyage en cours...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Nettoyer les données
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
        <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">💡 Instructions</h3>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          <li>• Cliquez sur "Générer les données" pour créer un environnement de test complet</li>
          <li>• Utilisez les identifiants ci-dessus pour vous connecter</li>
          <li>• "Nettoyer les données" supprime toutes les données de test</li>
          <li>• Les données sont sauvegardées dans le localStorage de votre navigateur</li>
        </ul>
      </div>
    </div>
  );
};

export default TestDataPage;
