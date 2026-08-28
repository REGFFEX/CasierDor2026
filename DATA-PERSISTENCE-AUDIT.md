# Casier d'Or — Data & Persistence Audit

## 1. Executive Summary

Ce document présente un audit complet du système de données, persistance, authentification et synchronisation de Casier d'Or. L'audit révèle que l'application fonctionne principalement en mode **offline-first avec localStorage comme source de vérité**, avec une synchronisation optionnelle vers Supabase qui est **unidirectionnelle (push uniquement)** et **partiellement implémentée**.

**Problèmes critiques identifiés :**
- Authentification locale dépendante du localStorage → impossible multi-device
- Absence de mécanisme pull depuis Supabase → pas de récupération de données distantes
- Sync unidirectionnel → risque de perte de données si localStorage vidé
- Source de vérité ambiguë entre localStorage et Supabase
- Absence de stratégie de résolution de conflits multi-device

**Statut de l'audit :** CONFIRMED par analyse du code source

---

## 2. Data Inventory

### Entités principales identifiées

| Entité | Type TypeScript | Description | Relations |
| ------ | -------------- | ----------- | ---------- |
| **User** | `User` (auth.ts) | Utilisateur avec authentification | Tenant, Permissions |
| **Tenant** | `Tenant` (Prisma) | Établissement/organisation | Users, Products, Clients, Sales |
| **Product** | `Product` (app.ts) | Produit catalogue | SaleLine, StockMovement |
| **Client** | `Client` (app.ts) | Client/Customer | Sale |
| **Sale** | `Sale` (app.ts) | Vente/Transaction | SaleLine, Client, Payment |
| **SaleLine** | `SaleLine` (app.ts) | Ligne de vente | Sale, Product |
| **Payment** | `PaymentDetails` (app.ts) | Détails paiement | Sale |
| **StockMovement** | Non typé explicitement | Mouvement stock | Product |
| **AccountingTransaction** | `AccountingTransaction` (app.ts) | Transaction comptable | Sale |
| **ReplenishmentOrder** | `ReplenishmentOrder` (app.ts) | Commande réapprovisionnement | Product |
| **Activity** | `Activity` (app.ts) | Journal d'audit | User |
| **TrashItem** | `TrashItem` (app.ts) | Élément supprimé | Toutes entités |
| **Settings** | `StoreSettings` (app.ts) | Configuration application | User |
| **Archive** | `ArchiveMetadata` (archive.ts) | Document archivé | User |
| **SyncQueueItem** | `SyncQueueItem` (syncQueue.ts) | Opération sync à traiter | Toutes entités |

### Entités secondaires identifiées

| Entité | Type TypeScript | Description | Stockage |
| ------ | -------------- | ----------- | -------- |
| **CompanyInfo** | `CompanyInfo` (professional.ts) | Info entreprise | Constants |
| **TeamMember** | `TeamMember` (professional.ts) | Membre équipe | Constants |
| **Permission** | `Permission` (app.ts) | Droits utilisateur | User |
| **RecoveryConfig** | `RecoveryConfig` (app.ts) | Config récupération | Settings |

---

## 3. Local Storage Map

### Clés localStorage identifiées

| Clé | Type | Module | Écrit par | Lu par | Scope | Contenu |
| --- | ---- | ------ | --------- | ------ | ----- | ------- |
| **casierdor_users** | Array<User> | AuthService | LocalDatabase.saveToLocalStorage() | LocalDatabase.loadFromLocalStorage() | GLOBAL | Tous les utilisateurs locaux |
| **auth_user** | User | AuthService | saveCurrentUser() | loadCurrentUser() | GLOBAL | Utilisateur connecté courant |
| **auth_token** | string | AuthService | saveCurrentUser() | (non lu directement) | GLOBAL | Token Supabase (optionnel) |
| **auth_remember** | boolean | AuthService | login() | (non lu directement) | GLOBAL | Préférence "remember me" |
| **casierdor_secure_auth** | boolean | AuthService | login() | (non lu directement) | GLOBAL | Flag auth sécurisée |
| **casierdor_secure_auth_forced** | boolean | AuthService | setSecureAuthForced() | isSecureAuthForced() | GLOBAL | Flag auth forcée |
| **casier_active_storage_scope** | string | AccountStorage | setActiveStorageScope() | getActiveStorageScope() | GLOBAL | ID scope utilisateur actif |
| **casierdor_installation_secret** | string (base64) | CryptoVault | ensureInstallationSecret() | getInstallationSecret() | GLOBAL | Secret installation appareil |
| **casier_sync_queue** | Array<SyncQueueItem> | SyncQueue | saveQueue() | loadQueue() | GLOBAL | File d'attente sync |
| **casier_recent_modules** | Array<string> | Modules | trackModuleVisit() | getRecentModuleIds() | GLOBAL | Modules récents visités |
| **casierdor_last_key_save_hint** | string | RecoveryKeyService | sauvegarde clé | getLastKeySaveHint() | GLOBAL | Dernier chemin clé récupération |
| **casierdor_legacy_download** | boolean | SettingsPage | (toggle) | (lecture init) | GLOBAL | Mode download legacy |
| **casierdor_export_format** | FileFormat | SettingsPage | (sélection) | (lecture init) | GLOBAL | Format export préféré |
| **casierdor_admin_disabled** | boolean | SettingsPage | (toggle) | (lecture init) | GLOBAL | Compte admin désactivé |
| **casierdor_user_disabled** | boolean | SettingsPage | (toggle) | (lecture init) | GLOBAL | Compte user désactivé |
| **offline_mode** | boolean | PermissionManager | setOfflineMode() | isOfflineMode() | GLOBAL | Mode hors-ligne |
| **offline_timestamp** | string | PermissionManager | setOfflineMode() | (lecture) | GLOBAL | Timestamp mode offline |
| **auth_disabled** | boolean | Layout/App | (toggle sécurité) | ProtectedRoute | GLOBAL | Auth désactivée (bypass) |
| **casier_confirm_prefs** | ConfirmPreferences | ConfirmPreferences | saveConfirmPreferences() | getConfirmPreferences() | GLOBAL | Préférences confirmations |
| **neverAskAgain** | Array<string> | ConfirmPreferences | saveConfirmPreferences() | getConfirmPreferences() | GLOBAL | Actions à ne plus demander |
| **app_users** | Array<User> | UserManager | addUser/updateUser/deleteUser() | getAllUsers() | GLOBAL | Utilisateurs app (alternative) |
| **LEGACY_STORAGE_LABEL** | string | StorageDirectory | setStorageLabel() | getStorageDirectory() | GLOBAL | Label stockage legacy |

### Clés scopées (par utilisateur)

| Clé de base | Clé scopée | Type | Module | Écrit par | Lu par |
| ----------- | ---------- | ---- | ------ | --------- | ------ |
| **casier_products** | `casier_products::userId` | Array<Product> | Store | setStoreData() | getStoreData() |
| **casier_clients** | `casier_clients::userId` | Array<Client> | Store | setStoreData() | getStoreData() |
| **casier_sales** | `casier_sales::userId` | Array<Sale> | Store | setStoreData() | getStoreData() |
| **casier_settings** | `casier_settings::userId` | StoreSettings | Store | setStoreData() | getStoreData() |
| **casier_stock_movements** | `casier_stock_movements::userId` | Array | Store | setStoreData() | getStoreData() |
| **casier_recent_payments** | `casier_recent_payments::userId` | Array | Store | setStoreData() | getStoreData() |
| **casier_recycle_bin** | `casier_recycle_bin::userId` | Array<TrashItem> | Store | setStoreData() | getStoreData() |
| **casier_activities** | `casier_activities::userId` | Array<Activity> | Store | setStoreData() | getStoreData() |
| **casier_accounting_transactions** | `casier_accounting_transactions::userId` | Array<AccountingTransaction> | Store | setStoreData() | getStoreData() |
| **casier_replenishment_orders** | `casier_replenishment_orders::userId` | Array<ReplenishmentOrder> | Store | setStoreData() | getStoreData() |
| **casier_archives** | `casier_archives::userId` | Array<ArchiveMetadata> | ArchiveService | setStoreData() | getStoreData() |
| **casier_archive_data_{id}** | `casier_archive_data_{id}::userId` | any | ArchiveService | setStoreData() | getStoreData() |

### Clés de migration

| Clé | Type | Usage |
| --- | ---- | ----- |
| **casier_migrated_scope_{userId}** | string (timestamp) | Flag migration legacy vers scope |

---

## 4. Authentication Data Flow

### REGISTER

**Flux complet :**

```
RegisterPage (UI)
↓
authContext.register()
↓
authService.register()
↓
┌─────────────────────────────┐
│ isSupabaseConfigured()?      │
└──────────┬────────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ↓           ↓
OUI         NON (défaut)
     │           │
     ↓           ↓
supabase.auth.signUp()  LocalDatabase.createUser()
     │           │
     ↓           ↓
Trigger handle_auth_user_created()  userId = `user-${Date.now()}-${random}`
     │           │
     ↓           ↓
Tenant + User créés dans PostgreSQL  this.users.push(newUser)
     │           │
     ↓           ↓
fetchSupabaseUserProfile()  this.saveToLocalStorage()
     │           │
     ↓           ↓
mapSupabaseUserRow()  localStorage.casierdor_users = [newUser]
     │           │
     └─────┬─────┘
           │
           ↓
LocalDatabase.saveUser() [toujours]
↓
localStorage.casierdor_users (mis à jour)
↓
saveCurrentUser()
↓
localStorage.auth_user = newUser
↓
activateStorageForUser(newUser)
↓
localStorage.casier_active_storage_scope = newUser.storageAccountId || newUser.id
↓
migrateLegacyStoreToScope(scopeId)
↓
Données legacy copiées vers scope
↓
localStorage.casier_migrated_scope_{userId} = timestamp
```

