import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, Globe, Shield, FileText, Calendar, User, Server, AlertCircle, Linkedin, Github, Twitter, MessageCircle, Facebook, ArrowLeft } from 'lucide-react';
import { LEGAL_INFO, COMPANY_INFO, STANDARD_TEXTS } from '../types/professional';
import { useLanguage } from '../utils/languageContext';
import PageBackButton from '../components/PageBackButton';

const LegalPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-12">
          <PageBackButton className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-blue-300 transition-all group shadow-sm mr-4" />
          <div className="text-center flex-1 pr-10">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                <FileText className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('legal.title')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t('legal.subtitle')}
            </p>
          </div>
        </div>

        {/* Publisher Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Building2 className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('about.editor')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Nom légal : </span>
                <span className="text-gray-600 dark:text-gray-300">{COMPANY_INFO.legalName}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Nom commercial : </span>
                <span className="text-gray-600 dark:text-gray-300">{COMPANY_INFO.fullName}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Email : </span>
                <a href={`mailto:${COMPANY_INFO.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {COMPANY_INFO.email}
                </a>
              </div>
              {COMPANY_INFO.phone && (
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Téléphone : </span>
                  <span className="text-gray-600 dark:text-gray-300">{COMPANY_INFO.phone}</span>
                </div>
              )}
              {COMPANY_INFO.website && (
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Site web : </span>
                  <a
                    href={COMPANY_INFO.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {COMPANY_INFO.website}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {COMPANY_INFO.address && (
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Siège social : </span>
                  <div className="text-gray-600 dark:text-gray-300 mt-1">
                    {COMPANY_INFO.address.street}<br />
                    {COMPANY_INFO.address.postalCode} {COMPANY_INFO.address.city}<br />
                    {COMPANY_INFO.address.country}
                  </div>
                </div>
              )}
              {COMPANY_INFO.registrationNumber && (
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">N° d'entreprise : </span>
                  <span className="text-gray-600 dark:text-gray-300">{COMPANY_INFO.registrationNumber}</span>
                </div>
              )}
              {COMPANY_INFO.vatNumber && (
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">N° TVA : </span>
                  <span className="text-gray-600 dark:text-gray-300">{COMPANY_INFO.vatNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Responsible Person */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <User className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('legal.responsible')}
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">Nom : </span>
              <span className="text-gray-600 dark:text-gray-300">{LEGAL_INFO.responsible.name}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">Fonction : </span>
              <span className="text-gray-600 dark:text-gray-300">{LEGAL_INFO.responsible.role}</span>
            </div>
            {LEGAL_INFO.responsible.email && (
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Email : </span>
                <a href={`mailto:${LEGAL_INFO.responsible.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {LEGAL_INFO.responsible.email}
                  {LEGAL_INFO.responsible.phone && (
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Téléphone : </span>
                      <a href={`tel:${LEGAL_INFO.responsible.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {LEGAL_INFO.responsible.phone}
                      </a>
                    </div>
                  )}
                </a>
              </div>
            )}
            {LEGAL_INFO.responsible.bio && (
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">À propos : </span>
                <p className="text-gray-600 dark:text-gray-300 mt-1">{LEGAL_INFO.responsible.bio}</p>
              </div>
            )}
            {LEGAL_INFO.responsible.social && (
              <div>
                <span className="font-semibold text-gray-900 dark:text-white mb-3 block">Connectez-vous : </span>
                <div className="flex space-x-4">
                  {LEGAL_INFO.responsible.social.linkedin && (
                    <a
                      href={LEGAL_INFO.responsible.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {LEGAL_INFO.responsible.social.github && (
                    <a
                      href={LEGAL_INFO.responsible.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      title="GitHub"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {LEGAL_INFO.responsible.social.twitter && (
                    <a
                      href={LEGAL_INFO.responsible.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                      title="Twitter"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {LEGAL_INFO.responsible.social.whatsapp_business && (
                    <a
                      href={LEGAL_INFO.responsible.social.whatsapp_business}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-green-500 transition-colors"
                      title="WhatsApp Business - Ouvre l'app WhatsApp directement"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  )}
                  {LEGAL_INFO.responsible.social.facebook_lite && (
                    <a
                      href={LEGAL_INFO.responsible.social.facebook_lite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      title="Facebook - Ouvre l'app Facebook si disponible"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hosting */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Server className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('legal.hosting')}
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">Fournisseur : </span>
              <span className="text-gray-600 dark:text-gray-300">{LEGAL_INFO.hosting.provider}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">Localisation : </span>
              <span className="text-gray-600 dark:text-gray-300">{LEGAL_INFO.hosting.address}</span>
            </div>
          </div>
        </div>

        {/* Legal Terms */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('legal.terms')}
            </h2>
          </div>

          <div className="space-y-6 text-gray-600 dark:text-gray-300">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('legal.ip')}</h3>
              <p className="mb-3">
                L'ensemble de ce site, y compris son architecture, les textes, les images, les graphiques,
                les logos, les icônes, les sons et les logiciels, sont la propriété de {COMPANY_INFO.fullName}
                et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication, adaptation de tout ou partie
                des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sauf
                autorisation écrite préalable de {COMPANY_INFO.fullName}.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('legal.liability')}</h3>
              <p className="mb-3">
                {COMPANY_INFO.fullName} s'efforce de fournir sur ce site des informations aussi précises que possible.
                Toutefois, elle ne pourra être tenue responsable des omissions, des inexactitudes et des carences
                dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui
                fournissent ces informations.
              </p>
              <p>
                Tous les produits et services mis à disposition sur ce site le sont "en l'état" sans garantie
                d'aucune sorte, expresse ou implicite. {COMPANY_INFO.fullName} ne pourra être tenue responsable
                des dommages directs ou indirects découlant de l'utilisation de ce site ou des services proposés.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('legal.links')}</h3>
              <p>
                Le site peut contenir des liens hypertextes vers d'autres sites. {COMPANY_INFO.fullName} décline
                toute responsabilité quant au contenu des sites vers lesquels ces liens renvoient.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('legal.privacy')}</h3>
              <p>
                Conformément à la loi Informatique et Libertés du 6 janvier 1978 modifiée et au Règlement
                Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de modification,
                de rectification et de suppression des données vous concernant.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Important
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                En utilisant ce site, vous acceptez sans réserve les présentes mentions légales.
                {COMPANY_INFO.fullName} se réserve le droit de modifier ces mentions à tout moment.
              </p>
            </div>
          </div>
        </div>

        {/* Update Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Calendar className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('legal.updates')}
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">{t('legal.lastUpdate')} </span>
              <span className="text-gray-600 dark:text-gray-300">{LEGAL_INFO.lastUpdated}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">{t('legal.version')} </span>
              <span className="text-gray-600 dark:text-gray-300">1.0</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t dark:border-slate-700">
          <p>{STANDARD_TEXTS.copyright}</p>
          <p className="mt-2">
            {STANDARD_TEXTS.allRightsReserved}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
