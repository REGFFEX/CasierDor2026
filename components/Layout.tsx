
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronRight, LogOut, LayoutDashboard, PlusCircle, Package, Box, History, Moon, Sun, User, ChevronUp, AlertTriangle, Download, Shield, ShieldOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getNavigationItems, APP_NAME, type NavigationItem } from '../constants';
import { filterNavigationItems, trackModuleVisit } from '../utils/modules';
import { useTheme } from '../utils/themeContext';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS, exportAllData, clearAllData } from '../store';
import { resolveCompanyProfile, getBusinessTypeLabel } from '../utils/companyProfile';
import { STANDARD_TEXTS } from '../types/professional';
import { performFullBackup } from '../utils/backupUtils';
import CompanyLogo from './CompanyLogo';
import { useSidebar } from '../utils/sidebarContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state: sidebarState, toggleSidebar, closeMobile, setSidebarHovered } = useSidebar();
  const [isRibbonExpanded, setIsRibbonExpanded] = useState(false);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [doubleTapCooldown, setDoubleTapCooldown] = useState(false);
  const [touchDragDistance, setTouchDragDistance] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showAccountChoiceModal, setShowAccountChoiceModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState('');
  const touchStartTimeRef = useRef(0);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const location = useLocation();
  const navigate = useNavigate();
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { state: authState, logout } = useAuth();
  const { t } = useLanguage();
  const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const company = resolveCompanyProfile(settings, authState.user);

  // Gestion de la déconnexion avec sauvegarde
  const handleLogout = async (saveData: boolean = false) => {
    setIsProcessing(true);
    setLogoutMessage(saveData ? t('logout.savingAndLoggingOut') : t('logout.loggingOut'));

    try {
      if (saveData) {
        // Sauvegarder les données avant déconnexion
        setLogoutMessage(t('logout.preparingBackup'));
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Utiliser la fonction de sauvegarde partagée
        const success = await performFullBackup(true, settings);

        if (success) {
          setLogoutMessage(t('logout.backupCompleted'));
        } else {
          setLogoutMessage(t('logout.backupError'));
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Déconnexion via le contexte
      await logout();

      // Redirection vers la page d'authentification
      setLogoutMessage(t('logout.redirectingToLogin'));
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setLogoutMessage(t('logout.error'));
    } finally {
      setIsProcessing(false);
      setShowLogoutModal(false);
      setTimeout(() => setLogoutMessage(''), 2000);
    }
  };

  // Gestion du choix de sécurité
  const handleSecurityChoice = async (choice: 'keep' | 'create' | 'disable') => {
    setIsProcessing(true);

    try {
      switch (choice) {
        case 'keep':
          setLogoutMessage(t('security.maintainingAuth'));
          await new Promise(resolve => setTimeout(resolve, 1000));
          setLogoutMessage(t('security.securityActivated'));
          await new Promise(resolve => setTimeout(resolve, 1000));
          navigate('/', { replace: true });
          break;

        case 'create':
          setLogoutMessage(t('security.preparingAccount'));
          await new Promise(resolve => setTimeout(resolve, 1000));
          setLogoutMessage(t('security.redirectingToRegister'));
          await new Promise(resolve => setTimeout(resolve, 1000));
          navigate('/register', { replace: true });
          break;

        case 'disable':
          setLogoutMessage(t('security.disablingSecurity'));
          localStorage.setItem('auth_disabled', 'true');
          await new Promise(resolve => setTimeout(resolve, 1000));
          setLogoutMessage(t('security.securityDisabled'));
          await new Promise(resolve => setTimeout(resolve, 1000));
          navigate('/account-choice', { replace: true });
          break;
      }

    } catch (error) {
      console.error('Erreur lors de la modification de sécurité:', error);
      setLogoutMessage(t('security.error'));
    } finally {
      setIsProcessing(false);
      setShowSecurityModal(false);
      setTimeout(() => setLogoutMessage(''), 2000);
    }
  };

  // Vérifier si l'authentification est désactivée
  const isAuthDisabled = () => {
    return localStorage.getItem('auth_disabled') === 'true';
  };

  // Écouter l'événement pour afficher la modal de sécurité
  useEffect(() => {
    const handleShowSecurityModal = () => {
      setShowSecurityModal(true);
    };

    window.addEventListener('showSecurityModal', handleShowSecurityModal);
    return () => window.removeEventListener('showSecurityModal', handleShowSecurityModal);
  }, []);

  // Détecter les changements de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setScreenWidth(newWidth);

      // Reset expanded si l'écran devient assez grand
      if (newWidth >= 600) {
        setIsRibbonExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gestion robuste du double-tap avec protection avancée contre les erreurs tactiles
  const handleRibbonTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Ignorer si en cooldown (éviter les taps involontaires)
    if (doubleTapCooldown) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    // Configuration de sécurité renforcée pour différents scénarios
    const MIN_TAP_INTERVAL = 100; // Augmenté pour mieux filtrer les erreurs capteur
    const MAX_DOUBLE_TAP_TIME = 400; // Fenêtre légèrement élargie
    const DEBOUNCE_TIME = 1000; // Cooldown plus long après un double-tap valide
    const RESET_TIMEOUT = 1500; // Timeout plus long pour la réinitialisation
    const MAX_TAP_COUNT = 3; // Limite de taps consécutifs pour éviter les spam

    // 1️⃣ SÉCURITÉ: Ignorer taps trop rapides (< 100ms = erreur capteur ou écran défectueux)
    if (timeSinceLastTap < MIN_TAP_INTERVAL && lastTapTime > 0) {
      console.debug('[DoubleTap] ❌ Tap trop rapide ignoré (erreur capteur):', timeSinceLastTap, 'ms');
      return;
    }

    // 2️⃣ SÉCURITÉ: Limiter le nombre de taps consécutifs (anti-spam)
    if (tapCount >= MAX_TAP_COUNT) {
      console.debug('[DoubleTap] ❌ Trop de taps consécutifs, activation cooldown');
      setDoubleTapCooldown(true);
      setTimeout(() => {
        setDoubleTapCooldown(false);
        setTapCount(0);
        setLastTapTime(0);
      }, DEBOUNCE_TIME * 2);
      return;
    }

    // 3️⃣ DÉTECTER: Double-tap valide (entre 100ms et 400ms)
    if (timeSinceLastTap >= MIN_TAP_INTERVAL && timeSinceLastTap < MAX_DOUBLE_TAP_TIME && lastTapTime > 0) {
      console.debug('[DoubleTap] ✓ DOUBLE-TAP DÉTECTÉ:', timeSinceLastTap, 'ms');

      // Toggle avec animation
      setIsRibbonExpanded(!isRibbonExpanded);
      setLastTapTime(0);
      setTapCount(0);

      // Cooldown prolongé pour éviter les multiples toggles accidentels
      setDoubleTapCooldown(true);
      setTimeout(() => setDoubleTapCooldown(false), DEBOUNCE_TIME);
    } else if (timeSinceLastTap >= MAX_DOUBLE_TAP_TIME || lastTapTime === 0) {
      // 4️⃣ PREMIER TAP: Enregistrer le moment et attendre le second
      console.debug('[DoubleTap] Premier tap enregistré, count:', tapCount + 1);
      setLastTapTime(now);
      setTapCount(prev => prev + 1);

      // Timeout de sécurité: réinitialiser si pas de double-tap
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
      touchTimeoutRef.current = setTimeout(() => {
        console.debug('[DoubleTap] Timeout - réinitialisation automatique');
        setLastTapTime(0);
        setTapCount(0);
      }, RESET_TIMEOUT);
    }
  };

  // Gestion des erreurs d'écrans tactiles cassés (drag involontaire)
  const handleRibbonTouchStart = (e: React.TouchEvent) => {
    if (doubleTapCooldown) return;

    const touch = e.touches[0];
    touchStartTimeRef.current = Date.now();
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    setTouchDragDistance(0);
  };

  // Gestion spécifique pour le scroll horizontal du contenu du ruban
  const handleRibbonContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Empêcher la propagation du scroll au conteneur parent
    e.stopPropagation();
  };

  // Détecter les drags involontaires (symptôme d'écran défectueux) - Seuils renforcés
  const handleRibbonTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const distX = Math.abs(touch.clientX - touchStartXRef.current);
    const distY = Math.abs(touch.clientY - touchStartYRef.current);
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Seuil plus strict (12px au lieu de 15px) pour mieux filtrer les erreurs
    // Si drag > 12px = ce n'est pas un tap simple, c'est un scroll/geste
    if (distance > 12) {
      setTouchDragDistance(distance);
      console.debug('[Touch] Drag détecté (écran défectueux?):', distance, 'px');

      // Si le drag est très important (>30px), c'est probablement un geste intentionnel
      if (distance > 30) {
        setLastTapTime(0);
        setTapCount(0);
      }
    }
  };

  // Valider le tap avant d'exécuter le double-tap - Critères renforcés
  const handleRibbonTouchEnd = (e: React.TouchEvent) => {
    const duration = Date.now() - touchStartTimeRef.current;

    // Critères plus stricts pour valider un tap
    // Drag > 12px (au lieu de 15px) OU durée > 400ms (au lieu de 500ms)
    if (touchDragDistance > 12 || duration > 400) {
      console.debug('[Touch] ❌ Geste non-tap (drag/long-press):', { drag: touchDragDistance, duration });
      setLastTapTime(0);
      setTapCount(0);
      return;
    }

    // Sinon, c'est un tap valide
    console.debug('[Touch] ✓ Tap valide:', { drag: touchDragDistance, duration });
    handleRibbonTap(e as any);
  };

  // Gestion de la navigation par swipe (style WhatsApp)
  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = swipeStartX.current - touchEndX;
    const diffY = swipeStartY.current - touchEndY;

    // Seuil de swipe (100px) et s'assurer que c'est plus horizontal que vertical
    if (Math.abs(diffX) > 100 && Math.abs(diffX) > Math.abs(diffY)) {
      const paths = navigationItems.map(item => item.path);
      const currentIndex = paths.indexOf(location.pathname);

      if (currentIndex !== -1) {
        if (diffX > 0) {
          // Swipe vers la gauche -> Page suivante
          if (currentIndex < paths.length - 1) {
            navigate(paths[currentIndex + 1]);
          }
        } else {
          // Swipe vers la droite -> Page précédente
          if (currentIndex > 0) {
            navigate(paths[currentIndex - 1]);
          }
        }
      }
    }

    swipeStartX.current = null;
    swipeStartY.current = null;
  };

  const navigationItems = filterNavigationItems(
    getNavigationItems(t),
    settings.disabledModules
  );
  const primaryNav = navigationItems.filter(item => item.primary);
  const secondaryNav = navigationItems.filter(item => !item.primary);

  useEffect(() => {
    trackModuleVisit(location.pathname);
  }, [location.pathname]);

  const renderNavLink = (item: NavigationItem, onClick?: () => void, isMobile: boolean = false) => {
    const isActive = location.pathname === item.path;
    const isExpanded = isMobile || !sidebarState.desktopCollapsed || sidebarState.sidebarHovered;
    
    // Fallback colors si non définies
    const activeBgColor = item.bgColor || 'bg-blue-50 dark:bg-blue-900/30';
    const activeColor = item.color || 'text-blue-600 dark:text-blue-400';
    const activeBorder = item.borderColor || 'border-blue-600';

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onClick}
        className={`flex items-center px-4 py-3 rounded-xl transition-all active:scale-95 duration-200 relative overflow-hidden ${
          isActive
            ? `${activeBgColor} ${activeColor} shadow-sm font-bold`
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200'
          } ${isExpanded ? 'space-x-3' : 'justify-center'}`}
      >
        {/* L'effet Ruban (Ribbon) sur la gauche de l'élément actif */}
        {isActive && (
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full ${activeBgColor.replace('50', '500').replace('900/30', '500')} ${activeBorder} border-l-4`} />
        )}
        <div className={`flex-shrink-0 z-10 ${isActive ? activeColor : ''}`}>{item.icon}</div>
        <span className={`z-10 whitespace-nowrap transition-all duration-300 overflow-hidden ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>{item.label}</span>
        {isActive && <ChevronRight className={`ml-auto w-4 h-4 transition-all duration-300 ${isExpanded ? 'block' : 'hidden'}`} />}
      </Link>
    );
  };

  // Raccourcis pour le ruban mobile - Complété avec toutes les pages
  const mobileShortcuts = navigationItems.map(item => ({
    label: item.label,
    path: item.path,
    icon: item.icon
  }));

  const isExpanded = !sidebarState.desktopCollapsed || sidebarState.sidebarHovered;

  return (
    <div 
      className="min-h-screen flex flex-col pb-20 md:pb-0 relative"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: 'url("/logo/background.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out no-print ${sidebarState.desktopCollapsed && !sidebarState.sidebarHovered ? 'w-20' : 'w-64'}`}
      >
        <div className={`flex flex-col h-full overflow-y-auto custom-scrollbar overflow-x-hidden p-4`}>
          <div className="flex items-center space-x-3 mb-10 mt-2 px-2">
            <div className="flex-shrink-0">
              <CompanyLogo src={company.logo} fallbackLetter={company.companyName?.[0] || 'C'} size="sm" />
            </div>
            <div className={`transition-opacity duration-300 whitespace-nowrap ${!isExpanded ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
              <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight truncate">{company.companyName || APP_NAME}</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
                {getBusinessTypeLabel(t, company.businessType) || company.businessType}
              </p>
            </div>
          </div>

          <nav className="space-y-1 mb-8">
            <p className={`text-[9px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 transition-opacity duration-300 ${!isExpanded ? 'opacity-0' : 'opacity-100'}`}>Principal</p>
            {primaryNav.map(item => renderNavLink(item))}
          </nav>

          <nav className="space-y-1">
            <p className={`text-[9px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 transition-opacity duration-300 ${!isExpanded ? 'opacity-0' : 'opacity-100'}`}>Gestion</p>
            {secondaryNav.map(item => renderNavLink(item))}
          </nav>

          <div className="mt-auto border-t dark:border-slate-800 pt-4 space-y-2">
            <button
              onClick={() => toggleTheme()}
              className={`flex items-center px-4 py-3 w-full text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium ${isExpanded ? 'space-x-3' : 'justify-center'}`}
              title={theme === 'dark' ? t('settings.lightTheme') : t('settings.darkTheme')}
            >
              <div className="flex-shrink-0">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <span className={`whitespace-nowrap transition-all duration-300 ${!isExpanded ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                {theme === 'dark' ? t('settings.lightTheme') : t('settings.darkTheme')}
              </span>
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`flex items-center px-4 py-3 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors font-medium ${isExpanded ? 'space-x-3' : 'justify-center'}`}
              title={t('menu.logout')}
            >
              <div className="flex-shrink-0"><LogOut className="w-5 h-5" /></div>
              <span className={`whitespace-nowrap transition-all duration-300 ${!isExpanded ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>{t('menu.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Ribbon - Responsive & Smart */}
      <nav
        onClick={handleRibbonTap}
        onTouchStart={handleRibbonTouchStart}
        onTouchMove={handleRibbonTouchMove}
        onTouchEnd={handleRibbonTouchEnd}
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 transition-all duration-300 z-[50] no-print ${screenWidth < 500 && !isRibbonExpanded ? 'py-2 px-2 shadow-sm' : 'py-3 px-2'
          } ${isRibbonExpanded ? 'shadow-[0_-8px_24px_rgba(0,0,0,0.15)]' : ''
          }`}
      >
        {/* Mode 1: Petit écran (<500px) - Scroll horizontal si nécessaire */}
        {screenWidth < 500 && !isRibbonExpanded && (
          <div className="relative">
            <div
              className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide"
              onScroll={handleRibbonContentScroll}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {mobileShortcuts.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex-shrink-0 flex flex-col items-center p-2 rounded-xl transition-all min-w-0 ${location.pathname === item.path ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'
                    }`}
                >
                  <div className={`${location.pathname === item.path ? 'scale-110' : ''} transition-transform`}>
                    {item.path === '/users' ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {item.icon}
                      </div>
                    ) : (
                      item.icon
                    )}
                  </div>
                  <span className="text-[8px] font-bold mt-1 text-center uppercase whitespace-nowrap">{item.label}</span>
                </Link>
              ))}
              <div className="flex-shrink-0 flex items-center pl-2 text-gray-400 text-xs min-w-0">
                <ChevronUp className="w-3 h-3" />
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Petit écran (<500px) + Double-tap Expanded */}
        {screenWidth < 500 && isRibbonExpanded && (
          <div
            className="max-h-[60vh] overflow-auto scrollbar-hide rounded-t-3xl border-t border-x border-blue-200 dark:border-blue-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 mb-[-8px] shadow-[0_-12px_30px_rgba(0,0,0,0.2)] animate-slide-up"
            onScroll={handleRibbonContentScroll}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">{t('nav.quickAccess')}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsRibbonExpanded(false); }}
                  className="p-1.5 bg-gray-100 dark:bg-slate-800 rounded-full"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>

              <div className="overflow-auto max-w-full pb-2 scrollbar-thin">
                <div className="grid grid-cols-4 gap-4 min-w-[400px]">
                  {mobileShortcuts.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={(e) => { e.stopPropagation(); setIsRibbonExpanded(false); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${location.pathname === item.path
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900'
                        : 'bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                    >
                      <div className="mb-2">
                        {item.path === '/users' ? (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${location.pathname === item.path ? 'bg-white text-blue-600' : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                            }`}>
                            {item.icon}
                          </div>
                        ) : (
                          React.isValidElement(item.icon) ? React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-6 h-6' }) : item.icon
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-center uppercase leading-tight truncate w-full px-1">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pt-2 border-t dark:border-slate-800">
                <div className="text-[9px] text-gray-400 flex items-center space-x-1 italic">
                  <ChevronUp className="w-3 h-3" />
                  <span>{t('confirm.doubleTapToFold') || 'Double-tap pour replier'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode 3: Écran moyen/grand (≥500px) */}
        {screenWidth >= 500 && (
          <div className="flex justify-around items-center">
            {mobileShortcuts.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => e.stopPropagation()}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${location.pathname === item.path ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'
                  }`}
              >
                <div className={`${location.pathname === item.path ? 'scale-110' : ''} transition-transform`}>
                  {item.path === '/users' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {item.icon}
                    </div>
                  ) : (
                    item.icon
                  )}
                </div>
                <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Mobile Menu Drawer (Side) */}
      {sidebarState.mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
            onClick={closeMobile}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CompanyLogo src={company.logo} fallbackLetter={company.companyName?.[0] || 'C'} size="xs" />
                <span className="font-bold text-lg dark:text-white">{company.companyName || APP_NAME}</span>
              </div>
              <button onClick={closeMobile} className="p-2 bg-gray-100 dark:bg-slate-800 dark:text-white rounded-full active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <nav className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">Principal</p>
                {primaryNav.map(item => renderNavLink(item, closeMobile, true))}
              </nav>
              <nav className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">Gestion</p>
                {secondaryNav.map(item => renderNavLink(item, closeMobile, true))}
              </nav>
            </div>
            <div className="p-6 border-t dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 space-y-3">
              <button
                onClick={() => {
                  toggleTheme();
                  closeMobile();
                }}
                className="flex items-center space-x-3 px-4 py-3 w-full text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{theme === 'dark' ? t('settings.lightTheme') : t('settings.darkTheme')}</span>
              </button>
              <button
                onClick={() => {
                  closeMobile();
                  setShowLogoutModal(true);
                }}
                className="flex items-center space-x-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>{t('menu.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area Wrapper */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0 ${sidebarState.desktopCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        
        {/* Unified Top Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 px-4 py-4 flex items-center justify-between sticky top-0 z-30 transition-all duration-300 ease-in-out no-print">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg active:scale-95 transition-all"
            >
              {sidebarState.mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="md:hidden flex items-center space-x-2">
              <CompanyLogo src={company.logo} fallbackLetter={company.companyName?.[0] || 'C'} size="xs" />
              <span className="font-bold text-base text-gray-800 dark:text-gray-100 truncate max-w-[150px]">{company.companyName || APP_NAME}</span>
            </div>
          </div>
        </header>

        <main
          className="flex-1 flex flex-col w-full"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full flex-1">
            {children}
          </div>

          {/* Footer discret avec copyright */}
          <footer className="bg-white dark:bg-slate-900 border-t dark:border-slate-800 py-4 px-4 text-center no-print">
            <div className="max-w-7xl mx-auto">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {STANDARD_TEXTS.copyright}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {STANDARD_TEXTS.allRightsReserved}
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* Modal de déconnexion avec sauvegarde */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isProcessing && setShowLogoutModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <LogOut className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('menu.logout')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('confirm.logoutWithBackup')}
              </p>
            </div>

            {logoutMessage && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2 animate-spin flex-shrink-0" />
                  <span className="text-xs text-blue-700 dark:text-blue-300 break-words">{logoutMessage}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleLogout(true)}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm break-words text-center">{t('logout.saveAndLogout')}</span>
              </button>

              <button
                onClick={() => handleLogout(false)}
                disabled={isProcessing}
                className="w-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="text-sm break-words text-center flex items-center justify-center">{t('logout.logoutNoSave')}</span>
              </button>

              <button
                onClick={() => !isProcessing && setShowLogoutModal(false)}
                disabled={isProcessing}
                className="w-full text-gray-500 dark:text-gray-400 py-2 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('button.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de choix de sécurité pour admin test */}
      {showSecurityModal && authState.user?.email === 'admin@casierdor.app' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isProcessing && setShowSecurityModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('security.adminWelcome')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('security.testAccountMessage')}
              </p>
            </div>

            {logoutMessage && (
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2 animate-spin flex-shrink-0" />
                  <span className="text-xs text-purple-700 dark:text-purple-300 break-words">{logoutMessage}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleSecurityChoice('keep')}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm break-words text-center">{t('security.keepAuth')}</span>
              </button>

              <button
                onClick={() => handleSecurityChoice('create')}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                <User className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm break-words text-center">{t('security.createAccount')}</span>
              </button>

              <button
                onClick={() => handleSecurityChoice('disable')}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                <ShieldOff className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm break-words text-center">{t('security.disableAuth')}</span>
              </button>

              <button
                onClick={() => !isProcessing && setShowSecurityModal(false)}
                disabled={isProcessing}
                className="w-full text-gray-500 dark:text-gray-400 py-2 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('button.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
