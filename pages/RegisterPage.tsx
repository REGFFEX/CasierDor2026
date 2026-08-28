import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  AlertCircle,
  CheckCircle,
  MapPin,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { useAuth } from '../utils/authContext';
import { useLanguage } from '../utils/languageContext';
import { RegisterData, EnterpriseType, ActivityType } from '../types';
import { validatePhoneNumber, formatPhoneMessage, getDialCodeForAppCountry, type PhoneDialCode } from '../utils/phoneValidation';
import PhoneInput from '../components/PhoneInput';
import { SUPPORTED_CURRENCIES } from '../constants';
import RecoverySecurityOptions from '../components/RecoverySecurityOptions';
import { syncRegisterDataToStore } from '../utils/registerDataSync';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCrystalButton from '../components/auth/AuthCrystalButton';
import WizardStepper, { type WizardStep } from '../components/auth/WizardStepper';

const MAX_PUBLIC_PHONES = 3;
const MIN_PUBLIC_PHONES = 1;

const pickImage = (onPick: (dataUrl: string) => void) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => onPick(re.target?.result as string);
    reader.readAsDataURL(file);
  };
  input.click();
};

const inputClass =
  'w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl dark:bg-slate-700/80 dark:text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, country: appCountry } = useLanguage();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    currency: 'XAF',
    password: '',
    confirmPassword: '',
    enterpriseType: EnterpriseType.ENTERPRISE,
    activityType: ActivityType.DEPOT,
    customActivityType: '',
    customEnterpriseType: '',
    companyName: '',
    publicEmail: '',
    publicPhone: '',
    publicPhones: [''],
    recoveryEmail: '',
    acceptTerms: false,
  });
  const [avatar, setAvatar] = useState('');
  const [logo, setLogo] = useState('');
  const [buildingImage, setBuildingImage] = useState('');
  const [publicDialCode, setPublicDialCode] = useState<PhoneDialCode>(getDialCodeForAppCountry('cg'));
  const [personalDialCode, setPersonalDialCode] = useState<PhoneDialCode>(getDialCodeForAppCountry('cg'));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const dial = getDialCodeForAppCountry(appCountry);
    setPublicDialCode(dial);
    setPersonalDialCode(dial);
  }, [appCountry]);

  const mapRegisterErrors = (msg: string): string => {
    const codeMap: Record<string, string> = {
      AUTH_ERROR_TERMS: t('auth.errorTerms'),
      AUTH_ERROR_COMPANY: t('auth.errorCompanyRequired'),
      AUTH_ERROR_CUSTOM_ENTERPRISE: t('auth.errorCustomEnterprise'),
      AUTH_ERROR_CUSTOM_ACTIVITY: t('auth.errorCustomActivity'),
      'Le prénom doit contenir au moins 2 caractères': t('auth.errorFirstName'),
      'Le nom doit contenir au moins 2 caractères': t('auth.errorLastName'),
      'Le mot de passe doit contenir au moins 8 caractères': t('auth.passwordStrong'),
      'Les mots de passe ne correspondent pas': t('auth.passwordsDoNotMatch'),
      "L'adresse email n'est pas valide": t('auth.errorEmail'),
    };
    return msg.split(', ').map((p) => codeMap[p.trim()] || p.trim()).join(' · ');
  };

  const steps: WizardStep[] = useMemo(
    () => [
      { id: 'enterprise', title: t('wizard.stepEnterprise'), hint: t('wizard.stepEnterpriseHint') },
      { id: 'contact', title: t('wizard.stepContact'), hint: t('wizard.stepContactHint') },
      { id: 'media', title: t('wizard.stepMedia'), hint: t('wizard.stepMediaHint') },
      { id: 'account', title: t('wizard.stepAccount'), hint: t('wizard.stepAccountHint') },
      { id: 'security', title: t('wizard.stepSecurity'), hint: t('wizard.stepSecurityHint') },
    ],
    [t]
  );

  const activityLabel = (type: string) => {
    const key = `enum.activityType.${type}`;
    const label = t(key);
    return label !== key ? label : type;
  };

  const setPhoneAt = (index: number, value: string) => {
    const phones = [...(formData.publicPhones ?? [''])];
    phones[index] = value;
    setFormData({ ...formData, publicPhones: phones, publicPhone: phones[0] || '' });
  };

  const addPhone = () => {
    const phones = formData.publicPhones ?? [''];
    if (phones.length >= MAX_PUBLIC_PHONES) return;
    setFormData({ ...formData, publicPhones: [...phones, ''] });
  };

  const removePhone = (index: number) => {
    const phones = (formData.publicPhones ?? ['']).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      publicPhones: phones.length ? phones : [''],
      publicPhone: phones[0] || '',
    });
  };

  const validateStep = (index: number): string | null => {
    switch (index) {
      case 0:
        if (!formData.companyName?.trim()) return t('auth.errorCompanyRequired');
        if (formData.enterpriseType === EnterpriseType.OTHER && !formData.customEnterpriseType?.trim()) {
          return t('auth.errorCustomEnterprise');
        }
        if (formData.activityType === ActivityType.OTHER && !formData.customActivityType?.trim()) {
          return t('auth.errorCustomActivity');
        }
        return null;
      case 1: {
        const phones = (formData.publicPhones ?? []).filter((p) => p.trim());
        if (phones.length < MIN_PUBLIC_PHONES) return t('auth.errorPhoneRequired');
        for (const p of phones) {
          const v = validatePhoneNumber(p, publicDialCode);
          if (!v.valid) return formatPhoneMessage(v, t);
        }
        return null;
      }
      case 2:
        return null;
      case 3:
        if (formData.firstName.trim().length < 2) return t('auth.errorFirstName');
        if (formData.lastName.trim().length < 2) return t('auth.errorLastName');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t('auth.errorEmail');
        return null;
      case 4:
        if (formData.password.length < 8) return t('auth.passwordStrong');
        if (formData.password !== formData.confirmPassword) return t('auth.passwordsDoNotMatch');
        if (!formData.acceptTerms) return t('auth.errorTerms');
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goPrev = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    const err = validateStep(4);
    if (err) {
      setError(err);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const phones = (formData.publicPhones ?? []).map((p) => p.trim()).filter(Boolean);
      const payload: RegisterData = {
        ...formData,
        avatar: avatar || undefined,
        logo: logo || undefined,
        buildingImage: buildingImage || undefined,
        publicEmail: formData.publicEmail?.trim() || formData.email.trim(),
        publicPhone: phones[0],
        publicPhones: phones,
      };

      const response = await register(payload);

      if (response.success && response.user) {
        syncRegisterDataToStore({ form: payload, user: response.user });
        setSuccess(t('auth.registerSuccess'));
        setTimeout(() => navigate('/storage-setup', { replace: true }), 1500);
      } else {
        setError(mapRegisterErrors(response.message || t('auth.registerError')));
      }
    } catch {
      setError(t('auth.registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.companyName')} *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.enterpriseType')}
                </label>
                <select
                  value={formData.enterpriseType}
                  onChange={(e) => setFormData({ ...formData, enterpriseType: e.target.value })}
                  className={inputClass}
                >
                  {Object.values(EnterpriseType).map((type) => (
                    <option key={type} value={type}>
                      {t(`enterprise.${type}`)}
                    </option>
                  ))}
                </select>
                {formData.enterpriseType === EnterpriseType.OTHER && (
                  <input
                    type="text"
                    placeholder={t('auth.customEnterprisePlaceholder')}
                    value={formData.customEnterpriseType}
                    onChange={(e) => setFormData({ ...formData, customEnterpriseType: e.target.value })}
                    className={`${inputClass} mt-2`}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.activityType')}
                </label>
                <select
                  value={formData.activityType}
                  onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                  className={inputClass}
                >
                  {Object.values(ActivityType).map((type) => (
                    <option key={type} value={type}>
                      {activityLabel(type)}
                    </option>
                  ))}
                </select>
                {formData.activityType === ActivityType.OTHER && (
                  <input
                    type="text"
                    placeholder={t('auth.customActivityPlaceholder')}
                    value={formData.customActivityType}
                    onChange={(e) => setFormData({ ...formData, customActivityType: e.target.value })}
                    className={`${inputClass} mt-2`}
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.publicPhones')} ({t('auth.publicPhonesHint')})
              </label>
              {(formData.publicPhones ?? ['']).map((phone, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <PhoneInput
                      value={phone}
                      dialCode={publicDialCode}
                      onChange={(v) => setPhoneAt(index, v)}
                      onDialCodeChange={index === 0 ? setPublicDialCode : undefined}
                      showHint={index === 0}
                    />
                  </div>
                  {(formData.publicPhones?.length ?? 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhone(index)}
                      className="p-3 mt-0.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {(formData.publicPhones?.length ?? 0) < MAX_PUBLIC_PHONES && (
                <button
                  type="button"
                  onClick={addPhone}
                  className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  {t('auth.addPhone')}
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.publicEmail')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.publicEmail}
                  onChange={(e) => setFormData({ ...formData, publicEmail: e.target.value })}
                  placeholder={t('auth.emailPlaceholder')}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.address')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.currency')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className={inputClass}
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} — {curr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-600">
              <label className="text-xs font-bold text-gray-500 uppercase">{t('settings.logoLabel')}</label>
              <div className="flex items-center gap-3 mt-3">
                {logo ? (
                  <img src={logo} alt="" className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-100" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                    <Building className="w-7 h-7 text-gray-400" />
                  </div>
                )}
                <AuthCrystalButton variant="secondary" type="button" onClick={() => pickImage(setLogo)} className="!w-auto !py-2 !px-4 !text-xs">
                  {t('form.upload')}
                </AuthCrystalButton>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-600">
              <label className="text-xs font-bold text-gray-500 uppercase">{t('auth.buildingPhoto')}</label>
              <div className="flex items-center gap-3 mt-3">
                {buildingImage ? (
                  <img src={buildingImage} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                    <ImageIcon className="w-7 h-7 text-gray-400" />
                  </div>
                )}
                <AuthCrystalButton variant="secondary" type="button" onClick={() => pickImage(setBuildingImage)} className="!w-auto !py-2 !px-4 !text-xs">
                  {t('form.upload')}
                </AuthCrystalButton>
              </div>
            </div>
            <p className="sm:col-span-2 text-xs text-gray-500">{t('wizard.stepMediaOptional')}</p>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/40">
              {avatar ? (
                <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <AuthCrystalButton variant="secondary" type="button" onClick={() => pickImage(setAvatar)} className="!w-auto !py-2 !px-4 !text-xs">
                {t('auth.profilePhoto')}
              </AuthCrystalButton>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.firstName')} *</label>
                <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.lastName')} *</label>
                <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.email')} ({t('auth.login')}) *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`${inputClass} pl-10`} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.recoveryEmail')}</label>
              <input type="email" value={formData.recoveryEmail} onChange={(e) => setFormData({ ...formData, recoveryEmail: e.target.value })} className={inputClass} autoComplete="off" />
              <p className="text-[10px] text-gray-500 mt-1">{t('auth.recoveryEmailHint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.phone')}</label>
              <PhoneInput
                value={formData.phone || ''}
                dialCode={personalDialCode}
                onChange={(v) => setFormData({ ...formData, phone: v })}
                onDialCodeChange={setPersonalDialCode}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.password')} *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`${inputClass} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.confirmPassword')} *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className={`${inputClass} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-gray-400">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <RecoverySecurityOptions />
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.acceptTerms} onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })} className="mt-1 rounded accent-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('auth.acceptTerms')}</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthLayout
      title={t('auth.createAccount')}
      subtitle={t('auth.createAccountSubtitle')}
    >
      <WizardStepper steps={steps} currentIndex={step} />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex gap-2 text-sm text-green-700">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}

      <div className="min-h-[220px]">{renderStep()}</div>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <AuthCrystalButton variant="secondary" onClick={goPrev} icon={<ChevronLeft className="w-4 h-4" />} className="flex-1">
            {t('wizard.prev')}
          </AuthCrystalButton>
        )}
        {step < steps.length - 1 ? (
          <AuthCrystalButton variant="primary" onClick={goNext} iconRight={<ChevronRight className="w-4 h-4" />} className="flex-1">
            {t('wizard.next')}
          </AuthCrystalButton>
        ) : (
          <AuthCrystalButton variant="primary" loading={isLoading} onClick={handleSubmit} className="flex-1">
            {t('auth.register')}
          </AuthCrystalButton>
        )}
      </div>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">{t('auth.alreadyHaveAccount')} </span>
        <Link to="/login" className="text-blue-600 font-medium hover:underline">
          {t('auth.login')}
        </Link>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