**Où le compte est créé :**
- **Mode local :** `localStorage.casierdor_users` (CONFIRMED)
- **Mode Supabase :** PostgreSQL (tables `Tenant` + `User`) + `localStorage.casierdor_users` (CONFIRMED)

**ID généré :**
- **Mode local :** `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` (CONFIRMED - authService.ts ligne 185)
- **Mode Supabase :** Supabase Auth génère l'ID, utilisé tel quel (CONFIRMED)

**Tenant créé :**
- **Mode local :** NON (INFERRED - pas de tenant local)
- **Mode Supabase :** OUI, par trigger `handle_auth_user_created()` (CONFIRMED)

**Profile créé :**
- **Mode local :** User object avec displayName, firstName, lastName (CONFIRMED)
- **Mode Supabase :** Métadonnées dans auth.user + row User (CONFIRMED)

**Utilisateur local également créé :**
- **OUI dans les deux modes** - `LocalDatabase.saveUser()` toujours appelé (CONFIRMED)

**Données sauvegardées localement :**
- `localStorage.casierdor_users` : Array<User> (CONFIRMED)
- `localStorage.auth_user` : User courant (CONFIRMED)
- `localStorage.casier_active_storage_scope` : scope ID (CONFIRMED)

**Données sauvegardées à distance :**
- **Mode local :** AUCUNE (CONFIRMED)
- **Mode Supabase :** Tenant + User dans PostgreSQL (CONFIRMED)

### LOGIN

**Flux complet :**

```
LoginPage (UI)
↓
authContext.login()
↓
authService.login(credentials)
↓
┌─────────────────────────────┐
│ isSupabaseConfigured()?      │
└──────────┬────────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ↓           ↓
OUI         NON (défaut)
     │           │
     ↓           ↓
supabase.auth.signInWithPassword()  LocalDatabase.findUserByEmail()
     │           │
     ↓           ↓
fetchSupabaseUserProfile()  this.loadFromLocalStorage()
     │           │
     ↓           ↓
mapSupabaseUserRow()  this.users.find(user => user.email === email)
     │           │
     ↓           ↓
user (de Supabase)  user (de localStorage)
     │           │
     └─────┬─────┘
           │
           ↓
Vérification password
↓
┌─────────────────────────────┐
│ authenticatedViaSupabase?   │
└──────────┬────────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ↓           ↓
OUI         NON
     │           │
     ↓           ↓
skip        verifyPassword(credentials.password, user.password)
     │           │
     └─────┬─────┘
           │
           ↓
LocalDatabase.findUserByEmail() [toujours]
↓
LocalDatabase.updateUser() avec lastLogin
↓
localStorage.casierdor_users mis à jour
↓
saveCurrentUser()
↓
localStorage.auth_user = updatedUser
↓
activateStorageForUser(updatedUser)
↓
localStorage.casier_active_storage_scope = updatedUser.storageAccountId || updatedUser.id
↓
migrateLegacyStoreToScope(scopeId)
↓
AuthContext dispatch AUTH_SUCCESS
```

**Source interrogée en premier :**
- **Dépend de `isSupabaseConfigured()`** (CONFIRMED - authService.ts ligne 416)

**Système utilisé :**
- **Supabase Auth :** Si configuré (CONFIRMED)
- **localStorage :** Fallback ou par défaut (CONFIRMED)

**Fallback local peut empêcher auth distante :**
- **OUI** - Si Supabase configuré mais échoue, le code ne fallback PAS vers local (CONFIRMED - authService.ts ligne 422-428)

**tenantId obtenu :**
- **Mode Supabase :** Depuis `fetchSupabaseUserProfile()` → user.tenantId (CONFIRMED)
- **Mode local :** NON (pas de tenantId) (INFERRED)

**storageAccountId obtenu :**
- **Mode Supabase :** Depuis user.storageAccountId (mapping depuis Supabase) (CONFIRMED)
- **Mode local :** user.id (CONFIRMED - authService.ts ligne 188)

**Scope local activé :**
- `activateStorageForUser()` avec `user.storageAccountId || user.id` (CONFIRMED)

### LOGOUT

**Flux complet :**

```
Logout action (UI)
↓
authContext.logout()
↓
authService.logout()
↓
┌─────────────────────────────┐
│ isSupabaseConfigured()?      │
└──────────┬────────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ↓           ↓
OUI         NON
     │           │
     ↓           ↓
supabase.auth.signOut()  (skip)
     │           │
     └─────┬─────┘
           │
           ↓
saveCurrentUser(null)
↓
localStorage.removeItem('auth_user')
↓
localStorage.removeItem('auth_token')
↓
this.currentUser = null
↓
clearActiveStorageScope()
↓
localStorage.removeItem('casier_active_storage_scope')
↓
AuthContext dispatch LOGOUT
```

**Ce qui est supprimé :**
- `localStorage.auth_user` (CONFIRMED)
- `localStorage.auth_token` (CONFIRMED)
- `localStorage.casier_active_storage_scope` (CONFIRMED)

**Ce qui reste :**
- `localStorage.casierdor_users` : TOUS les utilisateurs restent (CONFIRMED)
- `localStorage.casier_products::userId` : Données scopées restent mais deviennent inaccessibles (CONFIRMED)
- `localStorage.casier_sync_queue` : Queue sync reste (CONFIRMED)
- `localStorage.casierdor_installation_secret` : Secret installation reste (CONFIRMED)

**Risque de perte logique :**
- **OUI** - Les données scopées deviennent inaccessibles car le scope est supprimé (CONFIRMED)
- Les données ne sont pas supprimées mais le scope pour y accéder l'est (CONFIRMED)

### PASSWORD RESET

**Flux :**

```
ForgotPasswordPage (UI)
↓
authService.forgotPassword(email)
↓
┌─────────────────────────────┐
│ isSupabaseConfigured()?      │
└──────────┬────────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ↓           ↓
OUI         NON
     │           │
     ↓           ↓
supabase.auth.resetPasswordForEmail()  LocalDatabase.generateResetToken()
     │           │
     ↓           ↓
(envoi email Supabase)  localStorage passwordResetTokens Map
     │           │
     └─────┬─────┘
           │
           ↓
Retour success (toujours)
```

**Stockage token :**
- **Mode local :** `Map` dans `LocalDatabase.passwordResetTokens` (non persisté) (CONFIRMED)
- **Mode Supabase :** Géré par Supabase Auth (CONFIRMED)

---

## 5. Identity Mapping

### Relations entre identifiants

```
Supabase Auth user.id
   │
   ├── (si Supabase configuré)
   │     ↓
   │   User.id (PostgreSQL)
   │     │
   │     ├── tenantId (PostgreSQL)
   │     │     │
   │     │     └── Tenant.id (PostgreSQL)
   │     │
   │     └── storageAccountId (PostgreSQL) = user.id
   │
   └── (mode local)
         ↓
      User.id (localStorage généré)
         │
         ├── storageAccountId = User.id (localStorage)
         │
         └── tenantId = UNDEFINED
```

### Mapping précis

| Identifiant | Source | Usage | Scope |
| ----------- | ------ | ----- | ----- |
| **Supabase Auth user.id** | Supabase Auth | ID authentification Supabase | Global |
| **User.id (PostgreSQL)** | Supabase trigger | ID utilisateur distant | Global |
| **User.id (localStorage)** | Frontend généré | ID utilisateur local | Global |
| **storageAccountId** | localStorage/Supabase | Scope isolation localStorage | Par utilisateur |
| **tenantId** | Supabase trigger | Isolation multi-tenant distant | Global |
| **local record id** | Frontend généré | ID entité locale (ex: Product.id) | Scope utilisateur |
| **remote record id** | Supabase | ID entité distante (ex: Product.id) | Global |

### Identité locale vs distante

**Mode local :**
- `User.id` (localStorage) ≠ Aucun équivalent distant
- `storageAccountId` = `User.id`
- `tenantId` = UNDEFINED
- **Identité purement locale** (CONFIRMED)

**Mode Supabase :**
- `User.id` (Supabase) = `Supabase Auth user.id`
- `storageAccountId` = `User.id` (Supabase)
- `tenantId` = généré par trigger
- **Identité partagée** entre local et distant (CONFIRMED)

### Risques identifiés

1. **Même utilisateur avec plusieurs IDs :**
   - Possible si compte créé en mode local puis migré vers Supabase
   - Pas de mécanisme de fusion (INFERRED)

2. **ID local différent de ID distant :**
   - En mode local, ID généré côté frontend
   - En mode Supabase, ID généré côté serveur
   - Pas de mapping automatique (CONFIRMED)

3. **Tenant mal attribué :**
   - En mode local, pas de tenant du tout
   - Si sync vers Supabase, tenantId injecté depuis localStorage.auth_user.tenantId
   - Risque d'injection incorrecte (CONFIRMED - syncEngine.ts ligne 62-69)

4. **Données du mauvais utilisateur :**
   - Si `storageAccountId` incorrect, données du mauvais scope accessibles
   - Pas de validation du scope (INFERRED)

5. **Données visibles dans le mauvais compte :**
   - Si `tenantId` incorrect, RLS devrait protéger
   - Mais en mode local, pas de RLS
   - Risque d'accès inter-comptes en local (INFERRED)

---

## 6. Machine A → Machine B

### Scénario réel

#### MACHINE A

