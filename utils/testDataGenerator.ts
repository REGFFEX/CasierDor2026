/**
 * Test Data Generator
 * 
 * Génère des données de test complètes pour tester l'application Casier d'Or
 * Compte admin, produits, clients, ventes, paramètres de boutique
 */

import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from './store';
import { User, UserRole, Permission, Client, Product, Sale, ProductType, ClientType, ContactMethod, StoreSettings } from '../types';
import { hashPassword } from './cryptoVault';
import { addActivity, LogAction } from './store';

interface TestDataConfig {
  forceRegenerate?: boolean;
  productCount?: number;
  clientCount?: number;
  saleCount?: number;
}

export const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@casierdor.app',
    password: 'Admin123!',
    firstName: 'Jean',
    lastName: 'Dupont',
    companyName: 'Dépôt Central'
  },
  staff: {
    email: 'staff@casierdor.app',
    password: 'Staff123!',
    firstName: 'Marie',
    lastName: 'Martin',
    companyName: 'Dépôt Central'
  }
};

export async function generateCompleteTestData(config: TestDataConfig = {}) {
  const {
    forceRegenerate = false,
    productCount = 20,
    clientCount = 15,
    saleCount = 30
  } = config;

  console.log('🚀 Génération des données de test...');

  // 1. Créer les comptes utilisateurs
  await generateTestUsers(forceRegenerate);

  // 2. Créer les paramètres de boutique
  await generateStoreSettings(forceRegenerate);

  // 3. Créer les produits
  await generateTestProducts(productCount, forceRegenerate);

  // 4. Créer les clients
  await generateTestClients(clientCount, forceRegenerate);

  // 5. Créer les ventes
  await generateTestSales(saleCount, forceRegenerate);

  console.log('✅ Données de test générées avec succès !');
  console.log('📝 Identifiants de connexion :');
  console.log(`   Admin: ${TEST_ACCOUNTS.admin.email} / ${TEST_ACCOUNTS.admin.password}`);
  console.log(`   Staff: ${TEST_ACCOUNTS.staff.email} / ${TEST_ACCOUNTS.staff.password}`);
}

async function generateTestUsers(force: boolean) {
  const existingUsers = getStoreData<User[]>(STORAGE_KEYS.USERS, []);
  
  if (!force && existingUsers.length > 0) {
    console.log('ℹ️  Utilisateurs existants - skipping');
    return;
  }

  const adminPassword = await hashPassword(TEST_ACCOUNTS.admin.password);
  const staffPassword = await hashPassword(TEST_ACCOUNTS.staff.password);

  const users: User[] = [
    {
      id: 'admin-test-001',
      storageAccountId: 'admin-test-001',
      uniqueId: 'ADM-001',
      name: `${TEST_ACCOUNTS.admin.firstName} ${TEST_ACCOUNTS.admin.lastName}`,
      firstName: TEST_ACCOUNTS.admin.firstName,
      lastName: TEST_ACCOUNTS.admin.lastName,
      email: TEST_ACCOUNTS.admin.email,
      password: adminPassword,
      companyName: TEST_ACCOUNTS.admin.companyName,
      role: UserRole.ADMIN,
      active: true,
      permissions: Object.values(Permission),
      isOnline: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preferences: { language: 'fr', showAnimations: true, fontSize: 'medium' }
    },
    {
      id: 'staff-test-001',
      storageAccountId: 'staff-test-001',
      uniqueId: 'STF-001',
      name: `${TEST_ACCOUNTS.staff.firstName} ${TEST_ACCOUNTS.staff.lastName}`,
      firstName: TEST_ACCOUNTS.staff.firstName,
      lastName: TEST_ACCOUNTS.staff.lastName,
      email: TEST_ACCOUNTS.staff.email,
      password: staffPassword,
      companyName: TEST_ACCOUNTS.staff.companyName,
      role: UserRole.STAFF,
      active: true,
      permissions: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_SALES,
        Permission.VIEW_STOCK,
        Permission.VIEW_CLIENTS,
        Permission.VIEW_REPORTS
      ],
      isOnline: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preferences: { language: 'fr', showAnimations: true, fontSize: 'medium' }
    }
  ];

  setStoreData(STORAGE_KEYS.USERS, users);
  console.log(`✅ ${users.length} utilisateurs créés`);
}

