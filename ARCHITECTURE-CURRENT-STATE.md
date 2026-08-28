# Casier d'Or — Current Architecture

## 1. Executive Summary

Casier d'Or est une application de gestion de dépôt de boisson/Point de vente multiplateforme (Web, Desktop via Tauri, Mobile via Capacitor) qui fonctionne principalement en mode **offline-first** avec une synchronisation optionnelle vers Supabase. L'application utilise principalement **localStorage** comme source de vérité pour les données métier, avec une architecture hybride authentification (locale + Supabase optionnelle).

**Caractéristiques principales :**
- Architecture Single Page Application (SPA) React + TypeScript
- Stockage principal : localStorage avec isolation par compte utilisateur
- Authentification hybride : locale (localStorage) + Supabase Auth (optionnel)
- Synchronisation vers Supabase : file d'attente FIFO offline-first
- Multiplateforme : Web, Desktop (Tauri), Mobile (Capacitor/Android)
- Modules métier : Ventes, Produits, Clients, Stock, Comptabilité, etc.

## 2. Project Structure

```
prjetcasierdor2026/
├── .agents/                 # Skills pour Devin CLI
├── .devin/                  # Configuration Devin
├── android/                 # Configuration Capacitor Android
├── components/              # Composants React réutilisables
│   └── auth/               # Composants d'authentification
├── docs/                    # Documentation
├── hooks/                   # Custom React hooks
├── pages/                   # Pages principales de l'application
│   └── settings/           # Sous-pages de configuration
├── prisma/                  # Schema Prisma (non utilisé activement)
├── public/                  # Assets statiques
├── scripts/                 # Scripts utilitaires
├── src-tauri/              # Configuration Tauri (Desktop)
├── styles/                 # Styles globaux
├── supabase/               # Migrations et configuration Supabase
│   └── migrations/        # SQL migrations
├── types/                  # TypeScript types
├── utils/                  # Services et utilitaires
├── App.tsx                 # Point d'entrée React
├── constants.tsx          # Constantes globales
├── index.html             # HTML entry point
├── index.tsx              # Bootstrap React
├── package.json           # Dépendances npm
├── store.ts               # Gestion de l'état global (localStorage)
├── tailwind.config.js     # Configuration Tailwind
├── tsconfig.json          # Configuration TypeScript
└── vite.config.ts         # Configuration Vite
```

**Fichiers principaux :**
- `App.tsx` : Router React, providers, routes
- `store.ts` : Gestion localStorage, sync queue, CRUD de base
- `utils/authService.ts` : Service d'authentification hybride
- `utils/authContext.tsx` : Context React pour l'auth
- `utils/syncEngine.ts` : Moteur de synchronisation Supabase
- `utils/accountStorage.ts` : Isolation localStorage par compte
- `utils/supabaseClient.ts` : Client Supabase JS

## 3. Technology Stack

### Frontend
- **React 19.2.8** : Framework UI
- **TypeScript 5.8.3** : Typage
- **Vite 6.4.3** : Build tool et dev server
- **Tailwind CSS 3.4.19** : Styling
- **React Router DOM 7.18.1** : Routing client-side
- **Lucide React 0.562.0** : Icônes

### Desktop (Tauri)
- **Tauri 2.11.1** : Framework desktop (Rust backend)
- Configuration dans `src-tauri/tauri.conf.json`

### Mobile (Capacitor)
- **Capacitor 6.2.1** : Framework mobile natif
- **@capacitor/filesystem** : Accès fichiers mobile
- **@capacitor/share** : Partage mobile
- Configuration dans `capacitor.config.ts`

### Backend Cloud (Optionnel)
- **Supabase JS 2.112.4** : Client Supabase
- **PostgreSQL** : Base de données distante (via Supabase)
- **Prisma 7.9.0** : ORM (défini mais pas activement utilisé)

### Utilitaires
- **crypto-js 4.2.0** : Cryptographie
- **date-fns 4.4.0** : Manipulation dates
- **file-saver 2.0.5** : Téléchargement fichiers
- **html2canvas 1.4.1** : Capture d'écran
- **jszip 3.10.1** : Compression ZIP
- **recharts 3.10.0** : Graphiques
- **xlsx 0.18.5** : Export Excel
- **jspdf 4.2.1** : Génération PDF
- **jspdf-autotable 5.0.8** : Tableaux PDF

### Technologies Installées Mais Peu Utilisées
- **Prisma** : Schema défini dans `prisma/schema.prisma` mais DATABASE_URL non configurée, client non utilisé dans le code
- **Supabase** : Configuré mais seulement utilisé si variables d'environnement présentes

## 4. Application Flow

### Flux d'initialisation
```
index.html
↓
index.tsx
↓
App.tsx
↓
initializeStore() [store.ts]
↓
syncEngine.start() [utils/syncEngine.ts]
↓
Providers (Language, Theme, Auth, Sidebar)
↓
HashRouter + Routes
↓
ProtectedRoute / PublicRoute guards
↓
Page components
```

### Flux d'authentification (Mode Local)
```
LoginPage / RegisterPage
↓
authContext.login() / register()
↓
authService.login() / register() [utils/authService.ts]
↓
LocalDatabase.findUserByEmail() / createUser()
↓
localStorage (casierdor_users)
↓
saveCurrentUser() → localStorage (auth_user)
↓
activateStorageForUser() → localStorage scope
↓
AuthContext dispatch AUTH_SUCCESS
↓
ProtectedRoute allows access
↓
Dashboard / Other pages
```

### Flux d'authentification (Mode Supabase)
```
LoginPage / RegisterPage
↓
authService.login() / register()
↓
isSupabaseConfigured() check
↓
supabase.auth.signInWithPassword() / signUp()
↓
fetchSupabaseUserProfile() → Supabase table User
↓
mapSupabaseUserRow() → User object
↓
LocalDatabase.saveUser() → localStorage (casierdor_users)
↓
saveCurrentUser() → localStorage (auth_user)
↓
activateStorageForUser() → localStorage scope
↓
AuthContext dispatch AUTH_SUCCESS
```

### Flux de données métier (CRUD)
```
UI Component (Dashboard, NewSale, etc.)
↓
getStoreData() / setStoreData() [store.ts]
↓
scopeStorageKey() [utils/accountStorage.ts]
↓
localStorage.getItem() / setItem()
↓
Scoped key: casier_products::userId
↓
enqueueSyncItem() [utils/syncQueue.ts]
↓
localStorage (casier_sync_queue)
↓
syncEngine.processQueue() [utils/syncEngine.ts]
↓
supabase.from(tableName).upsert() (si configuré)
```

