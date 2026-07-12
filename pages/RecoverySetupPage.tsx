
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, FileKey, CheckCircle2, AlertTriangle, ArrowRight, Download, Save, X, Lock, Smartphone, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import {
  generateRecoveryKey,
  registerRecoveryKey,
  saveRecoveryKeyFile,
  getUserDisplayName,
  getRecoverySecurityPrefs,
} from '../utils/recoveryKeyService';
import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { StoreSettings } from '../types';
import RecoverySecurityOptions from '../components/RecoverySecurityOptions';
import KeyFilePasswordFields from '../components/KeyFilePasswordFields';

const RecoverySetupPage: React.FC = () => {
    const navigate = useNavigate();
    const { state } = useAuth();
    const user = state.user;
    const { t } = useLanguage();
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [setupComplete, setSetupComplete] = useState(false);
    const [keyFilePassword, setKeyFilePassword] = useState('');
    const [keyFilePasswordConfirm, setKeyFilePasswordConfirm] = useState('');

    const OPTIONS = [
        {
            id: 1,
            title: t('auth.recoveryKeyTitle'),
            description: t('auth.recoveryKeyDesc'),
            icon: <FileKey className="w-8 h-8 text-emerald-600" />,
            color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            badge: t('auth.recoveryKeyBadge')
        },
        {
            id: 2,
            title: t('auth.googleAuthTitle'),
            description: t('auth.googleAuthDesc'),
            icon: <Smartphone className="w-8 h-8 text-blue-600" />,
            color: 'bg-blue-50 border-blue-200 text-blue-900',
            badge: t('auth.googleAuthBadge')
        },
        {
            id: 3,
            title: t('auth.bothMethodsTitle'),
            description: t('auth.bothMethodsDesc'),
            icon: <Shield className="w-8 h-8 text-purple-600" />,
            color: 'bg-purple-50 border-purple-200 text-purple-900',
            badge: t('auth.bothMethodsBadge')
        },
        {
            id: 4,
            title: t('auth.noRecoveryTitle'),
            description: t('auth.noRecoveryDesc'),
            icon: <ShieldAlert className="w-8 h-8 text-red-600" />,
            color: 'bg-red-50 border-red-200 text-red-900',
            badge: t('auth.noRecoveryBadge')
        }
    ];

    const handleSelect = (id: number) => {
        setSelectedOption(id);
        setShowConfirmation(true);
    };

    const cancelSelection = () => {
        if (confirm(t('auth.cancelSetupConfirm'))) {
            setShowConfirmation(false);
            setSelectedOption(null);
        }
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            // Simulation de traitement
            await new Promise(resolve => setTimeout(resolve, 1500));

            const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

            // Logique spécifique selon l'option
            if (selectedOption === 1 || selectedOption === 3) {
                const prefs = getRecoverySecurityPrefs();
                if (prefs.useKeyFilePassword) {
                    if (keyFilePassword.length < 4 || keyFilePassword !== keyFilePasswordConfirm) {
                        alert(t('auth.passwordsDoNotMatch'));
                        return;
                    }
                }
                const recoveryKey = generateRecoveryKey();
                const method = selectedOption === 3 ? 'both' as const : 'key' as const;
                await registerRecoveryKey(recoveryKey, method);
                const saved = await saveRecoveryKeyFile(
                    recoveryKey,
                    method,
                    prefs.useKeyFilePassword ? keyFilePassword : undefined
                );
                if (!saved && prefs.useKeyFilePassword) {
                    alert(t('auth.setupError'));
                    return;
                }
            } else if (selectedOption === 4) {
                setStoreData(STORAGE_KEYS.SETTINGS, { ...settings, recoveryConfig: null });
            }

            setSetupComplete(true);
            setShowConfirmation(false);
        } catch (error) {
            alert(t('auth.setupError'));
        } finally {
            setIsProcessing(false);
        }
    };

    if (setupComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4 animate-in fade-in duration-700">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900">{t('auth.welcomeUser', { name: getUserDisplayName(user) })}</h1>
                    {user?.createdAt && (
                        <p className="text-sky-400 text-sm">
                            {t('auth.accountCreatedOn')}{' '}
                            {t('auth.accountCreatedOnDate', {
                                date: new Date(user.createdAt).toLocaleDateString(),
                                time: new Date(user.createdAt).toLocaleTimeString(),
                            })}
                        </p>
                    )}
                    <p className="text-gray-600">
                        {t('auth.accountSecured')}
                        <br />
                        <span className="text-xs text-blue-400 mt-1 block font-medium">{t('auth.protectedByAES')}</span>
                        <br />
                        {t('auth.availableModules')}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-left">
                        {[t('auth.moduleSales'), t('auth.moduleStock'), t('auth.moduleClients'), t('auth.moduleReports'), t('auth.moduleHistory'), t('auth.moduleSettings')].map(module => (
                            <div key={module} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 flex items-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                {module}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center space-x-2"
                    >
                        <span>{t('auth.accessDashboard')}</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar Info */}
            <div className="md:w-1/3 bg-white p-8 border-r border-gray-200 flex flex-col justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 mb-4">{t('auth.accountSecurity')}</h1>
                    <p className="text-gray-600 text-sm mb-6">
                        {t('auth.securityIntro')}
                    </p>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center">
                            <Shield className="w-4 h-4 mr-2" /> {t('auth.whyImportant')}
                        </h3>
                        <ul className="text-xs text-blue-700 space-y-2 list-disc pl-4">
                            <li>{t('auth.recoveryImportant1')}</li>
                            <li>{t('auth.accountTheftProtection')}</li>
                            <li>{t('auth.emergencyAccess')}</li>
                        </ul>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-8">
                    {t('auth.copyrightText')}
                </p>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">{t('auth.chooseMethod')}</h2>

                    <div className="grid grid-cols-1 gap-4">
                        {OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => handleSelect(option.id)}
                                className={`flex items-start p-6 rounded-2xl border-2 transition-all text-left hover:scale-[1.01] ${selectedOption === option.id ? 'ring-2 ring-offset-2 ring-blue-500 ' + option.color : 'bg-white border-gray-100 hover:border-gray-300'}`}
                            >
                                <div className="p-3 bg-white/50 rounded-xl mr-4 backdrop-blur-sm">
                                    {option.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-lg">{option.title}</h3>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-white/50 rounded-lg">
                                            {option.badge}
                                        </span>
                                    </div>
                                    <p className="text-sm opacity-80">{option.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">{t('auth.recoveryConfirm')}</h3>
                            <p className="text-gray-500 text-sm">
                                {t('auth.selectedMethod', { method: OPTIONS.find(o => o.id === selectedOption)?.title ?? '' })}
                            </p>
                        </div>

                        {(selectedOption === 1 || selectedOption === 3) && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-left">
                                <p className="text-xs text-blue-800 leading-relaxed">{t('auth.recoveryKeyStorageHint')}</p>
                            </div>
                        )}

                        {(selectedOption === 1 || selectedOption === 3) && getRecoverySecurityPrefs().useKeyFilePassword && (
                            <KeyFilePasswordFields
                                password={keyFilePassword}
                                confirm={keyFilePasswordConfirm}
                                onPasswordChange={setKeyFilePassword}
                                onConfirmChange={setKeyFilePasswordConfirm}
                            />
                        )}

                        <div className="mb-4">
                            <RecoverySecurityOptions compact />
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                                <p className="text-xs text-amber-800 text-left">
                                    {t('auth.changeMethodWarning')}
                                    {selectedOption === 4 && t('auth.noSecurityWarning')}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={cancelSelection}
                                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                {t('auth.back')}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center"
                            >
                                {isProcessing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>{t('button.confirm')}</span>
                                        <CheckCircle2 className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecoverySetupPage;