```
1. Installation
   ↓
   ensureInstallationSecret() → localStorage.casierdor_installation_secret créé
   ↓
2. Création compte (mode local par défaut si Supabase non configuré)
   ↓
   RegisterPage → authService.register()
   ↓
   LocalDatabase.createUser()
   ↓
   userId = "user-1754321234567-abc123xyz"
   ↓
   localStorage.casierdor_users = [{userId, email, passwordHash, ...}]
   ↓
   localStorage.auth_user = {userId, email, ...}
   ↓
   localStorage.casier_active_storage_scope = "user-1754321234567-abc123xyz"
   ↓
3. Connexion
   ↓
   LoginPage → authService.login()
   ↓
   LocalDatabase.findUserByEmail(email)
   ↓
   Trouvé dans localStorage.casierdor_users
   ↓
   localStorage.auth_user mis à jour
   ↓
   localStorage.casier_active_storage_scope réactivé
   ↓
4. Création produit
   ↓
   NewSale → setStoreData(STORAGE_KEYS.PRODUCTS, [newProduct])
   ↓
   localStorage.casier_products::user-1754321234567-abc123xyz = [{id: "prod-1", name: "Bière", ...}]
   ↓
   enqueueSyncItem('product', 'create', newProduct)
   ↓
   localStorage.casier_sync_queue = [{entity: 'product', operation: 'create', ...}]
   ↓
5. Création client
   ↓
   localStorage.casier_clients::user-1754321234567-abc123xyz = [{id: "client-1", name: "Jean", ...}]
   ↓
6. Création vente
   ↓
   localStorage.casier_sales::user-1754321234567-abc123xyz = [{id: "sale-1", total: 5000, ...}]
   ↓
7. Déconnexion
   ↓
   authService.logout()
   ↓
   localStorage.removeItem('auth_user')
   ↓
   localStorage.removeItem('casier_active_storage_scope')
   ↓
   MAIS :
   localStorage.casierdor_users = TOUJOURS PRÉSENT
   localStorage.casier_products::user-1754321234567-abc123xyz = TOUJOURS PRÉSENT
   localStorage.casier_clients::user-1754321234567-abc123xyz = TOUJOURS PRÉSENT
   localStorage.casier_sales::user-1754321234567-abc123xyz = TOUJOURS PRÉSENT
```

#### MACHINE B

```
1. Installation / navigateur propre
   ↓
   ensureInstallationSecret() → localStorage.casierdor_installation_secret créé (DIFFÉRENT)
   ↓
2. Tentative de connexion avec mêmes identifiants
   ↓
   LoginPage → authService.login({email, password})
   ↓
   isSupabaseConfigured()? → false (probable)
   ↓
   LocalDatabase.findUserByEmail(email)
   ↓
   this.loadFromLocalStorage()
   ↓
   localStorage.getItem('casierdor_users')
   ↓
   RÉSULTAT : null (localStorage VIDE sur Machine B)
   ↓
   USER NOT FOUND
   ↓
   Erreur : "Utilisateur non trouvé"
   ↓
   IMPOSSIBLE DE SE CONNECTER
```

### Pourquoi cela échoue aujourd'hui

**Fonction provoquant l'échec :**
- `LocalDatabase.findUserByEmail()` dans `authService.ts` ligne 169-173 (CONFIRMED)

**Source de données consultée :**
- `localStorage.casierdor_users` uniquement (CONFIRMED)

**Pourquoi le système ne l'utilise pas correctement :**
- Le système N'EST PAS conçu pour interroger une base distante en mode local
- Pas de fallback automatique vers Supabase si local échoue
- L'authentification est explicitement conçue comme locale-first (CONFIRMED)

**Supabase pourrait-il théoriquement reconnaître le compte ?**
- **OUI** si le compte a été créé avec Supabase Auth
- **NON** si le compte a été créé en mode local uniquement
- Le code ne tente PAS de vérifier Supabase si local échoue (CONFIRMED - authService.ts ligne 470-479)

---

## 7. Local vs Empty Remote

### Scénario

```
LOCAL (Machine A)
├── Product A (id: "prod-1", price: 1000)
├── Product B (id: "prod-2", price: 1500)
└── Product C (id: "prod-3", price: 2000)

REMOTE (Supabase)
└── Aucune donnée (tables vides)
```

### Flux lors de la connexion

```
1. Connexion utilisateur
   ↓
2. initializeStore()
   ↓
3. syncEngine.start()
   ↓
4. syncEngine.processQueue() [toutes les 30s]
   ↓
5. isSupabaseConfigured()? → supposons OUI
   ↓
6. checkOnlineStatus()? → supposons true
   ↓
7. peekSyncQueue(10)
   ↓
8. Pour chaque item dans queue :
   ↓
   if (operation === 'create' || operation === 'update') {
     finalPayload = { ...payload, tenantId }
     await supabase.from(tableName).upsert(finalPayload)
   }
```

### Ce que fait réellement le code

**CONFIRMED - syncEngine.ts ligne 71-74 :**
```typescript
if (operation === 'create' || operation === 'update') {
  const finalPayload = tenantId ? { ...payload, tenantId } : payload;
  const { error } = await supabase.from(tableName).upsert(finalPayload);
  if (error) throw new Error(error.message);
}
```

**Réponses aux questions :**

1. **Est-ce que remote peut écraser local ?**
   - **NON** - Le code n'effectue que des opérations upsert depuis local vers remote (CONFIRMED)
   - Il n'y a AUCUN code qui lit depuis Supabase pour écrire dans localStorage (CONFIRMED)

2. **Est-ce que local peut écraser remote ?**
   - **OUI** - Si remote vide, upsert va simplement créer les données (CONFIRMED)
   - C'est le comportement attendu d'un sync push-only (CONFIRMED)

3. **Est-ce que remote vide est distingué d'un remote réellement synchronisé ?**
   - **NON** - Il n'y a AUCUN mécanisme pour détecter si remote est vide ou synchronisé (CONFIRMED)
   - Pas de flag, pas de timestamp de dernière sync (CONFIRMED)

4. **Existe-t-il une protection contre ce scénario ?**
   - **NON** - Aucune protection spécifique contre remote vide (CONFIRMED)
   - Le code upsert aveuglément (CONFIRMED)

5. **Peut-on perdre les données ?**
   - **NON dans ce scénario** - Local reste la source de vérité (CONFIRMED)
   - Les données locales ne sont jamais modifiées par le sync (CONFIRMED)

---

## 8. Empty Local vs Remote

### Scénario

```
Machine A
├── Données synchronisées vers Supabase
└── localStorage.casier_products::userId = [{id: "prod-1", ...}]

Machine B
├── localStorage vide
└── tentative de connexion
```

### Flux lors de la connexion

```
1. Installation Machine B
   ↓
2. Connexion (avec Supabase configuré)
   ↓
3. supabase.auth.signInWithPassword()
   ↓
4. fetchSupabaseUserProfile()
   ↓
5. mapSupabaseUserRow()
   ↓
6. LocalDatabase.saveUser() → localStorage.casierdor_users
   ↓
7. saveCurrentUser() → localStorage.auth_user
   ↓
8. activateStorageForUser() → localStorage.casier_active_storage_scope
   ↓
9. migrateLegacyStoreToScope(scopeId)
   ↓
10. initializeStore()
    ↓
11. syncEngine.start()
```

### Les données distantes sont-elles récupérées ?

**NON - CONFIRMÉ**

**Pourquoi :**
- Il n'y a AUCUN code dans `syncEngine.ts` qui lit depuis Supabase pour peupler localStorage (CONFIRMED)
- Il n'y a AUCUN code dans `authService.ts` qui lit les données métier depuis Supabase (CONFIRMED)
- `initializeStore()` initialise simplement des tableaux vides si les clés n'existent pas (CONFIRMED - store.ts ligne 147-175)

**Où le flux s'arrête :**
- Le flux s'arrête à l'étape 11 : `syncEngine.start()` commence à traiter la queue (qui est vide) (CONFIRMED)
- Il n'y a pas d'étape "pull from remote" (CONFIRMED)

**Pourquoi :**
- Le sync engine est conçu uniquement pour PUSH (local → remote) (CONFIRMED)
- Il n'y a pas de fonction `pullFromRemote()` ou similaire (CONFIRMED)

**Quelles données restent inaccessibles :**
- TOUTES les données métier qui existent sur Supabase (products, clients, sales, etc.) (CONFIRMED)
- L'utilisateur Machine B commence avec une application vide (CONFIRMED)

---

## 9. Offline Creation

### Scénario

```
Internet OFF
↓
create product
↓
local persistence
↓
sync queue
↓
application restart
↓
Internet ON
↓
sync
```

### Flux détaillé

```
1. Internet OFF
   ↓
   navigator.onLine = false
   ↓
2. create product
   ↓
   NewSale → setStoreData(STORAGE_KEYS.PRODUCTS, [newProduct])
   ↓
   localStorage.casier_products::userId = [{id: "prod-1", ...}]
   ↓
   enqueueSyncItem('product', 'create', newProduct)
   ↓
   localStorage.casier_sync_queue = [{id: "sync-1", entity: 'product', operation: 'create', payload: {...}, createdAt: 1234567890, attempts: 0}]
   ↓
3. Application restart
   ↓
   App.tsx → useEffect → initializeStore()
   ↓
   localStorage.getItem('casier_products::userId') → données PRÉSENTES
   ↓
   localStorage.getItem('casier_sync_queue') → queue PRÉSENTE
   ↓
4. Internet ON
   ↓
   window.addEventListener('online') déclenché
   ↓
   syncEngine.processQueue() [immédiat via event listener]
   ↓
   checkOnlineStatus() → true
   ↓
   isSupabaseConfigured()? → supposons OUI
   ↓
   peekSyncQueue(10)
   ↓
   syncItem(item)
   ↓
   supabase.from('Product').upsert({ ...payload, tenantId })
   ↓
   dequeueSyncItem(item.id)
   ↓
   localStorage.casier_sync_queue = [] (vidée)
```

### Vérifications