### Flux de synchronisation
```
User modifies data
↓
setStoreData() detects changes
↓
enqueueSyncItem() → sync queue
↓
syncEngine checks every 30s
↓
If online && Supabase configured:
↓
Process queue items (FIFO)
↓
supabase.from(tableName).upsert() / update() / delete()
↓
dequeueSyncItem() on success
↓
markSyncAttempt() on failure
```

## 5. Data Persistence

### Mécanismes de stockage identifiés

#### 1. localStorage (Principal)
**Emplacement :** Navigateur localStorage

**Clés principales :**
- `casierdor_users` : Utilisateurs (auth locale)
- `auth_user` : Utilisateur connecté courant
- `auth_token` : Token d'authentification
- `casier_active_storage_scope` : Scope de stockage actif
- `casierdor_installation_secret` : Secret installation (crypto)
- `casier_sync_queue` : File d'attente synchronisation
- `casier_recent_modules` : Modules récents visités

**Clés scopées (par utilisateur) :**
- `casier_products::userId` : Produits
- `casier_clients::userId` : Clients
- `casier_sales::userId` : Ventes
- `casier_settings::userId` : Paramètres
- `casier_stock_movements::userId` : Mouvements stock
- `casier_recent_payments::userId` : Paiements récents
- `casier_recycle_bin::userId` : Corbeille
- `casier_activities::userId` : Activités
- `casier_accounting_transactions::userId` : Transactions comptables
- `casier_replenishment_orders::userId` : Commandes réapprovisionnement
- `casier_archives::userId` : Archives

**Qui écrit :**
- `store.ts` : `setStoreData()`, `initializeStore()`
- `authService.ts` : `saveCurrentUser()`, `LocalDatabase.saveToLocalStorage()`
- `syncQueue.ts` : `saveQueue()`
- `accountStorage.ts` : `setActiveStorageScope()`, `migrateLegacyStoreToScope()`

**Qui lit :**
- `store.ts` : `getStoreData()`
- `authService.ts` : `loadCurrentUser()`, `LocalDatabase.loadFromLocalStorage()`
- Toutes les pages via `getStoreData()`

