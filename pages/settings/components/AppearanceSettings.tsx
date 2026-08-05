import React, { useState, useRef } from 'react';
import { Palette, ChevronDown, Image, X } from 'lucide-react';
import { useLanguage } from '../../../utils/languageContext';
import { useTheme } from '../../../utils/themeContext';

const AppearanceSettings: React.FC = () => {
  const { t } = useLanguage();
  const { theme, toggleTheme, bgColor, setBgColor, bgImage, setBgImage } = useTheme();
  const [showSection, setShowSection] = useState(false);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="pt-6 border-t space-y-6">
      <button
        onClick={() => setShowSection(!showSection)}
        className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 p-3 rounded-2xl transition-all"
      >
        <div className="flex items-center space-x-3">
          <Palette className="w-5 h-5 text-pink-600" />
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{t('settings.appearance')}</p>
            <p className="text-[8px] sm:text-[10px] text-gray-400">{t('settings.appearanceDesc')}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-pink-600 transition-transform duration-300 ${showSection ? 'rotate-180' : ''}`}
        />
      </button>

      {showSection && (
        <div className="space-y-6 pt-4 border-t dark:border-slate-700">
          {/* Sélecteur de Thème */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Clair', icon: '☀️', desc: 'Blanc/Bleu' },
              { id: 'dark', label: 'Sombre', icon: '🌙', desc: 'Noir/Gris' },
              { id: 'gray', label: 'Gris', icon: '🔲', desc: 'Pâle/Eco' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => {
                  if (theme !== t.id) toggleTheme();
                }}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center space-y-2 min-w-0 ${theme === t.id
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/20 shadow-soft shadow-pink-200'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-pink-300'
                  }`}
              >
                <span className="text-2xl">{t.icon}</span>
                <p className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase">{t.label}</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate w-full">{t.desc}</p>
              </button>
            ))}
          </div>

          {/* Couleur de Fond */}
          <div className="space-y-3 pt-4 border-t dark:border-slate-700">
            <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
              <Palette className="w-3 h-3 mr-2" /> Couleur de Fond
            </label>
            <div className="overflow-x-auto max-w-full">
              <div className="flex gap-2 items-center min-w-min pb-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-16 h-10 rounded-xl cursor-pointer border border-gray-300 dark:border-slate-600 flex-shrink-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-32 px-3 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-pink-500 flex-shrink-0"
                  placeholder="#FFFFFF"
                />
                <button
                  onClick={() => setBgColor('#FFFFFF')}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-xs font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 whitespace-nowrap flex-shrink-0 transition-all"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Image de Fond */}
          <div className="space-y-3 pt-4 border-t dark:border-slate-700">
            <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
              <Image className="w-3 h-3 mr-2" /> Image de Fond (Max 8MB)
            </label>
            {bgImage && (
              <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-600">
                <img src={bgImage} alt="Fond" className="w-full h-full object-cover" />
                <button
                  onClick={() => setBgImage(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-xl hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={() => bgImageInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl hover:border-pink-500 transition-all flex items-center justify-center space-x-2 text-sm font-bold text-gray-600 dark:text-gray-300"
            >
              <Image className="w-4 h-4" />
              <span>{bgImage ? 'Changer l\'image' : 'Ajouter une image'}</span>
            </button>
            <input
              ref={bgImageInputRef}
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const MAX_SIZE = 8 * 1024 * 1024;
                  if (file.size > MAX_SIZE) {
                    alert(`L'image doit faire moins de 8MB. Taille actuelle: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                    return;
                  }
                  try {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const result = event.target?.result as string;
                      setBgImage(result);
                    };
                    reader.readAsDataURL(file);
                  } catch (error) {
                    alert(t('settings.imageLoadError'));
                  }
                }
              }}
              className="hidden"
            />
            <p className="text-[9px] text-gray-400">Formats: JPG, PNG, WebP | Max 8MB</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppearanceSettings;