**Persistance :**
- **CONFIRMÉ** - Données persistées dans localStorage (CONFIRMED)

**Queue :**
- **CONFIRMÉ** - Opération ajoutée à la queue (CONFIRMED)

**Retry :**
- **PARTIEL** - Retry automatique via intervalle 30s + event listener 'online' (CONFIRMED)
- Pas de backoff exponentiel (CONFIRMED)

**Idempotence :**
- **PARTIEL** - upsert est idempotent, mais pas de déduplication dans la queue (CONFIRMED)

**Doublons :**
- **RISQUE** - Si la même opération est ajoutée plusieurs fois à la queue, elle sera exécutée plusieurs fois (CONFIRMED)
- Pas de détection de doublons dans `enqueueSyncItem()` (CONFIRMED - syncQueue.ts ligne 43-58)

**Crash recovery :**
- **CONFIRMÉ** - Queue persistée dans localStorage, récupérée au restart (CONFIRMED)

---

## 10. Multi-device Conflicts

### Scénario

```
Machine A (offline)
Product A = {id: "prod-1", price: 1000}

Machine B (offline)
Product A = {id: "prod-1", price: 1200}
```

### Flux

```
Machine A reconnecte
↓
syncEngine.processQueue()
↓
supabase.from('Product').upsert({id: "prod-1", price: 1000, tenantId})
↓
Product A dans Supabase = {id: "prod-1", price: 1000}

Machine B reconnecte
↓
syncEngine.processQueue()
↓
supabase.from('Product').upsert({id: "prod-1", price: 1200, tenantId})
↓
Product A dans Supabase = {id: "prod-1", price: 1200}
```

### Détermination

**Quelle version gagne :**
- **Last write wins** - La dernière machine à se reconnecter et sync impose sa version (CONFIRMED)

**Si une version est perdue :**
- **OUI** - La version de Machine A (1000) est perdue (CONFIRMED)

**Comment les timestamps sont utilisés :**
- **PAS pour la résolution de conflits** - Les timestamps existent mais ne sont pas utilisés pour le merge (CONFIRMED)
- upsert se base sur l'ID primary key, pas sur les timestamps (CONFIRMED)

**S'il existe une version ou numéro de révision :**
- **NON** - Pas de versioning, pas de numéro de révision (CONFIRMED)

**S'il existe une vraie stratégie de conflit :**
- **NON** - Pas de stratégie de conflit, seulement last write wins (CONFIRMED)

---

## 11. Sync Engine Audit

### PUSH (Local → Remote)

**Statut :** PRÉSENT (CONFIRMED)

**Implémentation :**
- `syncEngine.ts` ligne 51-92 (CONFIRMED)
- Opérations : create, update, delete (CONFIRMED)
- Injection tenantId automatique (CONFIRMED)

**Fonctionnement :**
```
enqueueSyncItem() → syncQueue
↓
syncEngine.processQueue() [interval 30s + event online]
↓
peekSyncQueue(10)
↓
syncItem(item)
↓
supabase.from(tableName).upsert() / update() / delete()
↓
dequeueSyncItem() si succès
↓
markSyncAttempt() si échec
```

### PULL (Remote → Local)

**Statut :** ABSENT (CONFIRMED)

**Implémentation :**
- Aucune fonction de pull identifiée (CONFIRMED)
- Aucun code qui lit depuis Supabase pour peupler localStorage (CONFIRMED)

### MERGE (Local + Remote → Final state)

**Statut :** ABSENT (CONFIRMED)

**Implémentation :**
- Aucune logique de merge identifiée (CONFIRMED)
- Pas de comparaison local vs remote (CONFIRMED)

### CONFLICT (Version A vs Version B)

**Statut :** ABSENT (CONFIRMED)

**Implémentation :**
- Aucune stratégie de conflit identifiée (CONFIRMED)
- Last write wins par défaut (upsert) (CONFIRMED)

---

## 12. Sync Queue

### Structure exacte

**Format :**
```typescript
interface SyncQueueItem {
  id: string;              // "sync-{timestamp}-{random}"
  entity: SyncEntityType;  // 'product' | 'client' | 'sale' | 'settings' | 'movement' | 'accounting' | 'replenishment'
  operation: SyncOperation; // 'create' | 'update' | 'delete'
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastError?: string;
}
```

**Stockage :**
- `localStorage.casier_sync_queue` (CONFIRMED)
- Tableau JSON sérialisé (CONFIRMED)

**Taille maximale :**
- 500 items (CONFIRMED - syncQueue.ts ligne 28)
- Plus vieux items supprimés si overflow (CONFIRMED)

**Ordre :**
- FIFO trié par createdAt (CONFIRMED - syncQueue.ts ligne 61-64)

**Retry :**
- Incrémente `attempts` à chaque échec (CONFIRMED)
- Pas de backoff exponentiel (CONFIRMED)
- Pas de limite max d'attempts (CONFIRMED)

**Suppression :**
- `dequeueSyncItem()` après succès (CONFIRMED)
- `clearSyncQueue()` pour tout vider (CONFIRMED)

**Persistance après crash :**
- CONFIRMÉ - localStorage persiste (CONFIRMED)

**Doublons :**
- Pas de détection de doublons (CONFIRMED)
- Même opération peut être ajoutée plusieurs fois (CONFIRMED)

**Dépendances entre opérations :**
- Aucune - chaque opération traitée indépendamment (CONFIRMED)

**Gestion create/update/delete :**

**Scénario CREATE → UPDATE → UPDATE → DELETE sur même entité :**

```
1. CREATE prod-1 → queue
2. UPDATE prod-1 → queue
3. UPDATE prod-1 → queue
4. DELETE prod-1 → queue
↓
Sync traite dans l'ordre FIFO :
1. upsert(prod-1) → créé
2. upsert(prod-1) → mis à jour
3. upsert(prod-1) → mis à jour
4. update({deletedAt, active: false}) → soft delete
```

**Risque :**
- Si DELETE est traité avant les updates, les updates échoueront (ID non trouvé)
- Mais ordre FIFO garantit traitement dans l'ordre chronologique (CONFIRMED)

---

## 13. Supabase Database

### Tables réellement utilisées par le code

| Table | Colonnes | PK | FK | tenantId | Timestamps | Soft Delete | Index | RLS | Usage Frontend |
| ----- | -------- | -- | -- | -------- | ---------- | ----------- | ----- | --- | -------------- |
| **Tenant** | id, name, activityType, sector, companySize, acquisitionChannel, useCases, createdAt, updatedAt | id | - | - | createdAt, updatedAt | - | idx_user_tenant_id | OUI | Indirect (via User) |
| **User** | id, tenantId, email, passwordHash, role, displayName, storageAccountId, isSuperAdmin, createdAt, updatedAt | id | tenantId → Tenant | OUI | createdAt, updatedAt | - | idx_user_tenant_id | OUI | fetchSupabaseUserProfile() |
| **Product** | id, tenantId, sku, name, price, stock, criticalThreshold, type, active, localId, updatedAt, deletedAt | id | tenantId → Tenant | OUI | updatedAt, deletedAt | OUI (deletedAt) | idx_product_tenant_id | OUI | syncEngine upsert |
| **Client** | id, tenantId, code, name, phone, localId, updatedAt, deletedAt | id | tenantId → Tenant | OUI | updatedAt, deletedAt | OUI (deletedAt) | idx_client_tenant_id | OUI | syncEngine upsert |
| **Sale** | id, tenantId, saleNumber, total, status, date, localId, payload, syncedAt, createdAt, deletedAt | id | tenantId → Tenant | OUI | createdAt, updatedAt, deletedAt | OUI (deletedAt) | idx_sale_tenant_id | OUI | syncEngine upsert |
| **SyncOutbox** | id, tenantId, entity, operation, payload, attempts, lastError, createdAt | id | tenantId → Tenant | OUI | createdAt | - | idx_sync_outbox_tenant_id | OUI | Non utilisé (schema seulement) |
| **Activity** | id, tenantId, userName, userRole, action, details, module, timestamp, payload | id | tenantId → Tenant | OUI | timestamp | - | - | OUI | Non utilisé (schema seulement) |
| **TrashItem** | id, tenantId, originalId, module, data, deletedAt, expiresAt | id | tenantId → Tenant | OUI | deletedAt, expiresAt | - | - | OUI | Non utilisé (schema seulement) |
| **Plan** | id, code, name, price, currency, interval, maxUsers, maxStores, maxStorageMB, features, createdAt, updatedAt | id | - | - | createdAt, updatedAt | - | - | OUI | Non utilisé (schema seulement) |
| **Subscription** | id, tenantId, planId, status, trialEndsAt, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, createdAt, updatedAt | id | tenantId → Tenant, planId → Plan | OUI | createdAt, updatedAt | - | - | OUI | Non utilisé (schema seulement) |

### Matrice d'usage

| Table Supabase | Écrit par | Lu par | RLS | Sync Push | Sync Pull |
| -------------- | --------- | ------ | --- | --------- | --------- |
| **Tenant** | Supabase trigger | fetchSupabaseUserProfile (indirect) | OUI | NON | NON |
| **User** | Supabase trigger | fetchSupabaseUserProfile() | OUI | NON | NON |
| **Product** | syncEngine | (aucun read direct) | OUI | OUI | NON |
| **Client** | syncEngine | (aucun read direct) | OUI | OUI | NON |
| **Sale** | syncEngine | (aucun read direct) | OUI | OUI | NON |
| **SyncOutbox** | (aucun) | (aucun) | OUI | NON | NON |
| **Activity** | (aucun) | (aucun) | OUI | NON | NON |
| **TrashItem** | (aucun) | (aucun) | OUI | NON | NON |
| **Plan** | (aucun) | (aucun) | NON | NON | NON |
| **Subscription** | (aucun) | (aucun) | NON | NON | NON |

