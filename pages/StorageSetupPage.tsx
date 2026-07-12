import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, FolderTree, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import AuthShell from '../components/auth/AuthShell';
import AuthCrystalButton from '../components/auth/AuthCrystalButton';
import WizardStepper from '../components/auth/WizardStepper';
import {
  pickStorageDirectory,
  saveStorageRoot,
  getStorageFolderTree,
  STORAGE_SUBFOLDERS,
} from '../utils/storageDirectory';
import { initDirectoryStructure } from '../utils/fileManager';

const StorageSetupPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { id: 'choose', title: t('storage.stepTitle'), hint: t('storage.stepHint') },
    { id: 'done', title: t('wizard.next'), hint: t('storage.selected', { name: selectedLabel || '…' }) },
  ];

  const handlePick = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await pickStorageDirectory();
      if (result) {
        setSelectedLabel(result.label);
        saveStorageRoot(result.label, result.pathHint);
      }
    } catch {
      setError(t('storage.pickError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDefault = async () => {
    setIsLoading(true);
    await initDirectoryStructure();
    const label = 'CasierDor';
    saveStorageRoot(label, label);
    setSelectedLabel(label);
    setIsLoading(false);
  };

  const handleContinue = () => {
    navigate('/recovery-setup', { replace: true });
  };

  const tree = getStorageFolderTree();

  return (
    <AuthShell
      icon={<FolderOpen className="w-8 h-8" />}
      title={t('storage.title')}
      subtitle={t('storage.subtitle')}
      maxWidth="lg"
    >
      <WizardStepper steps={steps} currentIndex={selectedLabel ? 1 : 0} />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('storage.description')}</p>

        <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-slate-900/50 border border-blue-100 dark:border-slate-600">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm mb-3">
            <FolderTree className="w-5 h-5" />
            {t('storage.structure')}
          </div>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 font-mono">
            <li className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-gray-500" />
              <span>{selectedLabel || tree.root}/</span>
            </li>
            {STORAGE_SUBFOLDERS.map((f) => (
              <li key={f} className="pl-4">
                - {f}/
              </li>
            ))}
          </ul>
        </div>

        {selectedLabel && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
            <CheckCircle className="w-5 h-5" />
            {t('storage.selected', { name: selectedLabel })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <AuthCrystalButton
            variant="primary"
            loading={isLoading}
            onClick={handlePick}
            icon={<FolderOpen className="w-4 h-4" />}
            iconRight={<ChevronRight className="w-4 h-4" />}
          >
            {t('storage.pickFolder')}
          </AuthCrystalButton>
          <AuthCrystalButton variant="secondary" loading={isLoading} onClick={handleUseDefault}>
            {t('storage.useDefault')}
          </AuthCrystalButton>
        </div>

        {selectedLabel && (
          <AuthCrystalButton
            variant="primary"
            onClick={handleContinue}
            iconRight={<ChevronRight className="w-4 h-4" />}
            className="mt-4"
          >
            {t('wizard.next')}
          </AuthCrystalButton>
        )}
      </div>
    </AuthShell>
  );
};

export default StorageSetupPage;
