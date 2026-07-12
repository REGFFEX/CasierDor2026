/**
 * Nettoyage des données de démonstration / test
 */

import { getStoreData, setStoreData, STORAGE_KEYS } from '../store';
import type { Product, Client } from '../types';

const DEMO_PRODUCT_SKUS = ['NG-001', 'PR-001', 'CA-001', 'VI-001'];
const DEMO_CLIENT_CODES = ['CL-001', 'CL-002'];
const TEST_USER_EMAILS = ['admin@casierdor.app', 'user@casierdor.app'];

export interface CleanupResult {
  productsRemoved: number;
  clientsRemoved: number;
  testUsersRemoved: number;
}

export function removeDemoData(): CleanupResult {
  const products = getStoreData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const clients = getStoreData<Client[]>(STORAGE_KEYS.CLIENTS, []);

  const filteredProducts = products.filter((p) => !DEMO_PRODUCT_SKUS.includes(p.sku));
  const filteredClients = clients.filter((c) => !DEMO_CLIENT_CODES.includes(c.code ?? ''));

  setStoreData(STORAGE_KEYS.PRODUCTS, filteredProducts);
  setStoreData(STORAGE_KEYS.CLIENTS, filteredClients);

  return {
    productsRemoved: products.length - filteredProducts.length,
    clientsRemoved: clients.length - filteredClients.length,
    testUsersRemoved: 0,
  };
}

export function removeTestAuthUsers(): number {
  try {
    const raw = localStorage.getItem('casierdor_users');
    if (!raw) return 0;
    const users = JSON.parse(raw) as { email: string }[];
    const before = users.length;
    const next = users.filter((u) => !TEST_USER_EMAILS.includes(u.email.toLowerCase()));
    localStorage.setItem('casierdor_users', JSON.stringify(next));
    return before - next.length;
  } catch {
    return 0;
  }
}

export function runFullTestDataCleanup(): CleanupResult {
  const demo = removeDemoData();
  const testUsersRemoved = removeTestAuthUsers();
  return { ...demo, testUsersRemoved };
}