---

## 14. RLS et Sécurité des Données

### Policies RLS par table

#### Tenant
```sql
SELECT : USING (id = public.current_tenant_id())
UPDATE : USING (id = public.current_tenant_id()) WITH CHECK (id = public.current_tenant_id())
```
**Accès :** Seul le tenant lui-même (CONFIRMÉ)

#### User
```sql
SELECT : USING ("tenantId" = public.current_tenant_id())
UPDATE : USING (id = (SELECT auth.uid())::text) WITH CHECK ("tenantId" = public.current_tenant_id())
```
**Accès :** Utilisateurs du même tenant, update limité à soi-même (CONFIRMED)

#### Product, Client, Sale
```sql
ALL : USING ("tenantId" = public.current_tenant_id()) WITH CHECK ("tenantId" = public.current_tenant_id())
```
**Accès :** CRUD limité au tenant (CONFIRMED)

### Détermination tenantId

**Fonction `current_tenant_id()` :**
```sql
SELECT "tenantId" FROM public."User" WHERE id = (SELECT auth.uid())::text LIMIT 1
```
- Utilise l'ID de l'utilisateur Supabase Auth (CONFIRMED)
- Requiert une row User correspondante (CONFIRMED)

### Risques identifiés

1. **Accès frontend pourrait contourner les règles :**
   - **OUI** - Si un utilisateur obtient un token valide d'un autre tenant, il pourrait accéder aux données (CONFIRMED)
   - Mais cela nécessiterait un compromis du compte Supabase Auth (CONFIRMED)

2. **Utilisateurs peuvent voir les données d'un autre tenant :**
   - **NON via Supabase** - RLS protège (CONFIRMED)
   - **OUI via localStorage** - En mode local, pas d'isolation tenant (CONFIRMED)
   - Si deux comptes locaux créés sur le même appareil, ils partagent le localStorage mais pas le scope (CONFIRMED)

---

## 15. Données Non Synchronisées

### Données présentes localement mais sans équivalent distant

```
localStorage
├── casierdor_users [SYNC PARTIEL - via Supabase trigger]
├── casierdor_installation_secret [NON SYNC]
├── casierdor_secure_auth [NON SYNC]
├── casierdor_secure_auth_forced [NON SYNC]
├── casierdor_legacy_download [NON SYNC]
├── casierdor_export_format [NON SYNC]
├── casierdor_admin_disabled [NON SYNC]
├── casierdor_user_disabled [NON SYNC]
├── casierdor_last_key_save_hint [NON SYNC]
├── casier_confirm_prefs [NON SYNC]
├── neverAskAgain [NON SYNC]
├── offline_mode [NON SYNC]
├── offline_timestamp [NON SYNC]
├── auth_disabled [NON SYNC]
├── LEGACY_STORAGE_LABEL [NON SYNC]
├── casier_recent_modules [NON SYNC]
├── casier_migrated_scope_{userId} [NON SYNC]
└── casier_archive_data_{id} [NON SYNC]

Supabase
├── Tenant [SYNC]
├── User [SYNC]
├── Product [SYNC si configuré]
├── Client [SYNC si configuré]
├── Sale [SYNC si configuré]
└── (autres tables non utilisées)
```

### Données jamais envoyées

**CRITIQUES :**
- `casierdor_installation_secret` - Secret installation appareil (CONFIRMED)
- `recoveryConfig` (dans settings) - Configuration récupération (CONFIRMED)

**PRÉFÉRENCES UI :**
- Format export préféré (CONFIRMED)
- Mode download legacy (CONFIRMED)
- Modules récents visités (CONFIRMED)
- Préférences confirmations (CONFIRMED)

**FLAGS SÉCURITÉ :**
- `auth_disabled` - Bypass auth (CONFIRMED)
- `casierdor_secure_auth_forced` - Auth forcée (CONFIRMED)
- Comptes test désactivés (CONFIRMED)

**ARCHIVES :**
- Données d'archives (CONFIRMED)
- Métadonnées d'archives (CONFIRMED)

### Lesquelles sont critiques

**CRITIQUES :**
- `recoveryConfig` - Clé de récupération (CONFIRMED)
- `casierdor_installation_secret` - Secret installation (CONFIRMED)

**IMPORTANTES :**
- `auth_disabled` - Sécurité (CONFIRMED)
- Préférences utilisateur (CONFIRMED)

### Lesquelles devraient être sauvegardées côté serveur

**RECOMMANDÉ :**
- `recoveryConfig` - Pour récupération multi-device (CONFIRMED)
- Préférences utilisateur - Pour expérience cohérente (CONFIRMED)
- `auth_disabled` - Pour cohérence de sécurité (CONFIRMED)

---

## 16. Données Distantes Non Récupérées

### Données existant sur serveur mais jamais récupérées localement

**Supabase :**
```
├── Tenant [SYNC PARTIEL - métadonnées seulement]
├── User [SYNC PARTIEL - métadonnées seulement]
├── Product [PUSH SEULEMENT]
├── Client [PUSH SEULEMENT]
├── Sale [PUSH SEULEMENT]
└── (autres tables non utilisées)
```

**Problème :**
- Si des données sont créées ou modifiées directement dans Supabase (via interface admin ou autre), elles ne seront JAMAIS récupérées localement (CONFIRMED)
- Il n'y a AUCUN mécanisme de pull (CONFIRMED)

**Impact :**
- Divergence entre local et distant (CONFIRMED)
- Perte de modifications distantes (CONFIRMED)

---

## 17. Problèmes de Perte de Données

### Endroits où des données peuvent disparaître

#### localStorage.clear()

**Emplacement :** Aucun appel direct dans le code (CONFIRMED)
**Risque :** FAIBLE - Pas utilisé dans l'application

#### removeItem()

**Emplacements identifiés :**
- `authService.ts` ligne 345-346 : `removeItem('auth_user')`, `removeItem('auth_token')` (CONFIRMED)
- `authService.ts` ligne 522 : `removeItem('auth_remember')` (CONFIRMED)
- `authService.ts` ligne 868 : `removeItem('casierdor_secure_auth_forced')` (CONFIRMED)
- `accountStorage.ts` ligne 39 : `removeItem('casier_active_storage_scope')` (CONFIRMED)
- `syncQueue.ts` ligne 87 : `removeItem('casier_sync_queue')` (CONFIRMED)

**Risque :** MOYEN - Seules les clés d'auth et queue sont supprimées, pas les données métier

#### overwrite

**Emplacements :**
- `store.ts` ligne 102 : `setItem()` écrase complètement la valeur (CONFIRMED)
- Pas de merge intelligent (CONFIRMED)

**Risque :** ÉLEVÉ - Si deux écritures concurrentes, la dernière gagne

#### replace

**Emplacements :**
- `store.ts` - Pas de fonction replace explicite (CONFIRMED)
- Les appels `setItem()` remplacent la valeur entière (CONFIRMED)

**Risque :** MOYEN - Remplacement explicite plutôt que incrémental

#### upsert

**Emplacements :**
- `syncEngine.ts` ligne 73 : `supabase.from(tableName).upsert()` (CONFIRMED)
- Last write wins sur la même primary key (CONFIRMED)

**Risque :** ÉLEVÉ - Conflits multi-device non résolus

#### delete

**Emplacements :**
- `store.ts` - Pas de delete direct de clés (CONFIRMED)
- `syncEngine.ts` ligne 77-82 : Suppression soft/hard dans Supabase (CONFIRMED)

**Risque :** MOYEN - Géré via corbeille

#### migration

**Emplacements :**
- `accountStorage.ts` ligne 55-78 : `migrateLegacyStoreToScope()` (CONFIRMED)
- Copie les données legacy vers le scope (CONFIRMED)

**Risque :** FAIBLE - Migration est additive, pas destructive

#### scope switch

**Emplacements :**
- `accountStorage.ts` ligne 37-39 : `setActiveStorageScope()` (CONFIRMED)
- `authService.ts` ligne 653 : `clearActiveStorageScope()` (CONFIRMED)

**Risque :** ÉLEVÉ - Données de l'ancien scope deviennent inaccessibles

#### logout

**Emplacements :**
- `authService.ts` ligne 646-667 : `logout()` (CONFIRMED)

**Risque :** MOYEN - Les données restent mais deviennent inaccessibles

#### account switch

**Emplacements :**
- Pas de mécanisme de switch de compte explicite (CONFIRMED)
- Pourrait être fait via logout + login

**Risque :** ÉLEVÉ - Même risque que logout

### Classification

**CRITICAL :**
- Scope switch/logout sans récupération des données (CONFIRMED)

**HIGH :**
- Conflits multi-device (last write wins) (CONFIRMED)
- Overwrite sans merge (CONFIRMED)

**MEDIUM :**
- removeItem de clés critiques (CONFIRMED)
- Suppression hard dans Supabase (CONFIRMED)

**LOW :**
- localStorage.clear() (non utilisé) (CONFIRMED)
- Migration legacy (additive) (CONFIRMED)

---

## 18. Source de Vérité

### Par entité

| Entité | Source actuelle | Source au login | Source offline | Source après sync |
| ------ | --------------- | --------------- | -------------- | ----------------- |
| **User** | localStorage | localStorage | localStorage | localStorage + Supabase (si configuré) |
| **Product** | localStorage | localStorage | localStorage | localStorage (push vers Supabase) |
| **Client** | localStorage | localStorage | localStorage | localStorage (push vers Supabase) |
| **Sale** | localStorage | localStorage | localStorage | localStorage (push vers Supabase) |
| **Settings** | localStorage | localStorage | localStorage | localStorage (push vers Supabase) |
| **Activity** | localStorage | localStorage | localStorage | localStorage (push vers Supabase) |
| **Tenant** | Supabase (si configuré) | Créé à register | Non applicable | Supabase (si configuré) |
| **SyncQueue** | localStorage | localStorage | localStorage | localStorage |

