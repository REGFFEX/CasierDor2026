import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { pathToModuleId, isModuleDisabled } from '../utils/modules';
import { useLanguage } from '../utils/languageContext';

/** Redirige vers le dashboard si la route correspond à un module désactivé */
const ModuleRouteGuard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const moduleId = pathToModuleId(location.pathname);
    if (!moduleId) return;

    const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    if (isModuleDisabled(moduleId, settings.disabledModules)) {
      navigate('/', {
        replace: true,
        state: { moduleDisabled: moduleId, message: t('modules.routeDisabled') },
      });
    }
  }, [location.pathname, navigate, t]);

  return null;
};

export default ModuleRouteGuard;