**Persistance :** Persistant (jusqu'à clear browser data)

#### 2. Supabase PostgreSQL (Optionnel)
**Emplacement :** Cloud Supabase

**Tables définies :**
- `Tenant` : Comptes établissements
- `User` : Utilisateurs (liés à Tenant)
- `Plan` : Plans d'abonnement
- `Subscription` : Abonnements
- `Product` : Produits (avec tenantId)
- `Client` : Clients (avec tenantId)
- `Sale` : Ventes (avec tenantId)
- `SyncOutbox` : File sync miroir
- `Activity` : Journal d'activités
- `TrashItem` : Corbeille globale

**Qui écrit :**
- `syncEngine.ts` : `supabase.from(tableName).upsert()`
- Supabase Auth triggers : Création automatique Tenant/User

**Qui lit :**
- `authService.ts` : `fetchSupabaseUserProfile()`
- `syncEngine.ts` : Lecture pour sync (implicitement via upsert)

**Persistance :** Persistant cloud

**Activation :** Seulement si `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` configurés

#### 3. Capacitor Filesystem (Mobile)
**Emplacement :** Stockage appareil mobile

**Dossiers :**
- `CasierDor/Downloads` : Téléchargements
- `CasierDor/Backups` : Sauvegardes
- `CasierDor/Updates` : Mises à jour

**Qui écrit :**
- `fileManager.ts` : `Filesystem.writeFile()`

**Qui lit :**
- `fileManager.ts` : `Filesystem.readdir()`

**Persistance :** Persistant appareil

#### 4. Fichiers locaux (Desktop/Web)
**Emplacement :** Téléchargements navigateur ou filesystem

**Formats :**
- JSON : Export/Import données
- PDF : Reçus, rapports
- ZIP : Archives
- Excel : Export comptabilité

**Qui écrit :**
- `fileManager.ts` : `downloadFile()`
- `exportService.ts` : Exportateurs spécifiques

**Persistance :** Persistant (géré par utilisateur)

### Tableau récapitulatif

| Donnée | Emplacement | Écriture | Lecture | Source supposée |
| ------ | ----------- | -------- | ------- | --------------- |
| Utilisateurs | localStorage | authService | authService | Locale primaire |
| Session courante | localStorage | authContext | authContext | Locale |
| Produits | localStorage (scoped) | store.ts | Pages | Locale |
| Clients | localStorage (scoped) | store.ts | Pages | Locale |
| Ventes | localStorage (scoped) | store.ts | Pages | Locale |
| Settings | localStorage (scoped) | store.ts | Pages | Locale |
| Sync Queue | localStorage | syncQueue | syncEngine | Locale |
| Tenant/User (Supabase) | PostgreSQL | Supabase triggers | authService | Cloud (optionnel) |
| Produits (Supabase) | PostgreSQL | syncEngine | (non lu directement) | Cloud (optionnel) |
| Fichiers exports | Filesystem | fileManager | Utilisateur | Local |

## 6. Authentication

### Système hybride actuel

#### Mode Local (Défaut)
**Création de compte :**
1. `RegisterPage` collecte les données
2. `authService.register()` appelé
3. `LocalDatabase.createUser()` génère ID et hash password
4. Utilisateur sauvegardé dans `localStorage.casierdor_users`
5. `saveCurrentUser()` sauvegarde dans `localStorage.auth_user`
6. `activateStorageForUser()` définit le scope localStorage

**Où le compte est enregistré :**
- Principal : `localStorage.casierdor_users` (tableau JSON)
- Session : `localStorage.auth_user` (objet JSON unique)

**Gestion du mot de passe :**
- Hashé avec `cryptoVault.ts` (PBKDF2-SHA256 via crypto-js)
- Stocké dans le champ `password` de l'objet User
- Upgrade automatique si hash legacy détecté

**Connexion :**
1. `LoginPage` → `authService.login()`
2. `LocalDatabase.findUserByEmail()` cherche dans localStorage
3. Vérification password hash avec `verifyPassword()`
4. Si valide → `saveCurrentUser()` + `activateStorageForUser()`
5. Met à jour `lastLogin` dans localStorage

**Déconnexion :**
1. `authService.logout()`
2. Supprime `localStorage.auth_user`
3. Supprime `localStorage.auth_token`
4. `clearActiveStorageScope()` → supprime scope actif
5. Redirige vers `/login`

**Session conservée :**
- `localStorage.auth_user` : Utilisateur courant
- `localStorage.auth_token` : Token (non utilisé en mode local)
- `localStorage.casier_active_storage_scope` : Scope ID

**Utilisateur connecté stocké :**
- `localStorage.auth_user` (objet User complet)
- Aussi dans `localStorage.casierdor_users` (liste tous utilisateurs)

#### Mode Supabase (Optionnel)
**Activation :**
- Dépend de `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- Déterminé par `isSupabaseConfigured()` dans `authService.ts`

**Création de compte :**
1. `supabase.auth.signUp()` avec métadonnées
2. Trigger `handle_auth_user_created()` crée Tenant + User dans PostgreSQL
3. `fetchSupabaseUserProfile()` récupère la ligne User
4. `mapSupabaseUserRow()` convertit en User local
5. `LocalDatabase.saveUser()` sauvegarde aussi dans localStorage
6. `saveCurrentUser()` + `activateStorageForUser()`

**Connexion :**
1. `supabase.auth.signInWithPassword()`
2. `fetchSupabaseUserProfile()` récupère profile Supabase
3. `LocalDatabase.saveUser()` synchronise avec localStorage
4. `saveCurrentUser()` + `activateStorageForUser()`

**Déconnexion :**
1. `supabase.auth.signOut()`
2. Même nettoyage localStorage que mode local

### Fonctionnalités liées

**Reset password :**
- Mode local : Token généré dans `localStorage.passwordResetTokens` (Map)
- Mode Supabase : `supabase.auth.resetPasswordForEmail()`

**Récupération de compte :**
- Supporte clé de récupération via `cryptoVault.ts`
- Fichier de récupération chiffré
- Stockage hash clé dans settings

**Test accounts :**
- `enableTestAccounts` dans settings
- Admin test: `admin@casierdor.app` / `admin123`
- Géré par `LocalDatabase.initializeTestData()`

### Coexistence des systèmes
- **Les deux systèmes peuvent coexister**
- Supabase Auth utilisé si configuré, fallback vers local
- Données utilisateur toujours synchronisées dans localStorage
- Base distante (Supabase) utilisée pour sync des données métier uniquement si configurée

## 7. Session Management

### État de la session
**Géré par :** `authContext.tsx` (React Context + useReducer)

**État (AuthState) :**
```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null,
  connectionMode: ConnectionMode,
  deviceType: DeviceType,
  isOnline: boolean
}
```

**Initialisation :**
1. `useEffect` dans `AuthProvider`
2. Lit `localStorage.auth_user`
3. Déclenche `INITIALIZE` action
4. Définit device type via `detectDeviceType()`
5. Active storage scope via `activateStorageForUser()`

**Persistance session :**
- `localStorage.auth_user` : Session principale
- `localStorage.auth_token` : Token (Supabase)
- `localStorage.casier_active_storage_scope` : Scope données
- `localStorage.auth_remember` : "Remember me" preference

**Nettoyage session :**
- Suppression clés auth localStorage
- `clearActiveStorageScope()`
- Dispatch `LOGOUT` action

### Isolation par compte
**Mécanisme :** `accountStorage.ts`

**Scope ID :** `user.storageAccountId` ou `user.id`

**Préfixage :**
- Clé globale : `casier_products`
- Clé scopée : `casier_products::userId`

**Activation :**
```typescript
activateStorageForUser(user) {
  scopeId = user.storageAccountId || user.id
  setActiveStorageScope(scopeId)
  migrateLegacyStoreToScope(scopeId)
}
```

**Migration legacy :**
- Données sans scope copiées vers scope utilisateur
- Flag `casier_migrated_scope_{userId}` évite re-migration

## 8. Synchronization

### Architecture sync actuelle

**Moteur :** `syncEngine.ts`

**File d'attente :** `syncQueue.ts` (localStorage)

**Stratégie :** Offline-first avec sync différé

### Flux de synchronisation

**Détection changements :**
```typescript
setStoreData(key, value) {
  // Diff entre old et new
  enqueueSyncItem(entity, 'create', newItem)
  enqueueSyncItem(entity, 'update', newItem)
  enqueueSyncItem(entity, 'delete', {id})
  localStorage.setItem(scopedKey, JSON.stringify(value))
}
```

**File d'attente :**
- Clé : `casier_sync_queue`
- Structure : FIFO (triée par createdAt)
- Max items : 500
- Champs : id, entity, operation, payload, attempts, lastError

**Traitement :**
- Intervalle : 30 secondes
- Déclencheur : Also on `online` event
- Batch : 10 items par cycle
- Condition : Online + Supabase configuré

**Opérations :**
```typescript
if (operation === 'create' || operation === 'update') {
  supabase.from(tableName).upsert(payload)
} else if (operation === 'delete') {
  supabase.from(tableName).update({deletedAt, active: false})
  // Fallback hard delete
}
```

**Tenant isolation :**
- `tenantId` injecté depuis `localStorage.auth_user.tenantId`
- Satisfait RLS policies Supabase

### États de synchronisation

**Sync Queue Item :**
```typescript
{
  id: string,
  entity: SyncEntityType,
  operation: SyncOperation,
  payload: Record<string, unknown>,
  createdAt: number,
  attempts: number,
  lastError?: string
}
```

**Stats :**
- `getSyncQueueStats()` : pending count, failed count

### Risques identifiés

**Perte de données potentielle :**
- **Empty remote → overwrite local** : Si Supabase vide, sync pourrait écraser localStorage
- **No pull mechanism** : Pas de pull depuis Supabase vers localStorage
- **Conflict resolution** : Pas de stratégie de merge, last write wins
- **Queue overflow** : Si > 500 items, oldest dropped
- **No retry backoff** : Retry immédiat, pas d'exponentiel

**Absence de bidirectionnalité :**
- Sync uniquement : Local → Remote
- Pas de : Remote → Local
- Si données modifiées sur Supabase directement, pas reflétées localement

## 9. Business Modules

### Modules identifiés

#### 1. Dashboard
**Rôle :** Vue d'ensemble, statistiques rapides
**Données :** Ventes du jour, produits critiques, activité récente
**Composants :** `Dashboard.tsx`
**Stockage :** `casier_sales`, `casier_products`, `casier_settings`
**Dépendances :** Sales, Products, Settings

#### 2. Sales (Ventes)
**Rôle :** Création et gestion des ventes
**Données :** Sale, SaleLine, PaymentDetails
**Composants :** `NewSale.tsx`, `HistoryPage.tsx`
**Stockage :** `casier_sales`
**Dépendances :** Products, Clients, Settings
**Fonctionnalités :** POS, multi-paiement, reçus

#### 3. Products (Produits)
**Rôle :** Gestion catalogue produits
**Données :** Product (name, sku, price, stock, type)
**Composants :** `ProductList.tsx`
**Stockage :** `casier_products`
**Dépendances :** Settings (currency)
**Fonctionnalités :** CRUD, alertes stock

#### 4. Clients
**Rôle :** Gestion clientèle
**Données :** Client (name, phone, type)
**Composants :** `ClientsPage.tsx`
**Stockage :** `casier_clients`
**Dépendances :** Settings

#### 5. Stock
**Rôle :** Gestion des stocks
**Données :** Stock movements, Product stock levels
**Composants :** `StockPage.tsx`
**Stockage :** `casier_stock_movements`, `casier_products`
**Dépendances :** Products

#### 6. Accounting (Comptabilité)
**Rôle :** Suivi financier
**Données :** AccountingTransaction
**Composants :** `AccountingPage.tsx`
**Stockage :** `casier_accounting_transactions`
**Dépendances :** Sales, Settings

#### 7. Replenishment (Réapprovisionnement)
**Rôle :** Gestion commandes fournisseurs
**Données :** ReplenishmentOrder
**Composants :** `ReplenishmentPage.tsx`
**Stockage :** `casier_replenishment_orders`
**Dépendances :** Products, Suppliers

#### 8. Stats (Statistiques)
**Rôle :** Rapports et graphiques
**Données :** Agrégats Sales, Products
**Composants :** `StatsPage.tsx`
**Stockage :** `casier_sales`, `casier_products`
**Dépendances :** Sales, Products

#### 9. Activity (Activité)
**Rôle :** Journal d'audit
**Données :** Activity (userName, action, details, timestamp)
**Composants :** `ActivityPage.tsx`
**Stockage :** `casier_activities`
**Dépendances :** Tous modules

#### 10. Trash (Corbeille)
**Rôle :** Récupération éléments supprimés
**Données :** TrashItem (originalId, module, data, expiresAt)
**Composants :** `RecycleBinPage.tsx`
**Stockage :** `casier_recycle_bin`
**Dépendances :** Tous modules

#### 11. Users (Utilisateurs)
**Rôle :** Gestion des comptes utilisateurs
**Données :** User (rôles, permissions)
**Composants :** `UsersManagementPage.tsx`
**Stockage :** `casierdor_users` (global), `casier_users` (scoped)
**Dépendances :** Settings

#### 12. Settings (Paramètres)
**Rôle :** Configuration application
**Données :** StoreSettings (entreprise, préférences)
**Composants :** `SettingsPage.tsx`
**Stockage :** `casier_settings`
**Dépendances :** Aucun (module racine)

#### 13. Permissions
**Rôle :** Gestion des droits
**Données :** Permission mapping
**Composants :** `PermissionsPage.tsx`
**Stockage :** Settings (loginAttempts, securityActive)
**Dépendances :** Users

#### 14. About/Legal/Privacy
**Rôle :** Information légale
**Données :** Static content
**Composants :** `AboutPage.tsx`, `LegalPage.tsx`, `PrivacyPolicyPage.tsx`
**Stockage :** Aucun
**Dépendances :** Aucun

## 10. State Management

### État global actuel

**Pas de Redux/Zustand**

**État géré par :**
1. **React Contexts :**
   - `authContext.tsx` : Authentification
   - `languageContext.tsx` : Langue/i18n
   - `themeContext.tsx` : Thème (light/dark)
   - `sidebarContext.tsx` : État sidebar

2. **localStorage (Source de vérité) :**
   - `store.ts` : Fonctions `getStoreData()` / `setStoreData()`
   - Lecture directe dans les composants
   - Pas de state React global

3. **État local composants :**
   - `useState` dans chaque composant
   - Pas de partage entre composants

### Flux UI → State → Persistence

```
UI Component
↓
useState (local state)
↓
getStoreData() / setStoreData() [store.ts]
↓
scopeStorageKey() [accountStorage.ts]
↓
localStorage.getItem() / setItem()
↓
enqueueSyncItem() [syncQueue.ts]
↓
syncEngine.processQueue() [syncEngine.ts]
↓
Supabase (optionnel)
```

### Responsabilités

**UI Components :**
- Gèrent leur propre état local
- Appellent `getStoreData()` pour lire
- Appellent `setStoreData()` pour écrire

**store.ts :**
- Abstraction localStorage
- Diff detection pour sync
- CRUD de base (addActivity, moveToTrash, restoreFromTrash)

**authContext.tsx :**
- Gère état auth global
- Dispatch actions via reducer
- Persiste dans localStorage

**accountStorage.ts :**
- Gère isolation par compte
- Préfixe les clés localStorage
- Migration legacy data

## 11. API / Backend

### Backend traditionnel
**ABSENT** - Pas d'API REST/GraphQL propre

### Backend cloud (Supabase)
**Utilisé comme backend-as-a-service**

**Endpoints :**
- Pas d'endpoints custom
- Utilise PostgREST (auto-généré par Supabase)
- Tables accessibles via `supabase.from(tableName)`

**Services :**
- Aucun service backend custom
- Logique métier dans le frontend

**Contrôleurs :**
- Aucun
- Frontend appelle Supabase directement

**Validation :**
- Côté frontend TypeScript
- RLS policies Supabase côté backend

**Authentification :**
- Supabase Auth (si configuré)
- Fallback auth locale

**Autorisation :**
- RLS policies avec `current_tenant_id()`
- Permissions côté frontend

**Accès aux données :**
- Frontend → Supabase JS Client → PostgreSQL
- Pas de couche API intermédiaire

## 12. Supabase

### Configuration existante

**Fichiers :**
- `utils/supabaseClient.ts` : Client initialisation
- `supabase/migrations/20260805191000_enable_rls_tenant_isolation.sql` : Migration principale

**Variables d'environnement :**
- `VITE_SUPABASE_URL` : URL instance Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anon
- `VITE_SUPABASE_PUBLISHABLE_KEY` : Alias (legacy)

### Migrations

**Migration principale :** `20260805191000_enable_rls_tenant_isolation.sql`

**Contenu :**
1. **Function `current_tenant_id()`** : Résout tenant pour session courante
2. **Trigger `handle_auth_user_created()`** : Crée Tenant + User à l'inscription
3. **Indexes** : Sur tenantId pour toutes les tables
4. **RLS Policies** : Isolation multi-tenant sur toutes les tables
5. **Tables activées** : Tenant, User, Product, Client, Sale, SyncOutbox

### Tables définies

**Tenant :**
- id, name, activityType, sector, companySize
- users[], products[], clients[], sales[]

**User :**
- id, tenantId, email, passwordHash, role, displayName
- storageAccountId (pour mapping localStorage)

**Product :**
- id, tenantId, sku, name, price, stock, type
- localId (mapping localStorage)

**Client :**
- id, tenantId, code, name, phone
- localId (mapping localStorage)

**Sale :**
- id, tenantId, saleNumber, total, status, date
- payload (JSON lignes), localId

**SyncOutbox :**
- id, tenantId, entity, operation, payload
- attempts, lastError

**Activity :**
- id, tenantId, userName, action, details
- timestamp, payload

**TrashItem :**
- id, tenantId, originalId, module, data
- deletedAt, expiresAt

### RLS Policies

**Stratégie :** Tenant isolation

**Exemple Policy (Product) :**
```sql
CREATE POLICY product_tenant_all ON "Product"
  FOR ALL TO authenticated
  USING ("tenantId" = public.current_tenant_id())
  WITH CHECK ("tenantId" = public.current_tenant_id());