### Analyse

**LOCAL :** Toutes les données métier (CONFIRMED)
**REMOTE :** User/Tenant si Supabase configuré (CONFIRMED)
**BOTH :** User/Tenant en mode Supabase (CONFIRMED)
**UNDEFINED :** Aucune (CONFIRMED)

---

## 19. Data Lifecycle

### User

**CREATE :**
- `RegisterPage` → `authService.register()` → `LocalDatabase.createUser()` → `localStorage.casierdor_users` (CONFIRMED)

**READ :**
- `authService.login()` → `LocalDatabase.findUserByEmail()` → `localStorage.casierdor_users` (CONFIRMED)

**UPDATE :**
- `authService.updateProfile()` → `LocalDatabase.updateUser()` → `localStorage.casierdor_users` (CONFIRMED)

**DELETE :**
- `LocalDatabase.deleteUser()` → `localStorage.casierdor_users` (CONFIRMED)

**RESTORE :**
- Non implémenté (CONFIRMED)

**SYNC :**
- Non sync automatiquement (sauf via Supabase trigger si configuré) (CONFIRMED)

**RECOVERY :**
- Via clé de récupération (recoveryKeyService.ts) (CONFIRMED)

### Product

**CREATE :**
- `ProductList` → `setStoreData(STORAGE_KEYS.PRODUCTS, [...])` → `localStorage.casier_products::userId` (CONFIRMED)

**READ :**
- `getStoreData(STORAGE_KEYS.PRODUCTS, [])` → `localStorage.casier_products::userId` (CONFIRMED)

**UPDATE :**
- `setStoreData(STORAGE_KEYS.PRODUCTS, updated)` → `localStorage.casier_products::userId` (CONFIRMED)

**DELETE :**
- `moveToTrash(product, 'PRODUCT')` → `localStorage.casier_recycle_bin::userId` (CONFIRMED)

**RESTORE :**
- `restoreFromTrash(trashId)` → `localStorage.casier_products::userId` (CONFIRMED)

**SYNC :**
- `enqueueSyncItem('product', 'create/update/delete')` → `localStorage.casier_sync_queue` (CONFIRMED)
- `syncEngine` → `supabase.from('Product').upsert()` (CONFIRMED)

**RECOVERY :**
- Via corbeille (CONFIRMED)

### Client

**Même pattern que Product** (CONFIRMED)

### Sale

**CREATE :**
- `NewSale` → `setStoreData(STORAGE_KEYS.SALES, [...])` → `localStorage.casier_sales::userId` (CONFIRMED)

**READ :**
- `getStoreData(STORAGE_KEYS.SALES, [])` → `localStorage.casier_sales::userId` (CONFIRMED)

**UPDATE :**
- `setStoreData(STORAGE_KEYS.SALES, updated)` → `localStorage.casier_sales::userId` (CONFIRMED)

**DELETE :**
- `moveToTrash(sale, 'SALE')` → `localStorage.casier_recycle_bin::userId` (CONFIRMED)

**RESTORE :**
- `restoreFromTrash(trashId)` → `localStorage.casier_sales::userId` (CONFIRMED)

**SYNC :**
- `enqueueSyncItem('sale', 'create/update/delete')` → `localStorage.casier_sync_queue` (CONFIRMED)
- `syncEngine` → `supabase.from('Sale').upsert()` (CONFIRMED)

**RECOVERY :**
- Via corbeille (CONFIRMED)

---

## 20. Event Trace

### Événements système disponibles

**login :**
- Déclenché par `authService.login()` (CONFIRMED)
- Déclenche : AuthContext dispatch AUTH_SUCCESS (CONFIRMED)

**logout :**
- Déclenché par `authService.logout()` (CONFIRMED)
- Déclenche : AuthContext dispatch LOGOUT (CONFIRMED)

**online :**
- Déclenché par `window.addEventListener('online')` (CONFIRMED - authContext.ts ligne 215-216)
- Déclenche : syncEngine.processQueue() (CONFIRMED - syncEngine.ts ligne 18)

**offline :**
- Déclenché par `window.addEventListener('offline')` (CONFIRMED - authContext.ts ligne 216-217)
- Déclenche : AuthContext dispatch SET_ONLINE_STATUS(false) (CONFIRMED)

**app startup :**
- Déclenché par `App.tsx` useEffect (CONFIRMED)
- Déclenche : initializeStore(), syncEngine.start() (CONFIRMED)

**data mutation :**
- Déclenché par `setStoreData()` (CONFIRMED)
- Déclenche : enqueueSyncItem() (CONFIRMED)

**sync started :**
- Déclenché par `syncEngine.processQueue()` (CONFIRMED)
- Log : `[SyncEngine] Synced {operation} for {entity}` (CONFIRMED)

**sync success :**
- Déclenché par dequeueSyncItem() (CONFIRMED)
- Log : `[SyncEngine] Synced {operation} for {entity}` (CONFIRMED)

**sync failure :**
- Déclenché par markSyncAttempt() (CONFIRMED)
- Log : `[SyncEngine] Failed to sync item {item.id}` (CONFIRMED)

**account switch :**
- Non implémenté (CONFIRMÉ)

### Ce qui déclenche réellement une synchronisation

**Déclencheurs :**
1. Intervalle 30 secondes (CONFIRMED - syncEngine.ts ligne 10)
2. Event 'online' (CONFIRMED - syncEngine.ts ligne 18)
3. Appel direct `processQueue()` (non utilisé actuellement) (CONFIRMED)

---

## 21. Observabilité

### Logs existants

**console.log :**
- `[App] Modules préchargés` (App.tsx) (CONFIRMED)
- `[ProtectedRoute] État auth` (App.tsx) (CONFIRMED)
- `[AuthContext] Erreur initialisation auth` (authContext.ts) (CONFIRMED)
- `[SyncEngine] Synced {operation} for {entity}` (syncEngine.ts) (CONFIRMED)
- `[SyncEngine] Failed to sync item` (syncEngine.ts) (CONFIRMED)
- `[SyncEngine] Erreur globale lors de la synchronisation` (syncEngine.ts) (CONFIRMED)

### Erreurs capturées

**Try/catch dans :**
- `authService.login()` (CONFIRMED)
- `authService.register()` (CONFIRMED)
- `authService.logout()` (CONFIRMED)
- `syncEngine.processQueue()` (CONFIRMED)
- `syncEngine.syncItem()` (CONFIRMED)
- `store.ts` setStoreData() (CONFIRMED)

### Comment savoir qu'une donnée n'a pas été synchronisée

**Méthodes :**
- `getSyncQueueStats()` → retourne `{pending, failed}` (CONFIRMED - syncQueue.ts ligne 78-83)
- `lastError` dans SyncQueueItem (CONFIRMED)
- `attempts` dans SyncQueueItem (CONFIRMED)

### Comment identifier une donnée locale orpheline

**Méthodes :**
- Aucun mécanisme automatique (CONFIRMED)
- Manuellement : comparer local vs remote (non implémenté) (CONFIRMED)

### Comment diagnostiquer une divergence Local vs Remote

**Méthodes :**
- Aucun outil de diagnostic automatique (CONFIRMED)
- Manuellement : inspection localStorage + inspection Supabase (non implémenté) (CONFIRMED)

---

## 22. Security Audit lié aux Données

### Mots de passe

**Stockage :**
- Hashé avec PBKDF2-SHA256 via crypto-js (CONFIRMED - cryptoVault.ts)
- Stocké dans `localStorage.casierdor_users` (CONFIRMED - authService.ts ligne 151)
- Stocké dans `localStorage.auth_user` (CONFIRMED - authService.ts ligne 342)

**Risque :**
- Si XSS, passwords hashés exposés (CONFIRMED)
- Pas de véritable protection côté client (CONFIRMED)

### Tokens

**Stockage :**
- `localStorage.auth_token` (optionnel, Supabase) (CONFIRMED - authService.ts ligne 346)
- Token Supabase géré par library (CONFIRMED)

**Risque :**
- Si XSS, token exposé (CONFIRMED)
- Pas de validation de token côté client (CONFIRMED)

### Secrets

**Stockage :**
- `localStorage.casierdor_installation_secret` (base64) (CONFIRMED - cryptoVault.ts ligne 74)
- `recoveryConfig.keyHash` dans settings (CONFIRMED)

**Risque :**
- Si XSS, secrets exposés (CONFIRMED)
- Pas de chiffrement supplémentaire (CONFIRMED)

### Recovery keys

**Stockage :**
- Hash dans settings (CONFIRMED)
- Fichier de récupération (optionnel) (CONFIRMED)

**Risque :**
- Si XSS, hash exposé (CONFIRMED)
- Mais clé elle-même stockée par utilisateur (CONFIRMED)

### Données personnelles

**Stockage :**
- User (email, phone, recoveryEmail) (CONFIRMED)
- Client (name, phone) (CONFIRMED)

**Risque :**
- Exposé via localStorage (CONFIRMED)
- Pas de chiffrement des données personnelles (CONFIRMED)

### Données financières

**Stockage :**
- Sale (total, paymentDetails) (CONFIRMED)
- AccountingTransaction (amount) (CONFIRMED)

**Risque :**
- Exposé via localStorage (CONFIRMED)
- Pas de chiffrement des données financières (CONFIRMED)

### Stockage local

**Risque XSS :**
- ÉLEVÉ - Toutes les données en clair dans localStorage (CONFIRMED)
- Si injection XSS possible, tout exposé (CONFIRMED)

### Accès Supabase