async function generateStoreSettings(force: boolean) {
  const existingSettings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  
  if (!force && existingSettings.storeName) {
    console.log('ℹ️  Paramètres existants - skipping');
    return;
  }

  const settings: StoreSettings = {
    ...DEFAULT_SETTINGS,
    storeName: 'Dépôt Central Brazzaville',
    currency: 'XAF',
    phone: '+242 05 555 1234',
    email: 'contact@depotcentral.cg',
    publicPhone: '+242 05 555 1234',
    publicEmail: 'info@depotcentral.cg',
    responsibleName: 'Jean Dupont',
    address: '45 Avenue de l'Indépendance, Brazzaville',
    language: 'fr',
    country: 'cg',
    enterpriseType: 'Société',
    activityType: 'Dépôt de Boisson',
    logo: '',
    userRole: UserRole.ADMIN,
    backupEnabled: true,
    theme: 'light',
    securityEnabled: true,
    recoveryConfig: undefined,
    updatedAt: Date.now()
  };

  setStoreData(STORAGE_KEYS.SETTINGS, settings);
  console.log('✅ Paramètres de boutique créés');
}

async function generateTestProducts(count: number, force: boolean) {
  const existingProducts = getStoreData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  
  if (!force && existingProducts.length > 0) {
    console.log('ℹ️  Produits existants - skipping');
    return;
  }

  const beverages = [
    { name: 'Brasseries du Congo', products: ['Primus', 'Mutzig', 'Castel', 'Beaufort'] },
    { name: 'SABC', products: ['Ngok', 'Dopra', 'Maltina'] },
    { name: 'Import', products: ['Heineken', 'Guinness', 'Stella Artois', 'Corona'] },
    { name: 'Eaux', products: ['Cristalline', 'Perrier', 'Badoit'] },
    { name: 'Jus', products: ['Orangina', 'Schweppes', 'Coca-Cola', 'Sprite'] }
  ];

  const products: Product[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = beverages[i % beverages.length];
    const productName = category.products[i % category.products.length];
    const isBeverage = ['Brasseries du Congo', 'SABC', 'Import'].includes(category.name);
    
    products.push({
      id: `prod-${(i + 1).toString().padStart(4, '0')}`,
      name: `${productName} ${isBeverage ? '33cl' : '1L'}`,
      description: `${productName} de haute qualité, fraîchement livré`,
      barcode: `${Date.now()}${i}`,
      sku: `SKU-${(i + 1).toString().padStart(4, '0')}`,
      price: isBeverage ? Math.floor(Math.random() * 3000) + 500 : Math.floor(Math.random() * 2000) + 300,
      cost: Math.floor(Math.random() * 2000) + 200,
      stock: Math.floor(Math.random() * 100) + 10,
      criticalThreshold: Math.floor(Math.random() * 10) + 5,
      category: category.name,
      type: isBeverage ? ProductType.BEVERAGE : ProductType.OTHER,
      unit: isBeverage ? 'bouteille' : 'bouteille',
      images: [],
      createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    });
  }

  setStoreData(STORAGE_KEYS.PRODUCTS, products);
  console.log(`✅ ${products.length} produits créés`);
}

