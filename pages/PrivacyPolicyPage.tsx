import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Database, Cookie, BarChart3, Users, Mail, Phone, Calendar, CheckCircle, AlertCircle, Lock, Trash2, Download, Linkedin, Github, Twitter, MessageCircle, Facebook, ArrowLeft } from 'lucide-react';
import { LEGAL_INFO, COMPANY_INFO, STANDARD_TEXTS } from '../types/professional';
import { useLanguage } from '../utils/languageContext';
import PageBackButton from '../components/PageBackButton';

const PrivacyPolicyPage: React.FC = () => {
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
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                <Shield className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('privacy.title')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t('privacy.subtitle')}
            </p>
          </div>
        </div>

        {/* Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Eye className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('privacy.commitment')}
            </h2>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300">
              Chez {COMPANY_INFO.fullName}, nous prenons la protection de vos données personnelles très au sérieux.
              Cette politique de confidentialité explique quelles données nous collectons, comment nous les utilisons,
              et comment nous protégeons votre vie privée conformément au RGPD et aux législations applicables.
            </p>
          </div>
        </div>

        {/* Data Collection */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Database className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('privacy.collection')}
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Données que nous collectons</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Données d'utilisation</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Pages visitées, temps passé, fonctionnalités utilisées
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Données techniques</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Adresse IP, type de navigateur, système d'exploitation
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Données de compte</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Nom, email, informations professionnelles (si applicable)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Données de support</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Messages envoyés, tickets de support, feedback
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Données que nous ne collectons PAS</h3>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 dark:text-green-200">
                      Nous ne collectons pas de données sensibles telles que :
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-300">
                      <li>• Données biométriques ou génétiques</li>
                      <li>• Opinions politiques ou convictions religieuses</li>
                      <li>• Données de santé ou orientation sexuelle</li>
                      <li>• Données financières ou bancaires</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage of Data */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('privacy.usage')}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Amélioration du service</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Analyser l'utilisation pour améliorer les fonctionnalités et l'expérience utilisateur
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Support client</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Répondre à vos questions et résoudre les problèmes techniques
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Sécurité</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Détecter et prévenir les activités frauduleuses ou malveillantes
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-bold">4</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Communication</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Vous informer des mises à jour importantes et des nouvelles fonctionnalités
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Cookie className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('privacy.cookies')}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Types de cookies utilisés</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Cookies techniques</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Essentiels au fonctionnement du site (authentification, panier, préférences)
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Cookies d'analyse</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Pour comprendre comment vous utilisez notre service et l'améliorer
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-1 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Cookies de tiers</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {LEGAL_INFO.privacy.thirdParty ? 'Utilisés pour des services externes' : 'Non utilisés'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Vous pouvez gérer vos préférences cookies via les paramètres de votre navigateur.
                Désactiver les cookies peut affecter certaines fonctionnalités du site.
              </p>
            </div>
          </div>
        </div>

        {/* Data Protection */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Lock className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('privacy.protection')}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Mesures de sécurité</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Chiffrement SSL/TLS
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Hébergement sécurisé
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Accès limité aux données
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Sauvegardes régulières
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Monitoring de sécurité
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Mises à jour régulières
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Durée de conservation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Vos données sont conservées uniquement le temps nécessaire aux finalités pour lesquelles
                elles ont été collectées, et ne dépassent généralement pas 5 ans après la dernière utilisation.
              </p>
            </div>
          </div>
        </div>

        {/* User Rights */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('privacy.rights')}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <Eye className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Droit d'accès</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Savoir quelles données nous détenons sur vous
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Download className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Droit de portabilité</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Recevoir vos données dans un format lisible
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <Trash2 className="w-5 h-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Droit d'effacement</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Demander la suppression de vos données
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Droit de limitation</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Limiter le traitement de vos données
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Pour exercer ces droits, contactez-nous à :{' '}
                <a href={`mailto:${COMPANY_INFO.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {COMPANY_INFO.email}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Mail className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('privacy.contact')}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Pour toute question sur vos données</h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{COMPANY_INFO.email}</span>
                </div>
                {COMPANY_INFO.phone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{COMPANY_INFO.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Délégué à la protection des données</h3>
              <div className="space-y-3">
                <p className="text-gray-600 dark:text-gray-300">
                  Notre DPO est <strong>{LEGAL_INFO.responsible.name}</strong>. Vous pouvez le contacter directement pour toute
                  question relative à la protection de vos données personnelles.
                </p>

                <div className="space-y-2">
                  {LEGAL_INFO.responsible.email && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4 mr-2" />
                      <a href={`mailto:${LEGAL_INFO.responsible.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {LEGAL_INFO.responsible.email}
                        {LEGAL_INFO.responsible.phone && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2" />
                            <a href={`tel:${LEGAL_INFO.responsible.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                              {LEGAL_INFO.responsible.phone}
                            </a>
                          </div>
                        )}
                      </a>
                    </div>
                  )}
                </div>

                {LEGAL_INFO.responsible.social && (
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">Suivez-le sur :</span>
                    <div className="flex space-x-3">
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
          </div>
        </div>

        {/* Update Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Calendar className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('privacy.updates')}
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">{t('legal.lastUpdate')} </span>
              <span className="text-gray-600 dark:text-gray-300">{LEGAL_INFO.lastUpdated}</span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Nous vous informerons de toute modification importante de cette politique par email
                ou via une notification sur notre site.
              </p>
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

export default PrivacyPolicyPage;
