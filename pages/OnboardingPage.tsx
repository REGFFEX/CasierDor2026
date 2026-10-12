import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Star, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import { getStoreData, setStoreData, STORAGE_KEYS } from '../store';
import { StoreSettings } from '../types';
import AuthCrystalButton from '../components/auth/AuthCrystalButton';

const OnboardingPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    businessType: '',
    teamSize: '',
    storeCount: '',
    needsSync: false,
    needsPublicStore: false,
    discovery: '',
    mainUses: [] as string[]
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const toggleMainUse = (use: string) => {
    setAnswers((prev) => ({
      ...prev,
      mainUses: prev.mainUses.includes(use)
        ? prev.mainUses.filter((u) => u !== use)
        : [...prev.mainUses, use]
    }));
  };

  const determinePlan = () => {
    let score = 0;
    if (answers.teamSize === '6-20' || answers.teamSize === '21+') score += 5;
    if (answers.storeCount === '2-5' || answers.storeCount === '5+') score += 5;
    if (answers.needsSync) score += 3;
    if (answers.needsPublicStore) score += 2;

    if (score >= 8) return { plan: 'BUSINESS', color: 'bg-indigo-600', icon: <Store className="w-8 h-8 text-white" /> };
    if (score >= 3) return { plan: 'PRO', color: 'bg-blue-600', icon: <Star className="w-8 h-8 text-white" /> };
    return { plan: 'FREE', color: 'bg-green-600', icon: <CheckCircle className="w-8 h-8 text-white" /> };
  };

  const finishOnboarding = () => {
    const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, {} as any);
    (settings as any).onboardingCompleted = true;
    (settings as any).recommendedPlan = determinePlan().plan;
    setStoreData(STORAGE_KEYS.SETTINGS, settings);
    navigate('/', { replace: true });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Votre profil</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type d'activité</label>
              <select 
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                value={answers.businessType}
                onChange={e => setAnswers({...answers, businessType: e.target.value})}
              >
                <option value="">Sélectionnez...</option>
                <option value="independant">Indépendant / Particulier</option>
                <option value="commercant">Commerçant</option>
                <option value="pme">PME / Entreprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taille de l'équipe</label>
              <div className="flex gap-2">
                {['1', '2-5', '6-20', '21+'].map(size => (
                  <button
                    key={size}
                    onClick={() => setAnswers({...answers, teamSize: size})}
                    className={`flex-1 py-2 text-sm rounded-lg border ${answers.teamSize === size ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de boutiques</label>
              <div className="flex gap-2">
                {['1', '2-5', '5+'].map(size => (
                  <button
                    key={size}
                    onClick={() => setAnswers({...answers, storeCount: size})}
                    className={`flex-1 py-2 text-sm rounded-lg border ${answers.storeCount === size ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vos besoins technologiques</h2>
            <div className="space-y-3">
              <label className="flex items-start p-4 border border-gray-200 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <input 
                  type="checkbox" 
                  checked={answers.needsSync}
                  onChange={e => setAnswers({...answers, needsSync: e.target.checked})}
                  className="mt-1 w-5 h-5 text-blue-600 rounded"
                />
                <div className="ml-3">
                  <span className="block font-medium text-gray-900 dark:text-white">Synchronisation Multi-appareils</span>
                  <span className="block text-sm text-gray-500">Travailler sur plusieurs téléphones et ordinateurs.</span>
                </div>
              </label>
              <label className="flex items-start p-4 border border-gray-200 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <input 
                  type="checkbox" 
                  checked={answers.needsPublicStore}
                  onChange={e => setAnswers({...answers, needsPublicStore: e.target.checked})}
                  className="mt-1 w-5 h-5 text-blue-600 rounded"
                />
                <div className="ml-3">
                  <span className="block font-medium text-gray-900 dark:text-white">Boutique Publique en ligne</span>
                  <span className="block text-sm text-gray-500">Permettre à vos clients de commander en ligne.</span>
                </div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-6">Quels modules allez-vous utiliser ?</label>
              <div className="grid grid-cols-2 gap-2">
                {['Caisse', 'Stock', 'Facturation', 'Clients'].map(use => (
                  <button
                    key={use}
                    onClick={() => toggleMainUse(use)}
                    className={`p-2 text-sm rounded-lg border text-left ${answers.mainUses.includes(use) ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400'}`}
                  >
                    {use}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Faisons connaissance</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comment avez-vous connu Casier d'Or ?</label>
              <select 
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                value={answers.discovery}
                onChange={e => setAnswers({...answers, discovery: e.target.value})}
              >
                <option value="">Sélectionnez...</option>
                <option value="recommendation">Recommandation d'un ami</option>
                <option value="social">Réseaux sociaux</option>
                <option value="google">Recherche Google</option>
                <option value="partner">Partenaire</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>
        );
      case 4:
        const rec = determinePlan();
        return (
          <div className="text-center space-y-6">
            <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center ${rec.color} shadow-lg`}>
              {rec.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Le plan {rec.plan} semble parfait pour vous !
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sur la base de vos besoins (équipe de {answers.teamSize || '1'}, {answers.storeCount || '1'} boutique{answers.storeCount && answers.storeCount !== '1' ? 's' : ''}), le plan <strong>{rec.plan}</strong> est le mieux dimensionné pour accompagner votre croissance.
            </p>
            <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-left text-sm text-gray-600 dark:text-gray-300">
              <p className="mb-2"><strong>Bonne nouvelle !</strong> Vous commencez par défaut avec l'accès gratuit pour découvrir l'application à votre rythme.</p>
              <p>Vous pourrez activer le plan {rec.plan} à tout moment depuis vos paramètres.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700">
        <div className="h-2 bg-gray-100 dark:bg-slate-700 w-full">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>
        
        <div className="p-8">
          {renderStep()}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <AuthCrystalButton variant="secondary" onClick={handlePrev} icon={<ChevronLeft className="w-4 h-4" />} className="w-1/3">
                Retour
              </AuthCrystalButton>
            )}
            {step < 4 ? (
              <AuthCrystalButton variant="primary" onClick={handleNext} iconRight={<ChevronRight className="w-4 h-4" />} className="flex-1">
                Continuer
              </AuthCrystalButton>
            ) : (
              <AuthCrystalButton variant="primary" onClick={finishOnboarding} className="flex-1 text-white bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-500/30">
                Démarrer l'expérience
              </AuthCrystalButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