```

**Toutes les tables :** Même pattern tenantId-based

### Auth

**Utilisation :**
- `supabase.auth.signInWithPassword()`
- `supabase.auth.signUp()`
- `supabase.auth.signOut()`
- `supabase.auth.resetPasswordForEmail()`

**Métadonnées stockées :**
- first_name, last_name
- company_name, role
- enterprise_type, activity_type
- phone, recovery_email
- avatar, logo

### Storage
**Non configuré** - Pas de buckets Supabase Storage

### Realtime
**Non configuré** - Pas de subscriptions realtime

### Edge Functions
**Aucune** - Pas de fonctions edge

### Utilisation réelle
**Conditionnelle :**
- Seulement si variables env configurées
- Check via `isSupabaseConfigured()`
- Fallback vers localStorage si non configuré

**Utilisé pour :**
- Authentification (si configuré)
- Sync des données métier (si configuré)
- Rien d'autre

## 13. Prisma

### Configuration existante

**Fichier :** `prisma/schema.prisma`

**Datasource :**
```prisma
datasource db {
  provider = "postgresql"
}
```

**Note :** Pas de `DATABASE_URL` configurée

### Modèles définis

**Modèles similaires à Supabase :**
- Tenant, User, Plan, Subscription
- Product, Client, Sale
- SyncOutbox, Activity, TrashItem

**Relations :**
- Tenant → Users, Products, Clients, Sales
- User → Tenant
- Plan → Subscriptions
- Subscription → Tenant, Plan

### Migrations
**Aucune** - Dossier `prisma/migrations` absent ou vide

### Client Prisma
**Installé mais non utilisé :**
- `@prisma/client` dans devDependencies
- Pas d'imports dans le code
- Pas de `prisma generate` exécuté

### Utilisation réelle
**NÉGLIGEABLE** - Schema défini mais :
- Pas de DATABASE_URL
- Pas de client généré
- Pas utilisé dans le code
- Probablement préparé pour future utilisation

**Conclusion :** Prisma est **présent mais inactif**

## 14. Data Flow Diagrams

### Flux global principal

```
┌─────────────────────────────────────────────────────────────┐
│                        USER                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      UI COMPONENTS                           │
│  (Dashboard, NewSale, ProductList, etc.)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   LOCAL STATE (useState)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    store.ts                                  │
│  (getStoreData, setStoreData, enqueueSyncItem)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              accountStorage.ts                               │
│         (scopeStorageKey, isolation)                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  LOCAL STORAGE                               │
│  (casier_products::userId, casier_sales::userId, etc.)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   syncQueue.ts                               │
│              (casier_sync_queue)                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  syncEngine.ts                               │
│         (processQueue every 30s if online)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
                   ┌───────┴───────┐
                   │               │
                   ↓               ↓
          ┌──────────────┐  ┌──────────────┐
          │  CONFIGURED  │  │ NOT CONFIGURED│
          │   SUPABASE   │  │   SUPABASE    │
          └──────┬───────┘  └───────┬──────┘
                 │                  │
                 ↓                  │
          ┌──────────────┐           │
          │  SUPABASE    │           │
          │  POSTGRESQL  │           │
          └──────────────┘           │
                                      │
                                      ↓
                             ┌──────────────┐
                             │   LOCAL ONLY  │
                             │   NO SYNC     │
                             └──────────────┘
