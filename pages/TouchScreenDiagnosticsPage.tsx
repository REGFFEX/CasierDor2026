import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Activity, RefreshCw, BarChart3, ArrowLeft, XCircle, AlertTriangle, Clipboard, Lightbulb } from 'lucide-react';
import { touchScreenDiagnostics, type TouchScreenDiagnostics } from '../utils/touchScreenDiagnostics';
import PageBackButton from '../components/PageBackButton';

const TouchScreenDiagnosticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [diagnostics, setDiagnostics] = useState<TouchScreenDiagnostics | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [report, setReport] = useState('');
  const testAreaRef = useRef<HTMLDivElement>(null);
  const [touchLog, setTouchLog] = useState<string[]>([]);

  // Charger le diagnostic initial
  useEffect(() => {
    const initial = touchScreenDiagnostics.runDiagnostics();
    setDiagnostics(initial);
  }, []);

  // Gérer les événements tactiles dans la zone de test
  const handleTestAreaTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = testAreaRef.current?.getBoundingClientRect();
    if (rect) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      setTouchLog(prev => [...prev, `📍 Touch START: (${x.toFixed(0)}, ${y.toFixed(0)})`]);
    }
    (e.currentTarget as HTMLDivElement).dataset.touchStartX = touch.clientX.toString();
    (e.currentTarget as HTMLDivElement).dataset.touchStartY = touch.clientY.toString();
    (e.currentTarget as HTMLDivElement).dataset.touchStartTime = Date.now().toString();
  };

  const handleTestAreaTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = parseFloat((e.currentTarget as HTMLDivElement).dataset.touchStartX || '0');
    const startY = parseFloat((e.currentTarget as HTMLDivElement).dataset.touchStartY || '0');

    const distX = touch.clientX - startX;
    const distY = touch.clientY - startY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    if (distance > 15) {
      touchScreenDiagnostics.recordDragEvent(distance, Date.now() - parseFloat((e.currentTarget as HTMLDivElement).dataset.touchStartTime || '0'));
      setTouchLog(prev => [...prev.slice(-3), `🎯 DRAG détecté: ${distance.toFixed(1)}px`]);
    }
  };

  const handleTestAreaTouchEnd = (e: React.TouchEvent) => {
    const duration = Date.now() - parseFloat((e.currentTarget as HTMLDivElement).dataset.touchStartTime || '0');

    if (duration > 500) {
      touchScreenDiagnostics.recordLongPressEvent(duration);
      setTouchLog(prev => [...prev, `⏱️ LONG-PRESS: ${duration}ms`]);
    } else {
      touchScreenDiagnostics.recordTapEvent(Date.now());
      setTouchLog(prev => [...prev, `✓ TAP valide: ${duration}ms`]);
    }
  };

  const runFullDiagnostics = () => {
    setIsTesting(true);
    setTouchLog([]);
    touchScreenDiagnostics.reset();

    // Attendre un peu pour que l'utilisateur teste
    setTimeout(() => {
      const newDiags = touchScreenDiagnostics.runDiagnostics();
      setDiagnostics(newDiags);
      setReport(touchScreenDiagnostics.generateReport());
      setIsTesting(false);
    }, 3000);
  };

  const resetDiagnostics = () => {
    touchScreenDiagnostics.reset();
    const initial = touchScreenDiagnostics.runDiagnostics();
    setDiagnostics(initial);
    setTouchLog([]);
    setReport('');
  };

  if (!diagnostics) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'healthy':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    if (confidence === 'healthy') {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    } else if (confidence === 'warning') {
      return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    } else {
      return <AlertCircle className="w-6 h-6 text-red-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <PageBackButton className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-blue-300 transition-all group shadow-sm" />
          <div className="text-center space-y-2 flex-1 pr-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
              <Activity className="w-10 h-10 text-blue-600" />
              Diagnostic Écran Tactile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Testez votre écran tactile et détectez les anomalies
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className={`border-2 rounded-2xl p-8 ${getConfidenceColor(diagnostics.confidence)}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {getConfidenceIcon(diagnostics.confidence)}
              <div>
                <h2 className="text-2xl font-bold">
                  {diagnostics.confidence === 'healthy' && <><CheckCircle className="w-5 h-5 inline text-green-500 mr-2"/> Écran Sain</>}
                  {diagnostics.confidence === 'warning' && <><AlertTriangle className="w-5 h-5 inline text-yellow-500 mr-2"/> Anomalies Détectées</>}
                  {diagnostics.confidence === 'critical' && <><XCircle className="w-5 h-5 inline text-red-500 mr-2"/> Écran Défectueux</>}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Confiance: {diagnostics.confidence}
                </p>
              </div>
            </div>
            <button
              onClick={resetDiagnostics}
              className="p-3 hover:bg-white/50 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>

          {/* Support Tactile */}
          <div className="mt-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-sm">
              <span className="font-bold">Support Tactile:</span>
              {' '}
              {diagnostics.hasTouchSupport ? (
                <span className="text-green-600 font-bold"><CheckCircle className="w-4 h-4 inline mr-1"/> OUI</span>
              ) : (
                <span className="text-red-600 font-bold"><XCircle className="w-4 h-4 inline mr-1"/> NON (Souris/Clavier)</span>
              )}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Fast Taps</p>
                <p className="text-3xl font-bold text-blue-600">{diagnostics.fastTapDetected}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">&lt; 80ms (anomalie)</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Drags Involontaires</p>
                <p className="text-3xl font-bold text-yellow-600">{diagnostics.dragIssuesDetected}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">&gt; 15px mouvements</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Long-press Involontaires</p>
                <p className="text-3xl font-bold text-red-600">{diagnostics.longPressIssuesDetected}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">&gt; 500ms durée</p>
          </div>
        </div>

        {/* Test Area */}
        {isTesting && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-400 p-8">
            <p className="text-center font-bold text-blue-600 mb-4">
              ZONE DE TEST - Testez votre écran tactile ici
            </p>
            <div
              ref={testAreaRef}
              onTouchStart={handleTestAreaTouchStart}
              onTouchMove={handleTestAreaTouchMove}
              onTouchEnd={handleTestAreaTouchEnd}
              className="w-full h-64 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 rounded-xl border-2 border-dashed border-blue-300 flex items-center justify-center cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
            >
              <p className="text-center text-gray-600 dark:text-gray-300">
                <span className="block text-lg font-bold mb-2">Tapez • Glissez • Maintenez Enfoncé</span>
                <span className="text-sm">Essayez différents gestes pour tester</span>
              </p>
            </div>

            {/* Touch Log */}
            {touchLog.length > 0 && (
              <div className="mt-4 bg-gray-50 dark:bg-slate-900 rounded-xl p-4 max-h-40 overflow-y-auto">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Événements détectés:</p>
                {touchLog.map((log, i) => (
                  <p key={i} className="text-xs text-gray-700 dark:text-gray-300 font-mono">{log}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={runFullDiagnostics}
            disabled={isTesting}
            className={`flex-1 py-4 px-6 rounded-xl font-bold text-white transition-all ${isTesting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
          >
            {isTesting ? 'Test en cours (3s)...' : 'Lancer Test Complet'}
          </button>
          <button
            onClick={resetDiagnostics}
            className="py-4 px-6 rounded-xl font-bold bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600 transition-all active:scale-95"
          >
            <RefreshCw className="w-5 h-5 inline mr-2"/> Réinitialiser
          </button>
        </div>

        {/* Issues */}
        {diagnostics.issues.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-yellow-300 dark:border-yellow-700 p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Problèmes Détectés
            </h3>
            <ul className="space-y-3">
              {diagnostics.issues.map((issue, i) => (
                <li key={i} className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <AlertTriangle className="w-5 h-5 inline text-yellow-600"/>
                  <span className="text-gray-700 dark:text-gray-300">{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-lg mb-4"><Clipboard className="w-5 h-5 inline mr-2"/> Rapport Complet</h3>
            <pre className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs font-mono text-gray-700 dark:text-gray-300">
              {report}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(report);
                alert('Rapport copié dans le presse-papiers');
              }}
              className="w-full py-3 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-bold"
            >
              <Clipboard className="w-5 h-5 inline mr-2"/> Copier le Rapport
            </button>
          </div>
        )}

        {/* Help */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6">
          <h3 className="font-bold mb-3"><Lightbulb className="w-5 h-5 inline mr-2"/> Guide d'Utilisation</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>1. Cliquez sur "Lancer Test Complet"</li>
            <li>2. La zone de test sera verrouillée pendant 3 secondes (Simulation)</li>
            <li>3. Le diagnostic s'affiche automatiquement après le test</li>
            <li>4. Si des problèmes sont détectés, consultez le rapport</li>
            <li>5. Vous pouvez relancer le test plusieurs fois</li>
          </ul>
        </div>

        {/* Info */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700 p-6 text-sm text-gray-700 dark:text-gray-300">
          <p className="mb-2">
            <strong>ℹ️ À propos:</strong> Ce diagnostic détecte les anomalies tactiles en analysant les modèles d'événements.
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Fast Taps (&lt; 80ms):</strong> Indique des faux taps ou un capteur défectueux</li>
            <li><strong>Drags Involontaires:</strong> Signe de mauvaise calibration ou de mouvement involontaire</li>
            <li><strong>Long-press Involontaires:</strong> Peut indiquer une zone "collante" sur l'écran</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TouchScreenDiagnosticsPage;