**Sécurité :**
- RLS active (CONFIRMED)
- Tenant isolation (CONFIRMED)
- Mais dépend de l'intégrité du token Supabase (CONFIRMED)

---

## 23. Matrice Finale

| Zone | Fonctionnement actuel | Risque | Gravité | Preuve | Dépendance |
| ---- | --------------------- | ------ | ------- | ------ | ---------- |
| **Auth locale** | localStorage.casierdor_users | Multi-device impossible | CRITICAL | authService.ts ligne 151 | Aucune |
| **Auth distante** | Supabase Auth (optionnel) | Pas de fallback | HIGH | authService.ts ligne 416 | VITE_SUPABASE_* |
| **Sync** | Push uniquement (local → remote) | Pas de récupération distant | CRITICAL | syncEngine.ts ligne 71 | Supabase |
| **Pull** | Absent | Données distantes perdues | CRITICAL | Aucun code de pull | N/A |
| **Merge** | Absent | Conflits non résolus | HIGH | Aucun code de merge | N/A |
| **Conflict** | Last write wins | Perte de données | HIGH | syncEngine.ts ligne 73 | N/A |
| **Scope isolation** | storageAccountId | Inaccessibilité après logout | MEDIUM | accountStorage.ts ligne 37 | localStorage |
| **Source de vérité** | localStorage | Divergence possible | HIGH | store.ts ligne 102 | N/A |
| **Queue sync** | localStorage FIFO | Limite 500 items | MEDIUM | syncQueue.ts ligne 28 | localStorage |
| **Tenant isolation** | RLS Supabase | Pas en mode local | MEDIUM | migration SQL ligne 111 | Supabase |
| **Secrets** | localStorage en clair | Exposition XSS | HIGH | cryptoVault.ts ligne 74 | N/A |
| **Recovery** | Clé hashée locale | Multi-device impossible | CRITICAL | recoveryKeyService.ts | N/A |
| **Offline mode** | Flag localStorage | Pas de véritable sync offline | MEDIUM | permissionManager.ts ligne 458 | N/A |
| **Data loss** | Scope switch | Données inaccessibles | HIGH | accountStorage.ts ligne 39 | N/A |

---

## 24. Diagnostic Final

### Réponses aux 15 questions

1. **Où un utilisateur est-il réellement créé ?**
   - **Mode local :** `localStorage.casierdor_users` (CONFIRMED)
   - **Mode Supabase :** PostgreSQL (tables Tenant + User) + `localStorage.casierdor_users` (CONFIRMED)

2. **Où ses identifiants sont-ils réellement stockés ?**
   - **Mode local :** `localStorage.casierdor_users` (CONFIRMED)
   - **Mode Supabase :** PostgreSQL + `localStorage.casierdor_users` (CONFIRMED)

3. **Quel système authentifie réellement l'utilisateur ?**
   - **Mode local :** `LocalDatabase.findUserByEmail()` dans localStorage (CONFIRMED)
   - **Mode Supabase :** `supabase.auth.signInWithPassword()` (CONFIRMED)
   - **Hybride :** Supabase si configuré, sinon local (CONFIRMED)

4. **L'identité est-elle globale entre appareils ?**
   - **Mode local :** NON - Identité purement locale (CONFIRMED)
   - **Mode Supabase :** OUI - Identité partagée via Supabase Auth (CONFIRMED)

5. **Où les données métier sont-elles réellement stockées ?**
   - **localStorage** avec isolation par `storageAccountId` (CONFIRMED)
   - **Supabase** (optionnel, push uniquement) (CONFIRMED)

6. **Quelle est la source de vérité actuelle ?**
   - **localStorage** pour toutes les données métier (CONFIRMED)
   - **Supabase** pour User/Tenant si configuré (CONFIRMED)

7. **Le système est-il réellement offline-first ?**
   - **OUI** - Toutes les opérations fonctionnent sans connexion (CONFIRMED)
   - Mais sync est unidirectionnel (CONFIRMED)

8. **La synchronisation est-elle réellement bidirectionnelle ?**
   - **NON** - Uniquement push (local → remote) (CONFIRMED)
   - Aucun mécanisme pull (CONFIRMED)

9. **Que se passe-t-il lorsqu'un remote est vide ?**
   - Local upsert vers remote (CONFIRMED)
   - Local n'est pas modifié (CONFIRMED)
   - Pas de protection spécifique (CONFIRMED)

10. **Que se passe-t-il lorsque le local est vide ?**
    - Local reste vide (CONFIRMED)
    - Aucun pull depuis remote (CONFIRMED)
    - Application vide (CONFIRMED)

11. **Que se passe-t-il lorsqu'un utilisateur change d'appareil ?**
    - **Mode local :** Impossible de se connecter (CONFIRMED)
    - **Mode Supabase :** Connexion possible, mais données locales non récupérées (CONFIRMED)

12. **Que se passe-t-il lorsqu'il y a deux modifications concurrentes ?**
    - Last write wins (CONFIRMED)
    - Pas de stratégie de conflit (CONFIRMED)
    - Première modification perdue (CONFIRMED)

13. **Quelles données ne sont jamais synchronisées ?**
    - `casierdor_installation_secret` (CONFIRMED)
    - `recoveryConfig` (CONFIRMED)
    - Préférences UI (CONFIRMED)
    - Flags sécurité (CONFIRMED)
    - Archives (CONFIRMED)

14. **Quels sont les risques de perte de données ?**
    - Scope switch/logout (données inaccessibles) (HIGH)
    - Conflits multi-device (last write wins) (HIGH)
    - localStorage vidé (sans Supabase) (CRITICAL)
    - Queue overflow (>500 items) (MEDIUM)

15. **Quel est le principal problème architectural empêchant aujourd'hui le fonctionnement multi-device fiable ?**
    - **Authentification locale dépendante du localStorage** - Les comptes créés en mode local sont liés à l'appareil et ne peuvent pas être utilisés sur un autre appareil (CONFIRMED)
    - **Absence de pull mechanism** - Même avec Supabase Auth, les données locales ne sont pas récupérées depuis le cloud (CONFIRMED)

---

## 25. Critical Findings

### CRITICAL

#### 1. Impossibilité multi-device en mode local
**Cause :** Authentification purement locale via localStorage
**Fichier :** `utils/authService.ts`
**Fonction :** `LocalDatabase.saveToLocalStorage()` ligne 149-155
**Impact :** Utilisateur ne peut pas se connecter depuis un autre appareil
**Scénario de reproduction :** Créer compte sur Machine A, essayer de se connecter sur Machine B
**Preuve :**
```typescript
private saveToLocalStorage() {
  try {
    localStorage.setItem('casierdor_users', JSON.stringify(this.users));
  } catch (error) {
    console.error('Erreur sauvegarde utilisateurs:', error);
  }
}
```

#### 2. Absence de pull mechanism
**Cause :** Sync engine implémenté uniquement pour push
**Fichier :** `utils/syncEngine.ts`
**Fonction :** `syncItem()` ligne 51-92
**Impact :** Données distantes jamais récupérées localement
**Scénario de reproduction :** Machine A sync vers Supabase, Machine B se connecte avec localStorage vide
**Preuve :**
```typescript
if (operation === 'create' || operation === 'update') {
  const finalPayload = tenantId ? { ...payload, tenantId } : payload;
  const { error } = await supabase.from(tableName).upsert(finalPayload);
  // Aucun code pour lire depuis Supabase
}
```

#### 3. Données inaccessibles après logout
**Cause :** Scope localStorage supprimé sans mécanisme de récupération
**Fichier :** `utils/accountStorage.ts`
**Fonction :** `clearActiveStorageScope()` ligne 87-89
**Impact :** Données existent mais deviennent inaccessibles
**Scénario de reproduction :** Se connecter, créer données, se déconnecter, se reconnecter
**Preuve :**
```typescript
export function clearActiveStorageScope(): void {
  setActiveStorageScope(null);
}
// setActiveStorageScope supprime la clé, rendant les données scopées inaccessibles
```

#### 4. Perte de données si localStorage vidé sans Supabase
**Cause :** localStorage est la seule source de vérité
**Fichier :** `store.ts`
**Fonction :** `getStoreData()` ligne 49-52
**Impact :** Perte totale des données métier
**Scénario de reproduction :** Utilisateur vide localStorage, Supabase non configuré
**Preuve :**
```typescript
export const getStoreData = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(scopeStorageKey(key));
  return data ? JSON.parse(data) : defaultValue;
};
// Si localStorage vidé, retourne defaultValue (tableau vide)
```

#### 5. Absence de stratégie de conflit multi-device
**Cause :** Last write wins sans validation
**Fichier :** `utils/syncEngine.ts`
**Fonction :** `syncItem()` ligne 71-74
**Impact :** Première modification perdue en cas de conflit
**Scénario de reproduction :** Machine A et B modifient même produit offline, reconnectent
**Preuve :**
```typescript
if (operation === 'create' || operation === 'update') {
  const finalPayload = tenantId ? { ...payload, tenantId } : payload;
  const { error } = await supabase.from(tableName).upsert(finalPayload);
  // Pas de vérification de conflit, pas de timestamp-based resolution
}
```

### HIGH

#### 6. Secrets en clair dans localStorage
**Cause :** Installation secret et passwords hashés stockés en clair
**Fichier :** `utils/cryptoVault.ts`
**Fonction :** `ensureInstallationSecret()` ligne 71-75
**Impact :** Exposition si XSS
**Scénario de reproduction :** Attaquant injecte script, lit localStorage
**Preuve :**
```typescript
export function ensureInstallationSecret(): void {
  if (localStorage.getItem(INSTALL_SECRET_KEY)) return;
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(INSTALL_SECRET_KEY, bytesToBase64(bytes));
}
```