```

### Flux authentification

```
┌─────────────────────────────────────────────────────────────┐
│              LOGIN / REGISTER PAGE                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 authContext.login/register                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                authService.login/register                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                   ┌───────┴───────┐
                   │               │
                   ↓               ↓
          ┌──────────────┐  ┌──────────────┐
          │   SUPABASE   │  │    LOCAL     │
          │  CONFIGURED? │  │   DATABASE   │
          └──────┬───────┘  └──────┬───────┘
                 │                  │
                 ↓                  ↓
          ┌──────────────┐  ┌──────────────┐
          │ supabase.auth│  │ localStorage  │
          │  signIn/signUp│ │ casierdor_users│
          └──────┬───────┘  └──────┬───────┘
                 │                  │
                 └──────┬───────────┘
                        │
                        ↓
          ┌──────────────────────────┐
          │   LocalDatabase.saveUser │
          │   (localStorage toujours)│
          └───────────┬──────────────┘
                      │
                      ↓
          ┌──────────────────────────┐
          │     saveCurrentUser      │
          │   (auth_user localStorage)│
          └───────────┬──────────────┘
                      │
                      ↓
          ┌──────────────────────────┐
          │  activateStorageForUser  │
          │   (scope isolation)      │
          └───────────┬──────────────┘
                      │
                      ↓
          ┌──────────────────────────┐
          │   AuthContext dispatch   │
          │      AUTH_SUCCESS        │
          └───────────┬──────────────┘
                      │
                      ↓
          ┌──────────────────────────┐
          │     ProtectedRoute      │
          │      allows access      │
          └──────────────────────────┘
```

### Flux scénario Machine A → Machine B

```
MACHINE A
┌─────────────────────────────────────────────────────────────┐
│  1. RegisterPage → authService.register()                   │
│     ↓                                                        │
│  2. LocalDatabase.createUser()                              │
│     ↓                                                        │
│  3. localStorage.casierdor_users = [newUser]                 │
│     ↓                                                        │
│  4. localStorage.auth_user = newUser                        │
│     ↓                                                        │
│  5. activateStorageForUser(newUser)                          │
│     ↓                                                        │
│  6. localStorage.casier_active_storage_scope = newUser.id    │
│     ↓                                                        │
│  7. Données métier → localStorage scoped (casier_products::userId)│
│     ↓                                                        │
│  8. Déconnexion → clearActiveStorageScope()                 │
│     ↓                                                        │
│  9. localStorage vidé (scope supprimé)                       │
└─────────────────────────────────────────────────────────────┘

