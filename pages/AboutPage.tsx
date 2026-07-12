import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, Globe, Users, Code, Shield, Calendar, Star, ExternalLink, Linkedin, Github, Twitter, MessageCircle, Facebook, ArrowLeft } from 'lucide-react';
import { APP_INFO, COMPANY_INFO, TEAM_MEMBERS, generateProductInfo } from '../types/professional';
import { getStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { useLanguage } from '../utils/languageContext';
import { resolveCompanyProfile, getBusinessTypeLabel } from '../utils/companyProfile';
import CompanyLogo from '../components/CompanyLogo';
import PageBackButton from '../components/PageBackButton';

// Gestionnaire intelligent pour les liens sociaux avec fallback
const handleSocialLink = (url?: string, type?: string) => {
  if (!url) return;

  // Facebook: essayer le protocole natif, fallback sur web
  if (type === 'facebook') {
    // D'abord essayer de forcer l'app Facebook
    window.location.href = url;
    // Après 1 seconde, fallback sur le web si l'app n'a pas ouvert
    setTimeout(() => {
      window.location.href = 'https://m.facebook.com/Paulvy%20Ongary';
    }, 1000);
    return;
  }

  // Pour les autres, juste ouvrir normalement
  window.open(url, '_blank', 'noopener,noreferrer');
};

const AboutPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [settings] = useState(getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const profile = resolveCompanyProfile(settings);
  const productInfo = generateProductInfo();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-12">
          <PageBackButton className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-blue-300 transition-all group shadow-sm mr-4" />
          <div className="text-center flex-1 pr-10">
            <div className="mb-6 flex justify-center">
              <CompanyLogo
                src={profile.logo}
                fallbackLetter={profile.companyName?.[0] || 'C'}
                size="lg"
                className="mx-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {profile.companyName || APP_INFO.fullName}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              {APP_INFO.description}
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                Version {APP_INFO.version}
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                {APP_INFO.type === 'freemium' ? 'Freemium' : 'Premium'}
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                Production Ready
              </span>
            </div>
          </div>
        </div>

        {/* Votre établissement */}
        {(profile.publicEmail || profile.publicPhone || profile.address || profile.responsibleDisplayName) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center mb-6">
              <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('about.yourBusiness')}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{profile.companyName}</h3>
                {profile.businessType && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                    {getBusinessTypeLabel(t, profile.businessType, language) || profile.businessType}
                  </p>
                )}
                {profile.address && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{profile.address}</p>
                )}
                <div className="space-y-2">
                  {profile.publicPhone && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4 mr-2" />
                      <a href={`tel:${profile.publicPhone}`} className="text-sm hover:underline">{profile.publicPhone}</a>
                    </div>
                  )}
                  {profile.publicEmail && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4 mr-2" />
                      <a href={`mailto:${profile.publicEmail}`} className="text-sm hover:underline">{profile.publicEmail}</a>
                    </div>
                  )}
                </div>
              </div>
              {profile.responsibleDisplayName && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('about.responsible')}</h4>
                  <p className="text-gray-600 dark:text-gray-300">{profile.responsibleDisplayName}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Company Info — éditeur logiciel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('about.editor')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                {COMPANY_INFO.fullName}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {COMPANY_INFO.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm">{COMPANY_INFO.email}</span>
                </div>

                {COMPANY_INFO.phone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 mr-2" />
                    <span className="text-sm">{COMPANY_INFO.phone}</span>
                  </div>
                )}

                {COMPANY_INFO.website && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Globe className="w-4 h-4 mr-2" />
                    <a
                      href={COMPANY_INFO.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                    >
                      {COMPANY_INFO.website}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                {t('about.legalInfo')}
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {COMPANY_INFO.address && (
                  <div>
                    <strong>{t('about.headquarters')}</strong><br />
                    {COMPANY_INFO.address.street}<br />
                    {COMPANY_INFO.address.postalCode} {COMPANY_INFO.address.city}<br />
                    {COMPANY_INFO.address.country}
                  </div>
                )}
                {COMPANY_INFO.registrationNumber && (
                  <div>
                    <strong>{t('about.registration')}</strong> {COMPANY_INFO.registrationNumber}
                  </div>
                )}
                {COMPANY_INFO.vatNumber && (
                  <div>
                    <strong>{t('about.vat')}</strong> {COMPANY_INFO.vatNumber}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('about.team')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id} className="text-center">
                <div className="mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                  {member.role}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {member.bio}
                </p>

                {member.email && (
                  <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-3">
                    <Mail className="w-4 h-4 mr-1" />
                    <span className="text-xs">{member.email}</span>
                  </div>
                )}

                {member.phone && (
                  <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-3">
                    <Phone className="w-4 h-4 mr-1" />
                    <a
                      href={`tel:${member.phone}`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {member.phone}
                    </a>
                  </div>
                )}

                {member.social && (
                  <div className="flex justify-center space-x-3">
                    {member.social.linkedin && (
                      <a
                        href={member.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.social.github && (
                      <a
                        href={member.social.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        title="GitHub"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a
                        href={member.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                        title="Twitter"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {member.social.whatsapp_business && (
                      <a
                        href={member.social.whatsapp_business}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-green-500 transition-colors"
                        title="WhatsApp Business - Ouvre l'app WhatsApp directement"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {member.social.facebook_lite && (
                      <a
                        href={member.social.facebook_lite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Facebook - Ouvre l'app Facebook si disponible"
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Code className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('about.technical')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Version</div>
                  <div className="text-sm">{APP_INFO.version}</div>
                </div>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Build</div>
                  <div className="text-sm">{APP_INFO.buildDate}</div>
                </div>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Star className="w-4 h-4 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Licence</div>
                  <div className="text-sm">{APP_INFO.license}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Support</div>
                  <div className="text-sm">{APP_INFO.supportEmail}</div>
                </div>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Globe className="w-4 h-4 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Site web</div>
                  <a
                    href={APP_INFO.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    {APP_INFO.website}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t dark:border-slate-700">
          <p>{APP_INFO.copyright}</p>
          <p className="mt-2">
            {t('about.copyrightNote')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