async function generateTestClients(count: number, force: boolean) {
  const existingClients = getStoreData<Client[]>(STORAGE_KEYS.CLIENTS, []);
  
  if (!force && existingClients.length > 0) {
    console.log('ℹ️  Clients existants - skipping');
    return;
  }

  const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Marc', 'Julie', 'Paul', 'Claire', 'Luc', 'Emma'];
  const lastNames = ['Dupont', 'Martin', 'Bernard', 'Petit', 'Robert', 'Richard', 'Durand', 'Moreau', 'Simon', 'Michel'];
  const phonePrefixes = ['05', '06', '04'];

  const clients: Client[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const phonePrefix = phonePrefixes[i % phonePrefixes.length];
    const phoneSuffix = Math.floor(Math.random() * 900000) + 100000;
    
    clients.push({
      id: `client-${(i + 1).toString().padStart(4, '0')}`,
      code: `CL-${(i + 1).toString().padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      phone: `+242 ${phonePrefix} ${phoneSuffix}`,
      type: ClientType.SIMPLE_CLIENT,
      contactMethod: ContactMethod.PHONE,
      note: i % 3 === 0 ? 'Client VIP - Paiement systématique' : '',
      createdAt: Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    });
  }

  setStoreData(STORAGE_KEYS.CLIENTS, clients);
  console.log(`✅ ${clients.length} clients créés`);
}

async function generateTestSales(count: number, force: boolean) {
  const existingSales = getStoreData<Sale[]>(STORAGE_KEYS.SALES, []);
  
  if (!force && existingSales.length > 0) {
    console.log('ℹ️  Ventes existantes - skipping');
    return;
  }

  const products = getStoreData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const clients = getStoreData<Client[]>(STORAGE_KEYS.CLIENTS, []);
  
  if (products.length === 0 || clients.length === 0) {
    console.log('⚠️  Impossible de créer des ventes - produits ou clients manquants');
    return;
  }

  const paymentMethods = ['CASH', 'MOBILE_MONEY', 'CARD'];
  const mobileOperators = ['MTN MoMo', 'Airtel Money'];

  const sales: Sale[] = [];
  
  for (let i = 0; i < count; i++) {
    const numProducts = Math.floor(Math.random() * 4) + 1;
    const selectedProducts = [];
    let total = 0;

    for (let j = 0; j < numProducts; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const subtotal = product.price * quantity;
      
      selectedProducts.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        subtotal
      });
      
      total += subtotal;
    }

    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const client = clients[Math.floor(Math.random() * clients.length)];

    sales.push({
      id: `sale-${(i + 1).toString().padStart(4, '0')}`,
      saleNumber: `VTE-${Date.now().toString().slice(-6)}-${(i + 1).toString().padStart(3, '0')}`,
      clientName: client.name,
      clientPhone: client.phone,
      items: selectedProducts,
      total,
      paymentMethod,
      mobileOperator: paymentMethod === 'MOBILE_MONEY' ? mobileOperators[Math.floor(Math.random() * mobileOperators.length)] : undefined,
      status: 'completed',
      createdAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now()
    });
  }

  setStoreData(STORAGE_KEYS.SALES, sales);
  console.log(`✅ ${sales.length} ventes créées`);
}

// Fonction pour nettoyer les données de test
export function cleanupTestData() {
  console.log('🧹 Nettoyage des données de test...');
  
  setStoreData(STORAGE_KEYS.USERS, []);
  setStoreData(STORAGE_KEYS.PRODUCTS, []);
  setStoreData(STORAGE_KEYS.CLIENTS, []);
  setStoreData(STORAGE_KEYS.SALES, []);
  setStoreData(STORAGE_KEYS.ACTIVITIES, []);
  
  // Garder les paramètres de base
  setStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  
  console.log('✅ Données de test nettoyées');
}

// Fonction utilitaire pour ajouter à la console les identifiants
export function printTestCredentials() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔐 IDENTIFIANTS DE CONNEXION - CASIER D\'OR');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('👤 ADMINISTRATEUR');
  console.log(`   Email:    ${TEST_ACCOUNTS.admin.email}`);
  console.log(`   Mot de passe: ${TEST_ACCOUNTS.admin.password}`);
  console.log(`   Rôle:     ${UserRole.ADMIN}`);
  console.log('');
  console.log('👤 STAFF');
  console.log(`   Email:    ${TEST_ACCOUNTS.staff.email}`);
  console.log(`   Mot de passe: ${TEST_ACCOUNTS.staff.password}`);
  console.log(`   Rôle:     ${UserRole.STAFF}`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}