MACHINE B
┌─────────────────────────────────────────────────────────────┐
│  1. LoginPage → authService.login(email, password)           │
│     ↓                                                        │
│  2. isSupabaseConfigured()? → false (probable)              │
│     ↓                                                        │
│  3. LocalDatabase.findUserByEmail(email)                    │
│     ↓                                                        │
│  4. localStorage.casierdor_users = [] ( Vide ! )             │
│     ↓                                                        │
│  5. USER NOT FOUND → Erreur                                 │
│     ↓                                                        │
│  6. IMPOSSIBLE DE SE CONNECTER                              │
└─────────────────────────────────────────────────────────────┘

PROBLÈME : Les données sont dans localStorage de Machine A
          Machine B n'a aucun accès à ces données
          Pas de base distante consultée pour l'auth locale
```

## 15. Architecture Problems

### Problèmes identifiés

#### 1. Source de vérité multiple
**Emplacement :** `store.ts`, `authService.ts`, `syncEngine.ts`

**Problème :**
- Données dans localStorage (locale)
- Données potentiellement dans Supabase (distante)
- Pas de stratégie claire de laquelle est la source de vérité
- Sync unidirectionnel (local → remote) uniquement

**Impact :**
- Conflits possibles
- Perte de données si remote écrasé
- Incohérences entre local et remote

**Preuve :**
```typescript
// store.ts - setStoreData écrit dans localStorage
localStorage.setItem(scopeStorageKey(key), JSON.stringify(value));

// syncEngine.ts - essaie d'écrire dans Supabase
await supabase.from(tableName).upsert(finalPayload);
```

#### 2. Authentification locale isolée par appareil
**Emplacement :** `authService.ts` (LocalDatabase class)

**Problème :**
- Comptes créés stockés dans localStorage de l'appareil
- Pas de base distante pour les comptes locaux
- Impossible de se connecter depuis un autre appareil
- Cas Machine A → Machine B impossible

**Impact :**
- Perte d'accès aux données si changement d'appareil
- Pas de véritable multi-device
- Contredit l'objectif d'une application cloud

**Preuve :**
```typescript
// authService.ts - LocalDatabase
private saveToLocalStorage() {
  localStorage.setItem('casierdor_users', JSON.stringify(this.users));
}

// authService.ts - createUser
async createUser(userData: RegisterData): Promise<User> {
  // ...
  this.users.push(newUser);
  this.saveToLocalStorage(); // Uniquement localStorage
  return newUser;
}
```

#### 3. Pas de pull mechanism
**Emplacement :** `syncEngine.ts`

**Problème :**
- Sync uniquement push (local → remote)
- Pas de pull (remote → local)
- Données modifiées sur Supabase non répercutées
- Initialisation depuis Supabase impossible

**Impact :**
- Appareil ne peut pas récupérer les données distantes
- Si localStorage vidé, données perdues
- Pas de véritable synchronisation bidirectionnelle

**Preuve :**
```typescript
// syncEngine.ts - uniquement upsert
if (operation === 'create' || operation === 'update') {
  const { error } = await supabase.from(tableName).upsert(finalPayload);
}
// Aucun code pour lire depuis Supabase et peupler localStorage
```

#### 4. Risque d'écrasement de données
**Emplacement :** `syncEngine.ts`, `store.ts`

**Problème :**
- Si remote vide, sync pourrait quand même s'effectuer
- Pas de vérification de l'état distant avant sync
- Pas de stratégie de merge intelligente
- Last write wins sans validation

**Impact :**
- Perte de données si error dans sync
- Écrasement accidentel
- Pas de rollback possible

**Preuve :**
```typescript
// syncEngine.ts - pas de vérification
if (operation === 'create' || operation === 'update') {
  const finalPayload = tenantId ? { ...payload, tenantId } : payload;
  const { error } = await supabase.from(tableName).upsert(finalPayload);
  // Pas de check si remote vide ou conflict
}
```

#### 5. Prisma non utilisé
**Emplacement :** `prisma/schema.prisma`

**Problème :**
- Schema Prisma défini mais non utilisé
- Pas de DATABASE_URL
- Client non généré
- Duplique la définition des modèles (Supabase + Prisma)

**Impact :**
- Confusion sur la source de vérité schema
- Maintenance double (SQL + Prisma)
- TypeScript types manuellement maintenus

**Preuve :**
```prisma
// prisma/schema.prisma - défini mais
datasource db {
  provider = "postgresql"
}
// Pas d'URL, pas de client généré
```

#### 6. Absence de backend API
**Emplacement :** Projet entier

**Problème :**
- Pas d'API REST/GraphQL
- Frontend appelle Supabase directement
- Logique métier dans le frontend
- Pas de couche d'abstraction

**Impact :**
- Logique métier exposée dans le client
- Difficile de maintenir la cohérence
- Pas de validation côté serveur centralisée
- Impossible d'avoir des endpoints custom

**Preuve :**
- Aucun dossier `api/` ou `server/`
- Aucun fichier Express/Next.js API
- Appels directs `supabase.from()`

#### 7. Gestion d'état fragmentée
**Emplacement :** Tous les composants

**Problème :**
- Pas de store global (Redux/Zustand)
- Chaque composant lit localStorage directement
- Beaucoup de duplications de logique
- Difficile de tracker les modifications

**Impact :**
- Performance (beaucoup de reads localStorage)
- Difficile à déboguer
- Pas de réactivité automatique
- Code dupliqué

**Preuve :**
```typescript
// Dans chaque composant
const products = getStoreData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
const sales = getStoreData<Sale[]>(STORAGE_KEYS.SALES, []);
// Pas de subscription aux changements
```

#### 8. Security: Secrets en localStorage
**Emplacement :** `authService.ts`, `cryptoVault.ts`

**Problème :**
- Password hash dans localStorage
- Clé de récupération hash dans localStorage
- Installation secret dans localStorage
- Pas de véritable sécurisation

**Impact :**
- Si XSS, secrets exposés
- Pas de véritable sécurité côté client
- Clés récupérables

**Preuve :**
```typescript
// authService.ts
this.users.push(newUser); // avec password hash
this.saveToLocalStorage(); // dans localStorage