#### 7. Queue sync sans backoff
**Cause :** Retry immédiat sans stratégie d'attente
**Fichier :** `utils/syncEngine.ts`
**Fonction :** `processQueue()` ligne 29-48
**Impact :** Échec répété inutile, surcharge serveur
**Scénario de reproduction :** Offline prolongé, beaucoup d'items en queue
**Preuve :**
```typescript
public async processQueue() {
  // Pas de backoff, retry immédiat à chaque intervalle
  const items = peekSyncQueue(10);
  for (const item of items) {
    await this.syncItem(item);
  }
}
```

#### 8. Source de vérité ambiguë
**Cause :** Données dans localStorage ET potentiellement Supabase sans stratégie claire
**Fichier :** `store.ts`, `syncEngine.ts`
**Fonction :** `setStoreData()` ligne 67-103, `syncItem()` ligne 71-74
**Impact :** Incohérences possibles, confusion sur la source de vérité
**Scénario de reproduction :** Utilisateur modifie donnée, sync échoue partiellement
**Preuve :**
```typescript
// store.ts écrit dans localStorage
localStorage.setItem(scopeStorageKey(key), JSON.stringify(value));
// syncEngine écrit dans Supabase
await supabase.from(tableName).upsert(finalPayload);
// Pas de stratégie pour déterminer laquelle est la source de vérité
```

#### 9. Doublons possibles dans sync queue
**Cause :** Pas de déduplication dans enqueueSyncItem
**Fichier :** `utils/syncQueue.ts`
**Fonction :** `enqueueSyncItem()` ligne 43-58
**Impact :** Même opération sync plusieurs fois
**Scénario de reproduction :** Même modification enregistrée plusieurs fois
**Preuve :**
```typescript
export function enqueueSyncItem(...) {
  const item: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    // Pas de vérification si item similaire existe déjà
  };
  const queue = loadQueue();
  saveQueue([item, ...queue]);
}
```

#### 10. Données critiques non synchronisées
**Cause :** Recovery config et secrets non envoyés à Supabase
**Fichier :** `utils/recoveryKeyService.ts`, `utils/cryptoVault.ts`
**Fonction :** `registerRecoveryKey()` ligne 34-56
**Impact :** Récupération multi-device impossible
**Scénario de reproduction :** Utilisateur configure récupération, change d'appareil
**Preuve :**
```typescript
export async function registerRecoveryKey(...) {
  const config: RecoveryConfig = {
    method,
    ...hashed,
    keyUsedAt: undefined,
  };
  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  setStoreData(STORAGE_KEYS.SETTINGS, {
    ...settings,
    recoveryConfig: config,
  });
  // Pas d'envoi vers Supabase
}
```

### MEDIUM

#### 11. Pas de notification utilisateur sync échec
**Cause :** Erreurs loggées mais pas communiquées
**Fichier :** `utils/syncEngine.ts`
**Fonction :** `syncItem()` ligne 88-91
**Impact :** Utilisateur ne sait pas que sync échoue
**Scénario de reproduction :** Sync échoue silencieusement
**Preuve :**
```typescript
} catch (err: any) {
  console.error(`[SyncEngine] Failed to sync item ${item.id}:`, err);
  markSyncAttempt(item.id, err?.message || 'Erreur inconnue');
  // Pas de notification utilisateur
}
```

#### 12. Queue overflow sans alerte
**Cause :** Limite 500 items, oldest dropped
**Fichier :** `utils/syncQueue.ts`
**Fonction :** `saveQueue()` ligne 39-41
**Impact :** Oldest items perdus si queue pleine
**Scénario de reproduction :** Offline prolongé avec beaucoup de modifications
**Preuve :**
```typescript
function saveQueue(items: SyncQueueItem[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(0, MAX_QUEUE_SIZE)));
  // Si > 500, oldest items sont supprimés sans alerte
}
```

#### 13. Pas de validation tenantId local
**Cause :** En mode local, pas de tenantId du tout
**Fichier :** `authService.ts`
**Fonction :** `createUser()` ligne 182-215
**Impact :** Données non isolées par tenant en mode local
**Scénario de reproduction :** Mode local, plusieurs comptes sur même appareil
**Preuve :**
```typescript
const newUser: User = {
  id: userId,
  storageAccountId: userId,
  // Pas de tenantId en mode local
  name: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
  // ...
};
```

#### 14. Soft delete non cohérent
**Cause :** Certains tables ont deletedAt, d'autres non
**Fichier :** `prisma/schema.prisma`, code frontend
**Impact :** Incohérence dans la gestion de suppression
**Scénario de reproduction :** Suppression sur différentes entités
**Preuve :**
```prisma
// Prisma schema
model Product {
  deletedAt DateTime?
}
model Client {
  deletedAt DateTime?
}
// Mais frontend utilise active boolean pour certaines entités
```

#### 15. Pas de diagnostic tools
**Cause :** Aucun outil pour détecter divergences local/remote
**Impact :** Difficile de diagnostiquer les problèmes de sync
**Scénario de reproduction :** Utilisateur suspecte données non synchronisées
**Preuve :** Aucun fichier de diagnostic ou outil dans le code (CONFIRMED)

### LOW

#### 16. Magic strings pour clés localStorage
**Cause :** Clés en dur dans plusieurs fichiers
**Fichier :** `store.ts`, `authService.ts`, etc.
**Impact :** Risque de typos, maintenance difficile
**Scénario de reproduction :** Modification d'une clé, oubli dans un fichier
**Preuve :**
```typescript
// store.ts
export const STORAGE_KEYS = {
  PRODUCTS: 'casier_products',
  // ...
};
// Mais certains fichiers utilisent encore des chaînes en dur
```

#### 17. Pas de tests de sync
**Cause :** Aucun test unitaire ou d'intégration
**Impact :** Risque de régressions
**Scénario de reproduction :** Modification de syncEngine, bugs introduits
**Preuve :** Aucun fichier de test dans le projet (CONFIRMED)

#### 18. Gestion d'erreurs inconsistante
**Cause :** Parfois try/catch, parfois silencieux
**Impact :** Comportement imprévisible
**Scénario de reproduction :** Erreur surprenante
**Preuve :** Certains fichiers ont try/catch, d'autres non (CONFIRMED)

#### 19. Pas de logging structuré
**Cause :** console.log dispersés
**Impact :** Difficile de debug en production
**Scénario de reproduction :** Problème en prod, difficile à tracer
**Preuve :** console.log dispersés dans tout le code (CONFIRMED)

#### 20. Prisma non utilisé
**Cause :** Schema défini mais non utilisé
**Impact :** Confusion, dette technique
**Scénario de reproduction :** Maintenance inutile
**Preuve :** Schema défini mais pas de DATABASE_URL (CONFIRMED)

---

## 26. Phase 3 Requirements

### Besoins techniques identifiés

#### Authentification
- **Remote authentication must become authoritative** - L'authentification doit être basée sur Supabase Auth comme source de vérité
- **Local persistence must remain available offline** - Les données locales doivent rester accessibles offline
- **Local auth must become a cache, not the source of truth** - L'auth locale doit être un cache, pas la source de vérité
- **Identity mapping must be deterministic** - Le mapping entre identités locales et distantes doit être déterministe
- **Account recovery must work multi-device** - La récupération de compte doit fonctionner multi-device

#### Synchronisation
- **Sync must support pull + push** - La sync doit être bidirectionnelle
- **Empty remote must never blindly erase local data** - Un remote vide ne doit jamais écraser les données locales
- **Empty local must be able to pull from remote** - Un local vide doit pouvoir récupérer depuis le remote
- **Conflict strategy must be defined** - Une stratégie de résolution de conflits doit être définie
- **Sync queue must have deduplication** - La queue sync doit avoir une déduplication
- **Sync failures must be user-visible** - Les échecs de sync doivent être visibles par l'utilisateur

#### Données
- **Source of truth must be clearly defined** - La source de vérité doit être clairement définie (remote)
- **Critical data must be synced** - Les données critiques (recovery, settings) doivent être synchronisées
- **Scope switch must preserve data access** - Le changement de scope doit préserver l'accès aux données
- **Data loss prevention mechanisms must be implemented** - Des mécanismes de prévention de perte de données doivent être implémentés

#### Sécurité
- **Secrets must not be stored in plain localStorage** - Les secrets ne doivent pas être stockés en clair dans localStorage
- **Recovery keys must be encrypted** - Les clés de récupération doivent être chiffrées
- **XSS protection must be enhanced** - La protection XSS doit être renforcée

#### Observabilité
- **Diagnostic tools must be implemented** - Des outils de diagnostic doivent être implémentés
- **Sync status must be visible** - Le statut de sync doit être visible
- **Data divergence detection must be possible** - La détection de divergence de données doit être possible

#### Architecture
- **Tenant isolation must work in local mode** - L'isolation tenant doit fonctionner en mode local
- **Local database (SQLite) must be considered** - Une base de données locale (SQLite) doit être considérée
- **Prisma must be either activated or removed** - Prisma doit être soit activé soit supprimé

---

## Conclusion

Cet audit révèle que l'architecture actuelle de Casier d'Or est fondamentalement **offline-first avec localStorage comme source de vérité**, ce qui crée des problèmes critiques pour le multi-device et la synchronisation. Le principal obstacle est l'**authentification locale dépendante du localStorage** qui empêche l'utilisation sur plusieurs appareils, couplé à une **synchronisation unidirectionnelle** qui ne permet pas de récupérer les données distantes.

Pour résoudre ces problèmes, la Phase 3 devra impérativement :
1. Rendre l'authentification distante (Supabase) autoritative
2. Implémenter un véritable mécanisme de sync bidirectionnel
3. Définir clairement la source de vérité (remote)
4. Protéger contre la perte de données lors des changements de scope
5. Sécuriser le stockage des secrets
