import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Building2, Briefcase } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useLanguage } from '../../utils/languageContext';

export interface OnboardingData {
  activityType: string;
  companySize: string;
  acquisitionChannel: string;
  useCases: string[];
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    activityType: '',
    companySize: '',
    acquisitionChannel: '',
    useCases: [],
  });

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const handleToggleUseCase = (useCase: string) => {
    setData((prev) => {
      const exists = prev.useCases.includes(useCase);
      if (exists) {
        return { ...prev, useCases: prev.useCases.filter((uc) => uc !== useCase) };
      }
      return { ...prev, useCases: [...prev.useCases, useCase] };
    });
  };

  return (
    <AuthLayout title="Bienvenue dans Casier d'Or !" subtitle="Apprenons à nous connaître pour mieux vous servir.">
      <div className="space-y-6">
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-slate-700">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        {/* Step 1: Profil d'activité */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-4">Quel est votre type d'activité principal ?</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'particulier', icon: <User className="w-5 h-5"/>, label: 'Particulier / Indépendant' },
                { id: 'commercant', icon: <Store className="w-5 h-5"/>, label: 'Commerçant / Détaillant' },
                { id: 'pme', icon: <Building2 className="w-5 h-5"/>, label: 'PME / Entreprise' },
                { id: 'organisation', icon: <Briefcase className="w-5 h-5"/>, label: 'Organisation' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setData({ ...data, activityType: item.id })}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    data.activityType === item.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-slate-800/80 text-blue-600' 
                      : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.icon}
                  <span className="mt-2 text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Taille de l'entreprise */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-4">Combien de personnes utiliseront l'application ?</h3>
            <div className="space-y-2">
              {['1 (Moi uniquement)', '2 à 5 personnes', '6 à 15 personnes', 'Plus de 15 personnes'].map((size) => (
                <button
                  key={size}
                  onClick={() => setData({ ...data, companySize: size })}
                  className={`w-full text-left px-4 py-3 border-2 rounded-xl transition-all ${
                    data.companySize === size 
                      ? 'border-blue-500 bg-blue-50 dark:bg-slate-800/80 text-blue-600 font-medium' 
                      : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Use Cases */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-4">Quelles fonctionnalités vous intéressent le plus ? (choix multiples)</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'caisse', label: 'Caisse / Ventes' },
                { id: 'stock', label: 'Gestion des Stocks' },
                { id: 'boutique', label: 'Boutique en ligne' },
                { id: 'clients', label: 'Gestion Clients' },
                { id: 'facturation', label: 'Devis & Factures' },
                { id: 'multi-boutiques', label: 'Multi-Boutiques' },
              ].map((uc) => (
                <button
                  key={uc.id}
                  onClick={() => handleToggleUseCase(uc.id)}
                  className={`px-3 py-2 border-2 rounded-xl text-sm transition-all ${
                    data.useCases.includes(uc.id)
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium' 
                      : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {uc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Acquisition */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-4">Comment avez-vous connu Casier d'Or ?</h3>
            <div className="space-y-2">
              {['Recommandation', 'Réseaux Sociaux', 'Recherche Google', 'Publicité', 'Autre'].map((channel) => (
                <button
                  key={channel}
                  onClick={() => setData({ ...data, acquisitionChannel: channel })}
                  className={`w-full text-left px-4 py-3 border-2 rounded-xl transition-all ${
                    data.acquisitionChannel === channel 
                      ? 'border-blue-500 bg-blue-50 dark:bg-slate-800/80 text-blue-600 font-medium' 
                      : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 flex justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            className={`px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 ${step === 1 ? 'invisible' : ''}`}
          >
            Retour
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            {step === 4 ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default OnboardingWizard;