// cryptoVault.ts
localStorage.setItem(INSTALL_SECRET_KEY, bytesToBase64(bytes));
```

#### 9. Pas de gestion d'erreurs sync robuste
**Emplacement :** `syncEngine.ts`

**Problème :**
- Erreurs loggées mais pas gérées
- Pas de retry avec backoff
- Pas de notification utilisateur
- Queue peut s'accumuler indéfiniment

**Impact :**
- Utilisateur ne sait pas que sync échoue
- Données non synchronisées silencieusement
- Queue saturation possible

**Preuve :**
```typescript
// syncEngine.ts
} catch (err: any) {
  console.error(`[SyncEngine] Failed to sync item ${item.id}:`, err);
  markSyncAttempt(item.id, err?.message || 'Erreur inconnue');
  // Pas de retry, pas de notification
}
```

#### 10. Duplication de logique métier
**Emplacement :** Composants pages

**Problème :**
- Logique métier dans les composants
- Pas de services centralisés
- Duplication de code (ex: calculs ventes)
- Difficile à tester

**Impact :**
- Maintenance difficile
- Bugs potentiels par duplication
- Tests unitaires impossibles

**Preuve :**
```typescript
// NewSale.tsx - logique métier inline
const total = lines.reduce((acc, line) => acc + line.total, 0);
// Dupliqué dans d'autres composants probablement
```

## 16. Risk Areas

### Zones à risque identifiées

#### 1. Perte de données (CRITICAL)
**Scénario :**
- User travaille sur Machine A
- Données dans localStorage Machine A
- Machine A casse ou localStorage vidé
- Aucune sauvegarde distante si Supabase non configuré
- **Résultat :** Données perdues définitivement

**Probabilité :** Élevée
**Impact :** Critique

#### 2. Impossibilité multi-device (CRITICAL)
**Scénario :**
- User crée compte sur Machine A
- Essaie de se connecter sur Machine B
- Compte non trouvé (localStorage vide sur Machine B)
- **Résultat :** Impossible d'utiliser sur plusieurs appareils

**Probabilité :** Élevée
**Impact :** Critique

#### 3. Conflits sync (HIGH)
**Scénario :**
- User modifie donnée sur Machine A
- Sync vers Supabase
- User modifie même donnée sur Machine B
- Sync vers Supabase
- **Résultat :** Last write wins, pas de merge

**Probabilité :** Moyenne
**Impact :** Élevé

#### 4. Écrasement remote vide (HIGH)
**Scénario :**
- User avec données locales
- Supabase configuré mais base vide
- Sync s'effectue
- **Résultat :** Données locales écrasent vide (OK) ou inverse (mauvais)

**Probabilité :** Faible
**Impact :** Élevé

#### 5. Performance localStorage (MEDIUM)
**Scénario :**
- Beaucoup de données (milliers de ventes)
- localStorage reads fréquents
- **Résultat :** Lenteur application

**Probabilité :** Moyenne
**Impact :** Moyen

#### 6. Sécurité XSS (MEDIUM)
**Scénario :**
- Attaquant injecte script via XSS
- Lit localStorage
- **Résultat :** Données + secrets exposés

**Probabilité :** Faible
**Impact :** Moyen

#### 7. Queue saturation (MEDIUM)
**Scénario :**
- User hors ligne longtemps
- Beaucoup de modifications
- Queue > 500 items
- **Résultat :** Oldest items perdus

**Probabilité :** Faible
**Impact :** Moyen

#### 8. Migration Prisma → Réalité (LOW)
**Scénario :**
- Prisma schema maintenu
- Mais pas utilisé
- **Résultat :** Confusion, dette technique

**Probabilité :** Faible
**Impact :** Faible

## 17. Known Technical Debt

### Dette technique identifiée

#### 1. Prisma inutilisé
- Schema défini mais non implémenté
- Maintenu inutilement
- Devrait être soit supprimé soit activé

#### 2. Duplication modèles
- Types TypeScript
- Schema Prisma
- Schema Supabase SQL
- Triple maintenance

#### 3. Pas de tests
- Aucun test unitaire
- Aucun test d'intégration
- Risque de régressions

#### 4. Logique métier dans UI
- Calculs dans composants
- Pas de services métier
- Difficile à tester

#### 5. Magic strings
- Clés localStorage en dur
- Pas de constantes centralisées
- Risque de typos

#### 6. Gestion d'erreurs inconsistante
- Parfois try/catch
- Parfois silencieux
- Pas de stratégie unifiée

#### 7. Pas de logging structuré
- console.log dispersés
- Pas de service de log
- Difficile à debug en prod

#### 8. TypeScript ANY
- Quelques `any` dans le code
- Perdu les bénéfices du typage
- Risque d'erreurs runtime

## 18. Open Questions

### Questions non résolues

1. **Stratégie sync finale :**
   - Doit-on être offline-first ou online-first?
   - Comment gérer les conflits?
   - Doit-on avoir un pull mechanism?

2. **Prisma ou pas :**
   - Doit-on activer Prisma?
   - Ou le supprimer?
   - Ou l'utiliser uniquement pour les types?

3. **Backend API :**
   - Doit-on créer une API backend?
   - Ou continuer avec Supabase direct?
   - Comment gérer la logique métier?

4. **Gestion d'état :**
   - Doit-on introduire Redux/Zustand?
   - Ou continuer avec localStorage direct?
   - Comment gérer la réactivité?

5. **Sécurité :**
   - Comment sécuriser les secrets localStorage?
   - Doit-on utiliser session storage?
   - Comment gérer XSS?

6. **Multi-device :**
   - Comment résoudre le problème Machine A → Machine B?
   - Doit-on forcer Supabase Auth?
   - Comment migrer les comptes locaux?

7. **Performance :**
   - Comment optimiser les reads localStorage?
   - Doit-on utiliser IndexedDB?
   - Comment gérer les gros datasets?

8. **Testing :**
   - Comment introduire des tests?
   - Quelle stratégie de testing?
   - Comment tester la logique localStorage?

## 19. Critical Findings

### CRITICAL

#### 1. Impossibilité de se connecter depuis un autre appareil
**Problème :** Les comptes créés en mode local sont stockés dans localStorage de l'appareil. Impossible de se connecter depuis une autre machine.

**Emplacement :** `utils/authService.ts` (LocalDatabase class)

**Cause probable :** Architecture conçue pour offline-first sans véritable backend auth local

**Impact :** Perte d'accès aux données si changement d'appareil, contredit l'objectif multi-device

**Preuve :**
```typescript
// authService.ts ligne 149-155
private saveToLocalStorage() {
  try {
    localStorage.setItem('casierdor_users', JSON.stringify(this.users));
  } catch (error) {
    console.error('Erreur sauvegarde utilisateurs:', error);
  }
}
```

#### 2. Perte de données si localStorage vidé sans Supabase
**Problème :** Si localStorage est vidé et Supabase non configuré, toutes les données sont perdues définitivement.

**Emplacement :** `store.ts` (tout le stockage)

**Cause probable :** Architecture offline-first sans backup automatique

**Impact :** Perte totale des données métier (produits, ventes, clients, etc.)

**Preuve :**
```typescript
// store.ts ligne 49-52
export const getStoreData = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(scopeStorageKey(key));
  return data ? JSON.parse(data) : defaultValue;
};
```

### HIGH

#### 3. Sync unidirectionnel seulement (local → remote)
**Problème :** Pas de mécanisme pour récupérer les données depuis Supabase vers localStorage. Si localStorage vidé, impossible de restaurer depuis le cloud.

**Emplacement :** `utils/syncEngine.ts`

**Cause probable :** Sync engine implémenté partiellement

**Impact :** Pas de véritable synchronisation, risque de perte de données

**Preuve :**
```typescript
// syncEngine.ts ligne 71-83
if (operation === 'create' || operation === 'update') {
  const finalPayload = tenantId ? { ...payload, tenantId } : payload;
  const { error } = await supabase.from(tableName).upsert(finalPayload);
  // Aucun code pour lire depuis Supabase
}
```

#### 4. Source de vérité ambiguë (localStorage vs Supabase)
**Problème :** Données existent dans localStorage et potentiellement dans Supabase. Pas de stratégie claire pour déterminer laquelle est la source de vérité.

**Emplacement :** `store.ts`, `syncEngine.ts`

**Cause probable :** Architecture hybride non finalisée

**Impact :** Conflits possibles, incohérences, perte de données

**Preuve :**
```typescript
// store.ts écrit dans localStorage
localStorage.setItem(scopeStorageKey(key), JSON.stringify(value));

