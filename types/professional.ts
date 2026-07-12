// Types et interfaces pour les informations professionnelles réutilisables

export interface CompanyInfo {
  name: string;
  fullName: string;
  legalName: string;
  description: string;
  website?: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  registrationNumber?: string;
  vatNumber?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  email?: string;
  phone?: string;
  social?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    whatsapp_business?: string;
    facebook_lite?: string;
  };
}

export interface ProductInfo {
  name: string;
  fullName: string;
  description: string;
  version: string;
  type: 'freemium' | 'premium' | 'enterprise' | 'opensource';
  publisher: CompanyInfo;
  team: TeamMember[];
  copyright: string;
  license: string;
  buildDate: string;
  supportEmail: string;
  website?: string;
}

export interface LegalInfo {
  publisher: CompanyInfo;
  responsible: TeamMember;
  hosting: {
    provider: string;
    address: string;
  };
  privacy: {
    dataCollection: boolean;
    cookies: boolean;
    analytics: boolean;
    thirdParty: boolean;
  };
  copyright: string;
  lastUpdated: string;
}

// Configuration centralisée - MODIFIE CES VALEURS SELON TES BESOINS
export const COMPANY_INFO: CompanyInfo = {
  name: 'AR Business',
  fullName: 'AR Business Digital Solutions',
  legalName: 'AR Business Digital Solutions',
  description: 'Solutions numériques professionnelles et applications innovantes',
  website: 'https://arbusiness.app',
  email: 'contact@arbusiness.app',
  phone: '+242 06 566 8283',
  address: {
    street: '123 Rue de la Technologie',
    city: 'Paris',
    postalCode: '75001',
    country: 'France'
  },
  registrationNumber: 'FR 123 456 789',
  vatNumber: 'FR 12 345 678 901'
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'paul-ledev',
    name: 'Paul LeDev',
    role: 'Fondateur & Développeur Principal',
    bio: 'Développeur passionné avec plus de 5 ans d\'expérience dans la création d\'applications professionnelles. Spécialisé en React, TypeScript et architecture logicielle.',
    avatar: '/avatars/paul-ledev.png',
    email: 'paulledev36@gmail.com',
    phone: '+242665668283',
    social: {
      linkedin: 'https://linkedin.com/in/paul-ledev',
      github: 'https://github.com/paul-ledev',
      twitter: 'https://twitter.com/paul_ledev',
      whatsapp_business: 'https://wa.me/242065668283',
      facebook_lite: 'fb://profile/100087654321'
    }
  }
  // Ajoute d'autres membres de l'équipe ici
];

export const APP_INFO: ProductInfo = {
  name: 'Casier d\'Or',
  fullName: 'Casier d\'Or - Gestion de Dépôt de Boissons',
  description: 'Solution complète de gestion pour dépôts de boissons avec suivi des stocks, ventes et clients.',
  version: '1.0.0',
  type: 'freemium',
  publisher: COMPANY_INFO,
  team: TEAM_MEMBERS,
  copyright: `© ${new Date().getFullYear()} ${COMPANY_INFO.fullName}. Tous droits réservés.`,
  license: 'Proprietary - All rights reserved',
  buildDate: new Date().toISOString().split('T')[0],
  supportEmail: 'support@arbusiness.app',
  website: COMPANY_INFO.website
};

export const LEGAL_INFO: LegalInfo = {
  publisher: COMPANY_INFO,
  responsible: TEAM_MEMBERS[0], // Premier membre comme responsable
  hosting: {
    provider: 'Cloud Provider Inc.',
    address: 'Data Center, Paris, France'
  },
  privacy: {
    dataCollection: true,
    cookies: false,
    analytics: true,
    thirdParty: false
  },
  copyright: APP_INFO.copyright,
  lastUpdated: new Date().toISOString().split('T')[0]
};

// Fonctions utilitaires pour générer du contenu réutilisable
export const generateCopyright = (company?: CompanyInfo, year?: number) => {
  const currentYear = year || new Date().getFullYear();
  const companyName = company?.fullName || COMPANY_INFO.fullName;
  return `© ${currentYear} ${companyName}. Tous droits réservés.`;
};

export const generateProductInfo = (product?: ProductInfo) => {
  const info = product || APP_INFO;
  return {
    name: info.name,
    version: info.version,
    publisher: info.publisher.name,
    copyright: info.copyright,
    buildDate: info.buildDate
  };
};

export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return TEAM_MEMBERS.find(member => member.id === id);
};

// Textes standards réutilisables
export const STANDARD_TEXTS = {
  copyright: generateCopyright(),
  allRightsReserved: 'Tous droits réservés.',
  confidential: 'Informations confidentielles - Propriété de AR Business.',
  noReproduction: 'Toute reproduction, modification ou redistribution est interdite sans autorisation écrite.',
  professionalUse: 'Usage professionnel uniquement.',
  warranty: 'Ce logiciel est fourni "en l\'état", sans garantie d\'aucune sorte.',
  liability: 'AR Business ne pourra être tenue responsable des dommages directs ou indirects.',
  privacy: 'Vos données sont traitées conformément à notre politique de confidentialité.',
  contact: 'Pour toute question, contactez-nous à : contact@arbusiness.app'
};
