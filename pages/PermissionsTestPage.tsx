import React, { useState } from 'react';
import { Check, X, AlertCircle, Zap, Download, Smartphone, Monitor, Terminal, BarChart3, Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
import { 
  getAllPermissionsStatus, 
  PermissionStatus,
  PermissionResponse,
  getPermissionMessage
} from '../utils/permissionManager';
import { testMediaPermission, testAllPermissions, getEnvironmentInfo } from '../utils/permissionTester';

const PermissionsTestPage: React.FC = () => {
  const [permissionsStatus, setPermissionsStatus] = useState<Record<string, PermissionResponse> | null>(null);
  const [environmentInfo, setEnvironmentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testMediaResult, setTestMediaResult] = useState<any>(null);

  const handleTestAllPermissions = async () => {
    setLoading(true);
    try {
      const results = await testAllPermissions();
      setPermissionsStatus(results);
    } catch (error) {
      console.error('Erreur lors du test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestMedia = async () => {
    setLoading(true);
    try {
      const result = await testMediaPermission();
      setTestMediaResult(result);
    } catch (error) {
      console.error('Erreur lors du test média:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetEnvironment = () => {
    const env = getEnvironmentInfo();
    setEnvironmentInfo(env);
  };

  const getStatusColor = (status: PermissionStatus) => {
    switch (status) {
      case PermissionStatus.GRANTED:
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case PermissionStatus.DENIED:
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case PermissionStatus.UNAVAILABLE:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    }
  };

  const getStatusIcon = (status: PermissionStatus) => {
    switch (status) {
      case PermissionStatus.GRANTED:
        return <Check className="w-5 h-5" />;
      case PermissionStatus.DENIED:
        return <X className="w-5 h-5" />;
      case PermissionStatus.UNAVAILABLE:
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🧪 Test des Permissions</h1>
          <p className="text-gray-500 dark:text-gray-400">Vérifiez les permissions sur votre appareil/OS</p>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleTestAllPermissions}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
        >
          <Zap className="w-5 h-5" />
          <span>Tester Toutes les Permissions</span>
        </button>

        <button
          onClick={handleTestMedia}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          <span>Tester Permission Média</span>
        </button>

        <button
          onClick={handleGetEnvironment}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
        >
          <Monitor className="w-5 h-5" />
          <span>Info Environnement</span>
        </button>
      </div>

      {/* Résultats Permissions */}
      {permissionsStatus && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100"><BarChart3 className="w-6 h-6 inline mr-2 text-blue-500"/> État des Permissions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(permissionsStatus).map(([type, result]: [string, any]) => (
              <div key={type} className={`p-4 rounded-xl ${getStatusColor(result.status)} space-y-2`}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result.status)}
                  <span className="font-bold uppercase text-sm">{type}</span>
                </div>
                <p className="text-sm font-medium">{result.message}</p>
                <div className="flex space-x-2 text-xs">
                  {result.canRetry && <span className="bg-black bg-opacity-20 px-2 py-1 rounded">Retry: Oui</span>}
                  {result.shouldOpenSettings && <span className="bg-black bg-opacity-20 px-2 py-1 rounded">Settings: Oui</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résultat Test Média */}
      {testMediaResult && (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 ${getStatusColor(testMediaResult.status)} space-y-4`}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">🖼️ Test Permission Média</h2>
          
          <div className="space-y-2">
            <p><strong>Status:</strong> {testMediaResult.status}</p>
            <p><strong>Message:</strong> {testMediaResult.message}</p>
            <p><strong>Peut réessayer:</strong> {testMediaResult.canRetry ? <><CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600"/> Oui</> : <><XCircle className="w-4 h-4 inline mr-1 text-red-600"/> Non</>}</p>
            <p><strong>Ouvrir paramètres:</strong> {testMediaResult.shouldOpenSettings ? <><CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600"/> Oui</> : <><XCircle className="w-4 h-4 inline mr-1 text-red-600"/> Non</>}</p>
          </div>
        </div>
      )}

      {/* Info Environnement */}
      {environmentInfo && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">🖥️ Environnement</h2>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300 uppercase font-bold">OS</p>
                <p className="font-mono text-sm">{environmentInfo.platform}</p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300 uppercase font-bold">En Ligne</p>
                <p className="text-lg font-bold">{environmentInfo.onLine ? <><CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600"/> Oui</> : <><XCircle className="w-4 h-4 inline mr-1 text-red-600"/> Non</>}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300 uppercase font-bold">Capacitor</p>
                <p className="text-lg font-bold">{environmentInfo.hasCapacitor ? <><CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600"/> Oui</> : <><XCircle className="w-4 h-4 inline mr-1 text-red-600"/> Non</>}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300 uppercase font-bold">Plateforme</p>
                <p className="font-mono text-sm">{environmentInfo.capacitorPlatform}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300 uppercase font-bold">File API</p>
                <p className="text-lg font-bold">{environmentInfo.hasFileAPI ? <><CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600"/> Oui</> : <><XCircle className="w-4 h-4 inline mr-1 text-red-600"/> Non</>}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300 uppercase font-bold">Media Devices</p>
                <p className="text-lg font-bold">{environmentInfo.hasMediaDevices ? <><CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600"/> Oui</> : <><XCircle className="w-4 h-4 inline mr-1 text-red-600"/> Non</>}</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-300 uppercase font-bold mb-1">User Agent</p>
              <p className="font-mono text-xs break-all">{environmentInfo.userAgent}</p>
            </div>
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 space-y-4">
        <h2 className="text-lg font-bold text-blue-900 dark:text-blue-200">📚 Guide d'Utilisation</h2>
        
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <p><strong>1. Tester Toutes les Permissions:</strong> Vérifie STORAGE, INTERNET, PRINTING, CAMERA, MEDIA</p>
          <p><strong>2. Tester Permission Média:</strong> Test spécifique pour charger des photos</p>
          <p><strong>3. Info Environnement:</strong> Affiche les capacités de votre navigateur/OS</p>
          
          <p className="mt-4"><strong><Lightbulb className="w-4 h-4 inline mr-1 text-yellow-500"/> Pour utiliser dans SettingsPage:</strong></p>
          <code className="block bg-white dark:bg-slate-800 p-3 rounded mt-2 overflow-x-auto">
            {`import { requestMediaPermission } from '../utils/permissionManager';
const permission = await requestMediaPermission();`}
          </code>
        </div>
      </div>
    </div>
  );
};

export default PermissionsTestPage;