// syncEngine.ts écrit dans Supabase
await supabase.from(tableName).upsert(finalPayload);
// Pas de stratégie de résolution de conflits
```

#### 5. Pas de backend API, logique métier exposée dans le client
**Problème :** Toute la logique métier est dans le frontend. Pas de couche d'abstraction backend. Si contournement client possible, logique métier contournable.

**Emplacement :** Tous les composants pages

**Cause probable :** Architecture SPA pure sans backend dédié

**Impact :** Sécurité, maintenabilité, testabilité

**Preuve :**
- Aucun dossier `api/` ou `server/`
- Appels directs `supabase.from()` depuis le frontend
- Calculs métier dans les composants React

### MEDIUM

#### 6. Gestion d'état fragmentée (pas de store global)
**Problème :** Chaque composant lit localStorage directement. Pas de store global type Redux/Zustand. Difficile de tracker les modifications et d'assurer la réactivité.

**Emplacement :** Tous les composants

**Cause probable :** Architecture simple qui n'a pas évolué

**Impact :** Performance, maintenabilité, débogage

**Preuve :**
```typescript
// Dans chaque composant
const products = getStoreData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
const sales = getStoreData<Sale[]>(STORAGE_KEYS.SALES, []);
// Pas de subscription aux changements
```

#### 7. Secrets cryptographiques dans localStorage
**Problème :** Passwords hashés, clés de récupération, secrets d'installation stockés en clair dans localStorage. Vulnérable à XSS.

**Emplacement :** `authService.ts`, `cryptoVault.ts`

**Cause probable :** Architecture offline-first sans véritable sécurité côté client

**Impact :** Sécurité, exposition des secrets

**Preuve :**
```typescript
// cryptoVault.ts ligne 72-75
export function ensureInstallationSecret(): void {
  if (localStorage.getItem(INSTALL_SECRET_KEY)) return;
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(INSTALL_SECRET_KEY, bytesToBase64(bytes));
}
```

#### 8. Pas de gestion d'erreurs sync robuste
**Problème :** Erreurs de sync loggées mais pas gérées. Pas de retry avec backoff, pas de notification utilisateur. Queue peut s'accumuler sans limite effective.

**Emplacement :** `syncEngine.ts`

**Cause probable :** Sync engine implémenté rapidement sans gestion d'erreurs sophistiquée

**Impact :** Données non synchronisées silencieusement, utilisateur non informé

**Preuve :**
```typescript
// syncEngine.ts ligne 88-91
} catch (err: any) {
  console.error(`[SyncEngine] Failed to sync item ${item.id}:`, err);
  markSyncAttempt(item.id, err?.message || 'Erreur inconnue');
  // Pas de retry, pas de notification utilisateur
}
```

### LOW

#### 9. Prisma défini mais non utilisé
**Problème :** Schema Prisma défini et maintenu mais pas utilisé dans l'application. Crée de la confusion et de la dette technique.

**Emplacement :** `prisma/schema.prisma`

**Cause probable :** Préparation pour future utilisation qui n'a jamais eu lieu

**Impact :** Confusion, maintenance inutile, dette technique

**Preuve :**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
}
// Pas de DATABASE_URL configurée
// Client non généré
// Pas utilisé dans le code
```

#### 10. Duplication de logique métier dans les composants
**Problème :** Logique métier (calculs, validations) dupliquée dans plusieurs composants. Pas de services centralisés.

**Emplacement :** Composants pages (NewSale, Dashboard, etc.)

**Cause probable :** Développement rapide sans refactoring

**Impact :** Maintenabilité, tests, risque de bugs par incohérence

**Preuve :**
```typescript
// NewSale.tsx - calculs inline
const total = lines.reduce((acc, line) => acc + line.total, 0);
// Probablement dupliqué ailleurs
```

---

## Conclusion

L'architecture actuelle de Casier d'Or est une **application SPA offline-first** avec une synchronisation optionnelle vers Supabase. Le principal problème critique est l'**impossibilité de se connecter depuis un autre appareil** en mode local, ce qui contredit l'objectif d'une application cloud-native. L'application fonctionne bien pour un usage mono-appareil mais présente des risques importants pour les données et la synchronisation multi-device.

**Recommandations pour la phase 2 :**
1. Résoudre le problème Machine A → Machine B (forcer Supabase Auth ou créer backend auth)
2. Implémenter un véritable mécanisme de sync bidirectionnel
3. Définir clairement la source de vérité (local ou remote)
4. Introduire un store global pour l'état
5. Sécuriser les secrets ou les déplacer du localStorage
6. Décider du sort de Prisma (l'activer ou le supprimer)
7. Créer une architecture backend ou documenter l'absence volontaire
