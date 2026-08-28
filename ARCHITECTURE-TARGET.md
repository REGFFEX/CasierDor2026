# Casier d'Or — Target Architecture

## 1. Vision

Casier d'Or doit devenir une application professionnelle, robuste, multi-device, multi-plateforme, offline-first et cloud-synchronized, permettant aux commerçants et établissements de gérer leurs ventes, stocks, clients et comptabilité de manière fiable sur tous leurs appareils.

**Caractéristiques cibles :**
- **Cross-platform** : Web, Android, iOS, Windows, Linux, macOS
- **Mobile-first** : Interface optimisée pour mobile mais responsive
- **Offline-first** : Fonctionnement complet sans connexion internet
- **Local-first** : Écriture prioritaire en local avec sync asynchrone
- **Cloud-synchronized** : Supabase comme source de vérité distante partagée
- **Multi-device** : Même compte utilisable sur plusieurs appareils
- **Multi-tenant** : Isolation complète entre établissements
- **Secure** : Authentification robuste, RLS, données chiffrées
- **Internationalized** : Support multi-langue natif
- **Modular** : Architecture en modules/Features
- **AI-ready** : Capacité d'intégration IA via services dédiés
- **Professional UI/UX** : Design system cohérent et accessible

---

## 2. Architectural Principles

### 2.1 Offline-first

**Principe :** L'application doit continuer à fonctionner pleinement lorsque `Internet = OFF`.

**Exigences :**
- Toutes les opérations métier CRUD sont disponibles offline
- L'utilisateur est notifié de l'état offline
- Les données sont persistées localement
- La synchronisation reprend automatiquement lorsque la connexion revient
- Aucune donnée n'est perdue en cas de crash ou fermeture

### 2.2 Local-first

**Principe :** L'écriture utilisateur commence toujours par le stockage local.

**Schéma cible :**
```
USER
  ↓
UI
  ↓
USE CASE
  ↓
LOCAL DATABASE
  ↓
OUTBOX
  ↓
SYNC ENGINE
  ↓
SUPABASE
```

**Justification :** Garantit la réactivité immédiate et la résilience face aux pannes réseau.

### 2.3 Cloud synchronisé

**Principe :** Supabase constitue la source de vérité distante et partagée entre appareils.

**Contrainte :** Supabase ne doit JAMAIS écraser aveuglément les données locales. Les opérations distantes sont explicitement appliquées avec résolution de conflits.

### 2.4 Multi-device

**Principe :** Un même compte peut être utilisé sur plusieurs appareils avec récupération des données distantes.

**Scénario supporté :**
```
Machine A (création) → Supabase → Machine B (récupération)
```

### 2.5 Séparation des responsabilités

**Principe :** L'UI ne doit pas être responsable directement de la base de données, de la synchronisation, de la sécurité, de l'authentification interne ou de la logique métier.

**Responsabilités :**
- **UI** : Affichage, interaction utilisateur, navigation
- **Use Cases** : Logique métier, orchestration
- **Repositories** : Abstraction d'accès aux données
- **Sync Engine** : Synchronisation local ↔ distant
- **Auth Service** : Authentification et sessions
- **Domain Layer** : Entités métier et règles

---

## 3. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Web UI    │  │  Mobile UI  │  │ Desktop UI  │         │
│  │  (React)    │  │ (Capacitor) │  │  (Tauri)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Use Cases   │  │ Auth Logic  │  │ Sync Logic  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Entities   │  │ Value Obj.  │  │Domain Rules │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Local Repos  │  │Remote Repos │  │ Platform    │         │
│  │(SQLite/IDB) │  │ (Supabase)  │  │Adapters     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Supabase   │  │    AI       │  │  Services   │         │
│  │  Auth+DB    │  │  Providers  │  │  External   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Layered Architecture

### 4.1 Presentation Layer

**Responsabilités :**
- Affichage des composants UI
- Gestion des interactions utilisateur
- Navigation entre écrans
- Affichage des notifications
- Gestion des états UI temporaires

**Technologies :**
- React avec TypeScript
- Tailwind CSS
- Design System de composants

**Ne contient PAS :**
- Logique métier
- Accès direct aux données
- Logique d'authentification
- Logique de synchronisation

### 4.2 Application Layer

**Responsabilités :**
- Orchestration des use cases
- Coordination entre repositories
- Gestion des workflows métier
- Validation des entrées
- Gestion des erreurs

**Contient :**
- Use cases (CreateProduct, CreateSale, etc.)
- Application services
- Validators
- Error handlers

**Exemple :**
```typescript
CreateSaleUseCase
↓
validateSaleInput()
↓
productRepository.validateStock()
↓
saleRepository.create()
↓
syncEngine.scheduleSync()
```

### 4.3 Domain Layer

**Responsabilités :**
- Définition des entités métier
- Règles métier invariantes
- Value objects
- Interfaces de repositories
- Domain events

**Contient :**
- Entities (Product, Sale, Client, etc.)
- Value Objects (Money, Quantity, etc.)
- Repository interfaces
- Domain rules

**Dépendances :** Aucune dépendance aux frameworks ou infrastructure

### 4.4 Infrastructure Layer

**Responsabilités :**
- Implémentation des repositories
- Accès aux bases de données
- Intégration avec Supabase
- Platform adapters
- Services externes

**Contient :**
- Local repository implementations
- Remote repository implementations
- Database services
- Platform adapters (File, Notification, etc.)

---

## 5. Folder Structure

```
src/
├── app/                          # Application entry points
│   ├── App.tsx
│   ├── main.tsx
│   └── providers/
│       ├── AuthProvider.tsx
│       ├── QueryProvider.tsx
│       └── ThemeProvider.tsx
│
├── domain/                       # Domain Layer
│   ├── entities/
│   │   ├── Product.ts
│   │   ├── Sale.ts
│   │   ├── Client.ts
│   │   ├── Tenant.ts
│   │   └── User.ts
│   ├── value-objects/
│   │   ├── Money.ts
│   │   ├── Quantity.ts
│   │   └── Percentage.ts
│   ├── repositories/
│   │   ├── IProductRepository.ts
│   │   ├── ISaleRepository.ts
│   │   ├── IClientRepository.ts
│   │   └── IAuthRepository.ts
│   └── rules/
│       ├── BusinessRules.ts
│       └── ValidationRules.ts
│
├── application/                  # Application Layer
│   ├── use-cases/
│   │   ├── product/
│   │   │   ├── CreateProductUseCase.ts
│   │   │   ├── UpdateProductUseCase.ts
│   │   │   └── DeleteProductUseCase.ts
│   │   ├── sale/
│   │   │   ├── CreateSaleUseCase.ts
│   │   │   └── UpdateSaleUseCase.ts
│   │   ├── client/
│   │   │   ├── CreateClientUseCase.ts
│   │   │   └── UpdateClientUseCase.ts
│   │   └── auth/
│   │       ├── LoginUseCase.ts
│   │       ├── LogoutUseCase.ts
│   │       └── RegisterUseCase.ts
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── SyncService.ts
│   │   └── ValidationService.ts
│   └── dto/
│       ├── CreateProductDTO.ts
│       ├── CreateSaleDTO.ts
│       └── CreateClientDTO.ts
│
├── infrastructure/               # Infrastructure Layer
│   ├── repositories/
│   │   ├── local/
│   │   │   ├── LocalProductRepository.ts
│   │   │   ├── LocalSaleRepository.ts
│   │   │   └── LocalClientRepository.ts
│   │   └── remote/
│   │       ├── SupabaseProductRepository.ts
│   │       ├── SupabaseSaleRepository.ts
│   │       └── SupabaseClientRepository.ts
│   ├── database/
│   │   ├── SQLiteDatabase.ts
│   │   ├── IndexedDBDatabase.ts
│   │   └── DatabaseAdapter.ts
│   ├── sync/
│   │   ├── SyncEngine.ts
│   │   ├── Outbox.ts
│   │   ├── ConflictResolver.ts
│   │   └── SyncMetadata.ts
│   └── platform/
│       ├── adapters/
│       │   ├── FileAdapter.ts
│       │   ├── NotificationAdapter.ts
│       │   └── ShareAdapter.ts
│       └── services/
│           ├── FileService.ts
│           ├── NotificationService.ts
│           └── ShareService.ts
│
├── features/                     # Feature-based organization
│   ├── products/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   ├── sales/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   ├── clients/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── auth/
│       ├── components/
│       ├── pages/
│       └── hooks/
│
├── components/                   # Shared UI components
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Dialog.tsx
│   │   └── Table.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   └── forms/
│       ├── ProductForm.tsx
│       ├── SaleForm.tsx
│       └── ClientForm.tsx
│
├── shared/                       # Shared utilities
│   ├── constants/
│   ├── utils/
│   ├── types/
│   └── config/
│
├── locales/                      # i18n
│   ├── fr.json
│   ├── en.json
│   └── index.ts
│
└── platform/                     # Platform-specific code
    ├── web/
    ├── android/
    ├── ios/
    └── desktop/
```

---

## 6. Domain Architecture

### 6.1 Entities

#### Product
```typescript
class Product {
  id: ProductId
  tenantId: TenantId
  sku: string
  name: string
  price: Money
  stock: Quantity
  criticalThreshold: Quantity
  type: ProductType
  active: boolean
  localId?: string
  updatedAt: DateTime
  version: number

  // Domain methods
  adjustStock(delta: Quantity): void
  isLowStock(): boolean
  canBeSold(): boolean
}
```

#### Sale
```typescript
class Sale {
  id: SaleId
  tenantId: TenantId
  saleNumber: string
  lines: SaleLine[]
  total: Money
  status: SaleStatus
  date: DateTime
  localId?: string
  syncedAt?: DateTime
  createdAt: DateTime
  version: number

  // Domain methods
  addLine(line: SaleLine): void
  removeLine(lineId: SaleLineId): void
  calculateTotal(): Money
  canBeModified(): boolean
  finalize(): void
}
```

#### Client
```typescript
class Client {
  id: ClientId
  tenantId: TenantId
  code: string
  name: string
  phone?: string
  localId?: string
  updatedAt: DateTime
  version: number

  // Domain methods
  updatePhone(phone: string): void
  canBeDeleted(): boolean
}
```

#### Tenant
```typescript
class Tenant {
  id: TenantId
  name: string
  createdAt: DateTime
  updatedAt: DateTime

  // Immutable after creation
}
```

#### User
```typescript
class User {
  id: UserId
  tenantId: TenantId
  email: Email
  passwordHash: string
  role: Role
  displayName: string
  storageAccountId: string
  createdAt: DateTime
  updatedAt: DateTime

  // Domain methods
  hasRole(role: Role): boolean
  canPerformAction(action: string): boolean
}
```

### 6.2 Value Objects

#### Money
```typescript
class Money {
  amount: number
  currency: string

  add(other: Money): Money
  subtract(other: Money): Money
  multiply(factor: number): Money
  equals(other: Money): boolean
}
```

#### Quantity
```typescript
class Quantity {
  value: number
  unit: string

  add(other: Quantity): Quantity
  subtract(other: Quantity): Quantity
  isPositive(): boolean
  isZero(): boolean
}
```

### 6.3 Repository Interfaces

```typescript
interface IProductRepository {
  findById(id: ProductId): Promise<Product | null>
  findByTenant(tenantId: TenantId): Promise<Product[]>
  create(product: Product): Promise<Product>
  update(product: Product): Promise<Product>
  delete(id: ProductId): Promise<void>
  findBySku(sku: string, tenantId: TenantId): Promise<Product | null>
}

interface ISaleRepository {
  findById(id: SaleId): Promise<Sale | null>
  findByTenant(tenantId: TenantId): Promise<Sale[]>
  create(sale: Sale): Promise<Sale>
  update(sale: Sale): Promise<Sale>
  delete(id: SaleId): Promise<void>
  findByDateRange(start: DateTime, end: DateTime, tenantId: TenantId): Promise<Sale[]>
}

interface IClientRepository {
  findById(id: ClientId): Promise<Client | null>
  findByTenant(tenantId: TenantId): Promise<Client[]>
  create(client: Client): Promise<Client>
  update(client: Client): Promise<Client>
  delete(id: ClientId): Promise<void>
  findByName(name: string, tenantId: TenantId): Promise<Client | null>
}

interface IAuthRepository {
  findByEmail(email: Email): Promise<User | null>
  create(user: User): Promise<User>
  update(user: User): Promise<User>
  findById(id: UserId): Promise<User | null>
}
```

---

## 7. Application Architecture

### 7.1 Use Cases

#### CreateProductUseCase
```typescript
class CreateProductUseCase {
  constructor(
    private productRepo: IProductRepository,
    private syncService: SyncService
  ) {}

  async execute(input: CreateProductDTO): Promise<Product> {
    // Validation
    const sku = new ProductSKU(input.sku)
    const price = new Money(input.price, input.currency)
    const stock = new Quantity(input.stock)

    // Business rules
    if (stock.value < 0) {
      throw new DomainError('Stock cannot be negative')
    }

    // Create entity
    const product = new Product({
      id: ProductId.generate(),
      tenantId: input.tenantId,
      sku: sku.value,
      name: input.name,
      price,
      stock,
      criticalThreshold: new Quantity(input.criticalThreshold),
      type: input.type,
      active: true,
      updatedAt: DateTime.now(),
      version: 1
    })

    // Persist locally
    await this.productRepo.create(product)

    // Schedule sync
    await this.syncService.scheduleSync('product', 'create', product)

    return product
  }
}
```

#### CreateSaleUseCase
```typescript
class CreateSaleUseCase {
  constructor(
    private saleRepo: ISaleRepository,
    private productRepo: IProductRepository,
    private syncService: SyncService
  ) {}

  async execute(input: CreateSaleDTO): Promise<Sale> {
    // Validation
    const lines = input.lines.map(line => ({
      productId: new ProductId(line.productId),
      quantity: new Quantity(line.quantity),
      price: new Money(line.price, line.currency)
    }))

    // Business rules
    for (const line of lines) {
      const product = await this.productRepo.findById(line.productId)
      if (!product) {
        throw new DomainError('Product not found')
      }
      if (product.stock.value < line.quantity.value) {
        throw new DomainError('Insufficient stock')
      }
    }

    // Create entity
    const sale = new Sale({
      id: SaleId.generate(),
      tenantId: input.tenantId,
      saleNumber: input.saleNumber,
      lines,
      total: this.calculateTotal(lines),
      status: SaleStatus.PENDING,
      date: DateTime.now(),
      createdAt: DateTime.now(),
      version: 1
    })

    // Persist locally
    await this.saleRepo.create(sale)

    // Update stock
    for (const line of lines) {
      const product = await this.productRepo.findById(line.productId)
      product.adjustStock(line.quantity.multiply(-1))
      await this.productRepo.update(product)
    }

    // Schedule sync
    await this.syncService.scheduleSync('sale', 'create', sale)

    return sale
  }

  private calculateTotal(lines: SaleLine[]): Money {
    return lines.reduce((total, line) => 
      total.add(line.price.multiply(line.quantity.value)), 
      new Money(0, 'XAF')
    )
  }
}
```

#### LoginUseCase
```typescript
class LoginUseCase {
  constructor(
    private authRepo: IAuthRepository,
    private supabaseAuth: SupabaseAuthService,
    private sessionService: SessionService
  ) {}

  async execute(input: LoginDTO): Promise<Session> {
    // Authenticate with Supabase
    const supabaseUser = await this.supabaseAuth.signInWithPassword(
      input.email,
      input.password
    )

    // Get user profile
    const user = await this.authRepo.findById(supabaseUser.id)
    if (!user) {
      throw new DomainError('User profile not found')
    }

    // Create session
    const session = await this.sessionService.createSession(user)

    // Initialize local DB
    await this.localDBService.initializeForUser(user)

    // Trigger initial sync
    await this.syncService.triggerInitialSync(user.tenantId)

    return session
  }
}
```

---

## 8. Repository Architecture

### 8.1 Abstraction

```typescript
ProductRepository (interface)
    │
    ├── LocalProductRepository (implements)
    │       └── SQLiteDatabase / IndexedDB
    │
    └── RemoteProductRepository (implements)
            └── Supabase
```

### 8.2 Repository Pattern

**Responsabilités :**
- **Repository Interface** : Définit le contrat, indépendant de l'infrastructure
- **Local Repository** : Implémente l'accès aux données locales (SQLite/IndexedDB)
- **Remote Repository** : Implémente l'accès aux données distantes (Supabase)

**Exemple :**
```typescript
// Domain Layer
interface IProductRepository {
  findById(id: ProductId): Promise<Product | null>
  create(product: Product): Promise<Product>
  // ...
}

// Infrastructure Layer
class LocalProductRepository implements IProductRepository {
  constructor(private db: SQLiteDatabase) {}

  async findById(id: ProductId): Promise<Product | null> {
    const row = await this.db.query('SELECT * FROM products WHERE id = ?', [id])
    return row ? this.mapToEntity(row) : null
  }

  async create(product: Product): Promise<Product> {
    await this.db.insert('products', this.mapToRow(product))
    return product
  }
}

class RemoteProductRepository implements IProductRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: ProductId): Promise<Product | null> {
    const { data } = await this.supabase
      .from('Product')
      .select('*')
      .eq('id', id)
      .single()
    return data ? this.mapToEntity(data) : null
  }

  async create(product: Product): Promise<Product> {
    const { data } = await this.supabase
      .from('Product')
      .insert(this.mapToRow(product))
      .select()
      .single()
    return this.mapToEntity(data)
  }
}
```

### 8.3 Coupling

**La logique métier ne connaît PAS :**
- localStorage
- IndexedDB
- SQLite
- Supabase

Elle connaît uniquement les interfaces de repository.

---

## 9. Local Database

### 9.1 Technology Choice

| Plateforme | Technology | Justification |
| ---------- | ----------- | -------------- |
| **Web** | IndexedDB | Support natif, stockage web |
| **Android** | SQLite | Support natif Android |
| **iOS** | SQLite | Support natif iOS |
| **Desktop (Tauri)** | SQLite | Support robuste desktop |

### 9.2 Database Abstraction

```typescript
interface IDatabase {
  query(sql: string, params?: any[]): Promise<any[]>
  insert(table: string, data: any): Promise<void>
  update(table: string, id: string, data: any): Promise<void>
  delete(table: string, id: string): Promise<void>
  transaction(callback: () => Promise<void>): Promise<void>
}

class SQLiteDatabase implements IDatabase {
  // SQLite implementation (via Tauri-sqlite)
}

class IndexedDBDatabase implements IDatabase {
  // IndexedDB implementation (via Dexie.js)
}

class DatabaseAdapter implements IDatabase {
  // Choix automatique selon plateforme
}
```

### 9.3 Schema Local

**Tables locales :**
```sql
-- Products
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  critical_threshold INTEGER NOT NULL DEFAULT 10,
  type TEXT,
  active BOOLEAN NOT NULL DEFAULT 1,
  local_id TEXT,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  synced_at TEXT
);

-- Sales
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sale_number TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL,
  date TEXT NOT NULL,
  local_id TEXT,
  payload TEXT,
  synced_at TEXT,
  created_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT
);

-- Sync Outbox
CREATE TABLE sync_outbox (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  processed_at TEXT
);

-- Sync Metadata
CREATE TABLE sync_metadata (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  last_sync_version TEXT,
  last_sync_at TEXT
);
```

---

## 10. Remote Database (Supabase)

### 10.1 Role de Supabase

**Composants Supabase :**

| Composant | Rôle | Utilisation |
| --------- | ---- | ----------- |
| **Supabase Auth** | Authentification | Identité utilisateur, sessions |
| **PostgreSQL** | Base de données distante | Source de vérité partagée |
| **Storage** | Stockage fichiers | Images, PDF, exports |
| **Realtime** | Notifications temps réel | Updates multi-device |
| **Edge Functions** | Logique serveur | AI gateway, workflows avancés |

### 10.2 Activation progressive

**Phase 1 (immédiat) :**
- Supabase Auth
- PostgreSQL
- RLS

**Phase 2 (court terme) :**
- Storage pour fichiers
- Realtime pour notifications

**Phase 3 (moyen terme) :**
- Edge Functions pour AI gateway

---

## 11. Identity Model

### 11.1 Structure cible

```
Supabase Auth User (global)
         ↓
     User Profile
         ↓
   Membership
         ↓
      Tenant
         ↓
   Devices (N)
```

### 11.2 Définitions

#### Auth User
- **Source :** Supabase Auth
- **Portée :** Global (tous les tenants)
- **Identifiant :** `auth.uid()`
- **Rôle :** Authentification technique

#### User Profile
- **Source :** PostgreSQL (table User)
- **Portée :** Spécifique au tenant
- **Identifiant :** Même que Auth User
- **Rôle :** Profil utilisateur, rôle, permissions

#### Membership
- **Source :** PostgreSQL (table Membership)
- **Portée :** Lien User ↔ Tenant
- **Identifiant :** Composite (userId + tenantId)
- **Rôle :** Définit l'appartenance à un tenant

#### Tenant
- **Source :** PostgreSQL (table Tenant)
- **Portée :** Établissement/organisation
- **Identifiant :** `tenantId`
- **Rôle :** Isolation des données

#### Device
- **Source :** PostgreSQL (table Device)
- **Portée :** Appareil utilisateur
- **Identifiant :** `deviceId`
- **Rôle :** Traçabilité des appareils

### 11.3 Multi-tenant

**Un utilisateur peut appartenir à plusieurs tenants :**
```
User A
  ├── Tenant 1 (Admin)
  ├── Tenant 2 (Manager)
  └── Tenant 3 (Employee)
```

**Switch de tenant :**
```
User connecté
  ↓
Sélection tenant actif
  ↓
Tenant ID chargé
  ↓
Données filtrées par tenant
```

---

## 12. Authentication

### 12.1 Méthodes supportées

| Méthode | Usage | Priorité |
| ------- | ----- | -------- |
| **Email/Password** | Standard | P0 |
| **Magic Link** | Alternative | P1 |
| **Google OAuth** | Optionnel | P2 |
| **Apple OAuth** | Optionnel (iOS) | P2 |
| **OTP** | 2FA ou login sans password | P2 |

### 12.2 Flow Authentification

```
User enters credentials
↓
AuthService.authenticate()
↓
Supabase Auth.signInWithPassword()
↓
Validation Supabase
↓
Récupération Profile User
↓
Session locale créée
↓
Tenant résolu
↓
Local DB initialisée
↓
Application prête
```

### 12.3 Authentification vs Authorization

**Authentication :** "Qui êtes-vous ?"
- Email/password
- OAuth
- Session

**Authorization :** "Que pouvez-vous faire ?"
- Rôles (admin, manager, employee)
- Permissions (create, read, update, delete)
- Tenant membership

### 12.4 Password Reset

```
User demande reset
↓
Email envoyé (token)
↓
User clique lien
↓
Validation token
↓
Changement password
↓
Invalidate sessions
↓
Login with new password
```

---

## 13. Authentication Offline

### 13.1 Session locale

**Durée :** 7 jours (configurable)

**Stockage :**
```typescript
{
  userId: string
  email: string
  tenantId: string
  expiresAt: DateTime
  deviceSignature: string
}
```

### 13.2 Cache d'identité

**Stockage local :**
```typescript
{
  profile: UserProfile
  memberships: Membership[]
  activeTenantId: string
  lastSyncAt: DateTime
}
```

### 13.3 Scénario offline

```
Internet = OFF
↓
Session locale vérifiée
↓
Cache identité utilisé
↓
Local DB accessible
↓
Application fonctionnelle
↓
Opérations mise en queue
```

### 13.4 Revalidation

```
Internet = ON
↓
Session revalidée avec Supabase
↓
Cache identité rafraîchi
↓
Sync déclenché
```

### 13.5 Expiration

```
Session expirée
↓
Logout automatique
↓
Redirection vers login
↓
Message : "Session expirée, reconnectez-vous"
```

---

## 14. Data Flow Global

### 14.1 Lecture

```
UI Component
    ↓
Use Case
    ↓
Repository (interface)
    ↓
Local Repository
    ↓
Local Database
    ↓
Entity
    ↓
UI Display
```

### 14.2 Écriture

```
UI Component
    ↓
Use Case
    ↓
Validation
    ↓
Business Rules
    ↓
Local Repository
    ↓
Local Database
    ↓
Outbox (enregistrement mutation)
    ↓
Sync Engine (asynchrone)
    ↓
Remote Repository
    ↓
Supabase
```

### 14.3 Synchronisation distante

```
Supabase (polling + Realtime)
    ↓
Remote Repository
    ↓
Sync Engine
    ↓
Local Repository
    ↓
Local Database
    ↓
UI Update (via state management)
```

### 14.4 Multi-device

```
Device A (écriture)
      ↓
Local DB A
      ↓
Sync Engine A
      ↓
      Supabase (source de vérité)
      ↓
Sync Engine B
      ↓
Local DB B
      ↓
Device B (lecture)
```

---

## 15. Sync Engine

### 15.1 Architecture

```
Local Database
    │
    ├── Outbox (mutations à envoyer)
    │
    ├── Sync Metadata (version par table)
    │
    └── Tombstones (suppressions)
           ↓
      Sync Engine
           │
           ├── Push Service (local → remote)
           │
           ├── Pull Service (remote → local)
           │
           ├── Conflict Resolver
           │
           └── Backoff Manager
```

### 15.2 Push Service

```
Outbox
    ↓
Trier par createdAt (FIFO)
    ↓
Pour chaque mutation :
    ↓
Remote Repository.operation()
    ↓
Succès ?
    ↓
OUI → Marquer processed → Supprimer de Outbox
NON → Incrémenter attempts → Backoff
```

### 15.3 Pull Service

```
Sync Metadata
    ↓
Pour chaque table :
    ↓
Remote Repository.since(lastSyncVersion)
    ↓
Conflit détecté ?
    ↓
OUI → Conflict Resolver
NON → Merge → Local Repository.update()
```

### 15.4 Idempotence

Chaque mutation a un `mutationId` unique :
```typescript
{
  mutationId: string  // UUID
  entityId: string
  entityType: string
  operation: 'create' | 'update' | 'delete'
  payload: any
  version: number
}
```

### 15.5 Deduplication

```
Outbox insertion
    ↓
Vérifier si mutationId existe déjà
    ↓
OUI → Ignorer (déjà en queue)
NON → Insérer
```

### 15.6 Ordering

```
Ordre chronologique (createdAt)
    ↓
Mais priorité par type :
    ↓
1. delete (suppressions prioritaires)
2. update
3. create
```

### 15.7 Backoff

```
Tentative 1 : immédiat
Tentative 2 : 5 secondes
Tentative 3 : 30 secondes
Tentative 4 : 2 minutes
Tentative 5 : 10 minutes
Tentative 6+ : 1 heure
```

### 15.8 Crash Recovery

```
App restart
    ↓
Outbox persisté dans Local DB
    ↓
Sync Engine redémarre
    ↓
Reprise des mutations non traitées
```

---

## 16. Outbox / Inbox

### 16.1 Architecture décision

**Décision :** Utiliser Outbox + Sync Metadata

**Justification :**
- Outbox pour mutations à envoyer (local → remote)
- Sync Metadata pour curseur de pull (remote → local)
- Inbox non nécessaire (pull direct depuis remote)

### 16.2 Outbox Schema

```sql
CREATE TABLE sync_outbox (
  id TEXT PRIMARY KEY,
  mutation_id TEXT UNIQUE NOT NULL,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  processed_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);
```

### 16.3 Sync Metadata Schema

```sql
CREATE TABLE sync_metadata (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  last_sync_version TEXT,
  last_sync_at TEXT,
  remote_count INTEGER,
  local_count INTEGER
);
```

### 16.4 Métadonnées par mutation

```typescript
{
  mutationId: string           // UUID unique
  entityId: string              // ID de l'entité
  entityType: string            // 'product', 'sale', etc.
  operation: string             // 'create', 'update', 'delete'
  payload: any                 // Données complètes
  version: number               // Version de l'entité
  deviceId: string              // ID appareil source
  userId: string                // ID utilisateur
  tenantId: string              // ID tenant
  createdAt: DateTime
  updatedAt: DateTime
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  lastError?: string
}
```

---

## 17. Conflicts

### 17.1 Stratégie par type de donnée

| Entité | Stratégie | Justification |
| ------ | --------- | ------------- |
| **Product** | Optimistic Concurrency + User Resolution | Modifications concurrentes fréquentes |
| **Sale** | Immutable after finalization | Ventes finalisées non modifiables |
| **Client** | Last Write Wins + timestamp | Modifications rares, version simple |
| **Stock** | Domain-specific logic (additive) | Stock ajusté additivement |
| **Settings** | Last Write Wins acceptable | Configuration simple |

### 17.2 Stratégies détaillées

#### Optimistic Concurrency (Product)
```typescript
// Product a un version number
updateProduct(product: Product) {
  const current = await repo.findById(product.id)
  if (current.version !== product.version) {
    throw new ConflictError('Product modified by another device')
  }
  product.version++
  await repo.update(product)
}
```

#### Last Write Wins (Client)
```typescript
updateClient(client: Client) {
  const current = await repo.findById(client.id)
  if (current.updatedAt > client.updatedAt) {
    // Écraser avec version plus récente
    // Log la version écrasée pour audit
  }
  await repo.update(client)
}
```

#### Domain-specific (Stock)
```typescript
adjustStock(productId: string, delta: number) {
  // Utilise des opérations atomiques side-effect free
  // Stock A: +5, Stock B: -3 = +2 net
  // Conflit résolu par addition
}
```

#### Immutable (Sale)
```typescript
finalizeSale(sale: Sale) {
  if (sale.status === SaleStatus.FINALIZED) {
    throw new DomainError('Sale cannot be modified')
  }
  sale.status = SaleStatus.FINALIZED
  await repo.update(sale)
}
```

### 17.3 User Resolution

Pour les conflits critiques (Product), proposer à l'utilisateur :
```
Version locale : Prix = 1000 XAF
Version distante : Prix = 1200 XAF

Options :
[ Garder ma version ] [ Garder version distante ] [ Fusionner manuellement ]
```

---

## 18. Empty Remote Protection

### 18.1 Scénario

```
LOCAL = 500 données
REMOTE = 0 données
```

### 18.2 Procédure d'initialisation

```
1. Login utilisateur
2. Récupérer Tenant ID
3. Vérifier si Tenant existe sur Supabase
4. SI Tenant existe :
   → Récupérer remote_count pour chaque table
   → SI remote_count > 0 :
       → Pull depuis Supabase
       → MERGE avec local (stratégie par entité)
   → SINON (remote vide) :
       → Marquer comme "first sync"
       → Push local vers Supabase
5. SINON (Tenant inexistant) :
   → Créer Tenant sur Supabase
   → Push local vers Supabase
```

### 18.3 Distinction d'état

```typescript
enum TenantState {
  EMPTY = 'empty',           // Aucune donnée locale ni distante
  LOCAL_ONLY = 'local_only', // Données locales seulement
  REMOTE_ONLY = 'remote_only', // Données distantes seulement
  SYNCED = 'synced',         // Données synchronisées
  CONFLICT = 'conflict'       // Conflit détecté
}
```

### 18.4 Protection contre perte

```
SI (remote_count > 0 ET local_count == 0) {
  → PULL depuis Supabase
  → NE PAS écraser local (vide)
  → Initialiser local avec données distantes
}

SI (remote_count == 0 ET local_count > 0) {
  → PUSH vers Supabase
  → NE PAS écraser remote (vide)
  → Initialiser remote avec données locales
}
```

---

## 19. Initial Sync

### 19.1 Flow

```
Login
    ↓
Supabase Auth
    ↓
Récupérer User Profile
    ↓
Récupérer Tenant
    ↓
Vérifier Device ID
    ↓
Initialiser Local DB
    ↓
Sync Metadata initialisation
    ↓
PULL initial (si données distantes)
    ↓
Local hydration
    ↓
Sync ready
```

### 19.2 Évitement des doublons

```
Pour chaque entité :
    ↓
Vérifier si localId existe déjà
    ↓
SI oui :
    → Fusioner avec version distante
    → Conserver remote ID
SINON :
    → Créer nouvelle entité
    → Conserver local ID + remote ID mapping
```

### 19.3 Mapping local ↔ remote

```typescript
interface EntityMapping {
  localId: string
  remoteId: string
  entityType: string
  tenantId: string
  syncedAt: DateTime
}
```

---

## 20. Data Ownership

| Entité | Owner | Tenant | Local Authority | Remote Authority | Editable Offline | Mutable | Recoverable | Synchronizable |
| ------- | ----- | ------ | --------------- | ---------------- | ---------------- | -------- | ----------- | ------------- |
| **User** | System | System | Lecture seule | Lecture seule | NON | NON (sauf profil) | OUI | NON |
| **Tenant** | System | System | Lecture seule | Lecture seule | NON | NON | OUI | NON |
| **Product** | Tenant | Tenant | OUI | OUI | OUI | OUI | OUI | OUI |
| **Client** | Tenant | Tenant | OUI | OUI | OUI | OUI | OUI | OUI |
| **Sale** | Tenant | Tenant | OUI (création) | OUI (lecture seule après finalisation) | OUI (création) | NON (après finalisation) | OUI | OUI |
| **StockMovement** | Tenant | Tenant | OUI | OUI | OUI | OUI | OUI | OUI |
| **Payment** | Tenant | Tenant | OUI | OUI | OUI | NON (après validation) | OUI | OUI |
| **Activity** | System | Tenant | Lecture seule | OUI | NON | NON | OUI | OUI |
| **Settings** | Tenant | Tenant | OUI | OUI | OUI | OUI | OUI | OUI |

---

## 21. Deletion Model

### 21.1 Stratégie cible

**Décision :** Soft delete avec tombstone pour audit

**Justification :**
- Permet la récupération
- Maintient l'historique
- Compatible avec sync multi-device

### 21.2 Implémentation

```sql
-- Tables métier
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE clients ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE sales ADD COLUMN deleted_at TIMESTAMP;

-- Table tombstone
CREATE TABLE tombstones (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  deleted_at TIMESTAMP NOT NULL,
  deleted_by TEXT NOT NULL,
  device_id TEXT NOT NULL
);
```

### 21.3 Suppression offline

```
Suppression locale
    ↓
Soft delete local (deleted_at = NOW())
    ↓
Tombstone locale créé
    ↓
Outbox : mutation "delete"
    ↓
Sync : Soft delete distant + tombstone distant
```

### 21.4 Suppression en ligne

```
Suppression en ligne
    ↓
Soft delete distant (deleted_at = NOW())
    ↓
Tombstone distant créé
    ↓
Pull : Soft delete local + tombstone local
```

### 21.5 Corbeille

**Décision :** Corbeille comme vue UI, pas table séparée

**Justification :**
- Soft delete = corbeille virtuelle
- Tombstone = audit trail
- Évite duplication de données

---

## 22. Account / Tenant Model

### 22.1 Structure

```
User (global)
    ↓
Membership (N)
    ↓
Tenant (N)
    ↓
Roles (par tenant)
    ↓
Permissions (par rôle)
```

### 22.2 Rôles

| Rôle | Permissions |
| ---- | ----------- |
| **Owner** | CRUD tous, settings, users, billing |
| **Admin** | CRUD métier, settings limités |
| **Manager** | CRUD métier, read-only users |
| **Employee** | CRUD métier (ventes), read-only produits/clients |
| **Viewer** | Read-only tout |

### 22.3 Isolation

**Tenant isolation :**
```
RLS PostgreSQL + tenantId sur toutes les tables
```

**Device isolation :**
```
deviceId dans tombstones et audit
```

---

## 23. RLS

### 23.1 Stratégie cible

**Principe :** Même si le frontend est compromis, un utilisateur ne peut pas accéder aux données d'un autre tenant.

### 23.2 Policies

```sql
-- Tenant
CREATE POLICY tenant_select_own ON Tenant
  FOR SELECT TO authenticated
  USING (id = current_tenant_id());

CREATE POLICY tenant_update_own ON Tenant
  FOR UPDATE TO authenticated
  USING (id = current_tenant_id())
  WITH CHECK (id = current_tenant_id());

-- User
CREATE POLICY user_select_tenant ON User
  FOR SELECT TO authenticated
  USING (tenantId = current_tenant_id());

CREATE POLICY user_update_self ON User
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (tenantId = current_tenant_id());

-- Tables métier (Product, Client, Sale, etc.)
CREATE POLICY entity_tenant_all ON {table}
  FOR ALL TO authenticated
  USING (tenantId = current_tenant_id())
  WITH CHECK (tenantId = current_tenant_id());
```

### 23.3 Fonction current_tenant_id()

```sql
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenantId
  FROM "User"
  WHERE id = auth.uid()::text
  LIMIT 1;
$$;
```

---

## 24. Business Logic

### 24.1 Localisation

**Règles qui doivent quitter les composants React :**

| Règle | Localisation cible |
| ----- | ------------------ |
| Calcul total vente | Domain (Sale.calculateTotal()) |
| Gestion stock | Domain (Product.adjustStock()) |
| Validation commande | Use Case (CreateSaleUseCase) |
| Permissions | Application (AuthService) |
| Règles de paiement | Domain (Payment.validate()) |

### 24.2 Examples

**Calcul total vente :**
```typescript
// Domain Layer
class Sale {
  calculateTotal(): Money {
    return this.lines.reduce((total, line) => 
      total.add(line.price.multiply(line.quantity.value)), 
      new Money(0, 'XAF')
    )
  }
}
```

**Gestion stock :**
```typescript
// Domain Layer
class Product {
  adjustStock(delta: Quantity): void {
    const newStock = this.stock.add(delta)
    if (newStock.value < 0) {
      throw new DomainError('Stock cannot be negative')
    }
    this.stock = newStock
  }
}
```

---

## 25. Reusable Contextual Forms

### 25.1 Principe

> Une action nécessaire à un workflow doit pouvoir être réalisée depuis le contexte actuel de l'utilisateur.

### 25.2 Exemple

```
Sales Screen
├── Sélectionner Client
│   ├── Liste clients existants
│   └── + Créer nouveau client (modale)
│       └── Même CreateClientUseCase
│       └── Même ClientRepository
```

### 25.3 Architecture

```
CreateClientModal
    ↓
CreateClientUseCase
    ↓
ClientRepository (interface)
    ↓
Local/Remote Repositories
```

**Important :** Le formulaire de création de client est le même qu'il soit lancé depuis Sales, Clients, ou ailleurs.

---

## 26. State Management

### 26.1 Stratégie cible

**Décision :** React Context + TanStack Query (React Query)

**Justification :**
- React Context : États globaux (auth, tenant, thème)
- TanStack Query : Server state, cache, synchronisation

### 26.2 Rôles

| Type de state | Solution | Usage |
| ------------- | -------- | ----- |
| **UI state** | useState (local) | Ouverture modale, navigation, formulaires |
| **Domain state** | React Context | User courant, tenant actif, thème |
| **Server state** | TanStack Query | Données fetchées (products, clients, sales) |
| **Persistent local state** | Local DB | Données métier (products, clients, sales) |
| **Sync state** | React Context | Sync status, conflicts, offline status |

### 26.3 Exemple

```typescript
// Auth Context
const AuthContext = createContext<{
  user: User | null
  tenant: Tenant | null
  login: (credentials) => Promise<void>
  logout: () => Promise<void>
}>()

// TanStack Query
const { data: products } = useQuery({
  queryKey: ['products', tenantId],
  queryFn: () => productRepository.findByTenant(tenantId)
})
```

---

## 27. Internationalization

### 27.1 Système

**Langues initiales :**
- Français (fr)
- Anglais (en)

**Structure des clés :**
```json
{
  "products": {
    "create": "Créer un produit",
    "empty": "Aucun produit",
    "list": "Liste des produits"
  },
  "sales": {
    "create": "Nouvelle vente",
    "total": "Total"
  },
  "auth": {
    "invalidCredentials": "Identifiants invalides",
    "sessionExpired": "Session expirée"
  }
}
```

### 27.2 Localisation

```
src/locales/
├── fr.json
├── en.json
└── index.ts
```

### 27.3 Usage

```typescript
import { useTranslation } from 'react-i18next'

function ProductList() {
  const { t } = useTranslation()
  return <h1>{t('products.list')}</h1>
}
```

---

## 28. Error Architecture

### 28.1 Trois niveaux

```typescript
// Technical Error
class TechnicalError extends Error {
  code: string
  originalError: Error
}

// Domain Error
class DomainError extends Error {
  code: string
  context: any
}

// User-facing Error
class UserError extends Error {
  message: string
  code: string
}
```

### 28.2 Mapping

```
DATABASE_TIMEOUT
    ↓
TechnicalError('DB_TIMEOUT')
    ↓
DomainError('SYNC_FAILED')
    ↓
UserError('Impossible de synchroniser pour le moment.')
```

### 28.3 Handlers

```typescript
class ErrorHandler {
  handle(error: Error): UserError {
    if (error instanceof TechnicalError) {
      return this.mapTechnical(error)
    }
    if (error instanceof DomainError) {
      return this.mapDomain(error)
    }
    return new UserError('Une erreur est survenue', 'UNKNOWN')
  }
}
```

---

## 29. Security Architecture

### 29.1 Couches

| Couche | Mesure |
| ----- | ------ |
| **Authentication** | Supabase Auth, sessions, tokens |
| **Authorization** | RLS, roles, permissions |
| **Input validation** | Zod, DTO validation |
| **Output validation** | Typing strict, sanitization |
| **Secrets management** | Supabase secrets, jamais dans frontend |
| **Session security** | Expiration, revalidation, device binding |
| **XSS protection** | Content Security Policy, sanitization |
| **CSRF** | SameSite cookies, tokens |
| **Rate limiting** | Supabase rate limiting |
| **File validation** | Type, size, virus scan |
| **Audit logging** | Activity table, tombstones |
| **Backups** | Supabase automated backups |

### 29.2 Secrets

**Règle :** Jamais de secrets dans le frontend

```
Env vars (serveur uniquement)
    ↓
Supabase Edge Functions
    ↓
API sécurisée
```

---

## 30. Files / Storage

### 30.1 Architecture

```
Metadata (base de données)
    ↓
File Reference (URL)
    ↓
Supabase Storage
    ↓
Fichier binaire
```

### 30.2 Types de fichiers

| Type | Destination | Usage |
| ---- | ----------- | ----- |
| **Images produits** | Supabase Storage | Catalogue |
| **Exports PDF** | Supabase Storage | Archives |
| **Backups** | Supabase Storage | Sauvegardes |
| **Documents** | Supabase Storage | Factures, reçus |

### 30.3 Path structure

```
storage/
├── products/
│   ├── {productId}/
│   │   └── image.jpg
├── exports/
│   ├── {saleId}/
│   │   └── invoice.pdf
└── backups/
    └── {tenantId}/
        └── backup-{date}.json
```

---

## 31. Notifications

### 31.1 Abstraction

```typescript
interface INotificationService {
  send(title: string, body: string): Promise<void>
  subscribe(topic: string): Promise<void>
  unsubscribe(topic: string): Promise<void>
}
```

### 31.2 Adapters

| Plateforme | Adapter | Provider |
| --------- | ------- | -------- |
| **Web** | WebNotificationAdapter | Web Push API |
| **Android** | FCMNotificationAdapter | Firebase Cloud Messaging |
| **iOS** | APNsNotificationAdapter | Apple Push Notification Service |
| **Desktop** | LocalNotificationAdapter | Desktop notifications |

### 31.3 Types de notifications

| Type | Déclencheur |
| ---- | ----------- |
| **Sync success** | Sync terminé avec succès |
| **Sync failure** | Sync échoué |
| **Conflict** | Conflit détecté |
| **Low stock** | Stock sous seuil critique |
| **New sale** | Nouvelle vente créée |

---

## 32. Realtime

### 32.1 Rôle

**Principe :** Realtime n'est PAS le moteur offline-first. C'est un complément pour les notifications temps réel.

### 32.2 Architecture

```
Supabase Realtime
    ↓
Événement (INSERT/UPDATE/DELETE)
    ↓
Device notification
    ↓
Pull changed data
    ↓
Local DB update
    ↓
UI refresh
```

### 32.3 Tables Realtime

**Activées :**
- Product (stock changes)
- Sale (new sales)
- Tenant (settings)

**Désactivées :**
- SyncOutbox (interne)
- Activity (audit)

---

## 33. AI Architecture

### 33.1 Architecture

```
Application
    ↓
AI Service (abstraction)
    ↓
AI Gateway / Backend (Edge Function)
    ↓
Provider (OpenAI / Gemini / Anthropic)
```

### 33.2 Principe

```
AI
    ↓
Tools (contrôlés)
    ↓
Accès données limité
```

**PAS :**
```
AI
    ↓
Full database access ❌
```

### 33.3 Tools métier

```typescript
const aiTools = [
  {
    name: 'getSalesSummary',
    description: 'Récupérer le résumé des ventes',
    function: async () => {
      return await saleRepository.getSummary(tenantId)
    }
  },
  {
    name: 'getLowStockProducts',
    description: 'Récupérer les produits en rupture de stock',
    function: async () => {
      return await productRepository.getLowStock(tenantId)
    }
  },
  {
    name: 'getRevenueTrend',
    description: 'Récupérer la tendance des revenus',
    function: async () => {
      return await saleRepository.getRevenueTrend(tenantId)
    }
  }
]
```

---

## 34. Platform Architecture

### 34.1 Partage de logique

**Commun :**
- Domain Layer
- Application Layer
- Repository interfaces
- Use Cases
- UI Components

**Spécifique :**
- Database adapters (SQLite vs IndexedDB)
- File adapters
- Notification adapters
- Platform-specific features

### 34.2 Platform Adapter

```typescript
interface IPlatformAdapter {
  getPlatform(): Platform
  getDeviceInfo(): DeviceInfo
}

class WebPlatformAdapter implements IPlatformAdapter {
  getPlatform(): Platform {
    return 'web'
  }
}

class AndroidPlatformAdapter implements IPlatformAdapter {
  getPlatform(): Platform {
    return 'android'
  }
}
```

### 34.3 Services

```typescript
interface IFileService {
  saveFile(file: File, path: string): Promise<string>
  readFile(path: string): Promise<File>
  shareFile(path: string): Promise<void>
}

class WebFileService implements IFileService {
  // Blob, File API
}

class AndroidFileService implements IFileService {
  // Capacitor File API
}
```

---

## 35. Design System

### 35.1 Principes

**Mobile-first :** Design pour mobile en premier, responsive pour desktop

**Accessible :** WCAG AA minimum, contrast, keyboard navigation

**Premium :** Typography soignée, espacements généreux, micro-interactions

**Professional :** Layout cohérent, feedback utilisateur clair

**Fluid :** Animations fluides, transitions naturelles

### 35.2 Tokens

```typescript
const tokens = {
  colors: {
    primary: '#0066FF',
    secondary: '#00CC99',
    success: '#00CC66',
    warning: '#FFCC00',
    error: '#FF3366',
    neutral: {
      50: '#F5F5F5',
      100: '#E0E0E0',
      // ...
    }
  },
  typography: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    // ...
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    // ...
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    // ...
  }
}
```

### 35.3 Components

**Forms :**
- Input, Select, Textarea
- Validation
- Error states

**Dialogs :**
- Modal, Alert, Confirm
- Backdrop
- Transitions

**Tables :**
- Responsive
- Sortable
- Filterable
- Pagination

**Navigation :**
- Sidebar
- Tabs
- Breadcrumbs

**Feedback :**
- Loading spinners
- Progress bars
- Toast notifications
- Empty states

---

## 36. Observability

### 36.1 Événements observables

| Événement | Niveau | Contexte |
| -------- | ----- | -------- |
| User logged in | info | Tenant, device |
| Data changed | debug | Entity, operation |
| Sync started | info | Queue size |
| Sync succeeded | info | Items processed |
| Sync failed | error | Error, attempts |
| Conflict detected | warning | Entity, conflict |
| Data pulled | info | Items count |
| Device offline | warning | Last online |
| Database error | error | Query, context |

### 36.2 Diagnostic divergence

```
Tool : Diagnostic Service
├── Compare local vs remote counts
├── Identify missing entities
├── Detect conflicts
└── Generate report
```

---

## 37. Testing Architecture

### 37.1 Stratégie

| Type | Focus | Tools |
| ---- | ----- | ----- |
| **Unit** | Domain logic, Use Cases | Vitest |
| **Integration** | Repositories, Sync | Vitest + MSW |
| **Repository** | DB operations | Vitest + in-memory DB |
| **Sync** | Sync engine, conflicts | Vitest + test fixtures |
| **Auth** | Authentication flow | Vitest + test users |
| **E2E** | Workflows complets | Playwright |
| **Cross-device** | Multi-device sync | Playwright + containers |
| **Offline** | Offline behavior | Playwright + network throttling |
| **Recovery** | Crash recovery | Vitest + test scenarios |
| **Security** | RLS, permissions | Vitest + Supabase test project |

### 37.2 Scénarios critiques

```
Machine A → Machine B
├── Create on A
├── Sync to remote
├── Pull on B
└── Verify data

Offline → Online
├── Create offline
├── Queue mutations
├── Go online
└── Verify sync

Remote empty
├── Local has data
├── Remote empty
└── Verify protection

Local empty
├── Remote has data
├── Local empty
└── Verify pull

Concurrent edits
├── Edit same entity on A and B
├── Both sync
└── Verify conflict resolution

Logout/login
├── Logout with data
├── Login again
└── Verify data recovery

App restart
├── With pending sync
├── Restart app
└── Verify queue recovery

Sync failure
├── Network error
├── Retry mechanism
└── Verify backoff
```

---

## 38. Git / CI / CD

### 38.1 Stratégie de branches

```
main          → Production releases
develop       → Integration
feature/*     → New features
fix/*         → Bug fixes
refactor/*    → Refactoring
chore/*       → Maintenance
```

### 38.2 CI/CD Pipeline

```
Pull Request
    ↓
Lint (ESLint, Prettier)
    ↓
Typecheck (tsc --noEmit)
    ↓
Tests (Vitest)
    ↓
Build (Vite build)
    ↓
Security (npm audit, Snyk)
    ↓
Deploy (Supabase migration + Vercel/Netlify)
```

---

## 39. Documentation Architecture

### 39.1 Documents requis

| Document | Rôle |
| -------- | ---- |
| **PROJECT.md** | Vue d'ensemble, objectifs, technologies |
| **ARCHITECTURE.md** | Architecture complète (ce document) |
| **DOMAIN.md** | Modèle métier, entités, règles |
| **DATA-MODEL.md** | Schéma de données détaillé |
| **DATA-FLOW.md** | Flux de données détaillé |
| **AUTH.md** | Authentification détaillée |
| **SYNC.md** | Synchronisation détaillée |
| **SECURITY.md** | Sécurité détaillée |
| **API.md** | API interne/externe |
| **UI-DESIGN.md** | Design system, UX patterns |
| **I18N.md** | Internationalisation |
| **PLATFORM.md** | Plateforme-specific |
| **TESTING.md** | Stratégie de tests |
| **DEPLOYMENT.md** | Déploiement |
| **AI.md** | Architecture IA |

---

## 40. Comparaison avec l'Architecture Actuelle

| Domaine | Actuel | Cible | Migration nécessaire |
| ------- | ------ | ----- | -------------------- |
| **Auth** | localStorage local + Supabase optionnel | Supabase Auth obligatoire avec cache local | OUI - Réfacteur auth service |
| **Local DB** | localStorage uniquement | SQLite/IndexedDB avec abstraction | OUI - Implémenter DB adapter |
| **Sync** | Push uniquement, unidirectionnel | Push + Pull bidirectionnel avec conflits | OUI - Refactor complet sync engine |
| **Identity** | storageAccountId local | Auth User + Profile + Membership + Tenant | OUI - Implémenter nouveau modèle |
| **Tenant** | Basique | Multi-tenant avec RLS complet | OUI - Améliorer RLS |
| **State** | localStorage + context | Context + TanStack Query + Local DB | OUI - Migrer vers Query |
| **Security** | Hash passwords en localStorage | Supabase Auth + RLS + secrets backend | OUI - Migrer secrets |
| **Storage** | Local files | Supabase Storage + platform adapters | OUI - Implémenter Storage |
| **AI** | Aucun | AI Service + Edge Functions | OUI - Nouveau système |

---

## 41. Migration Safety

### 41.1 Stratégie progressive

```
CURRENT SYSTEM
    ↓
COMPATIBILITY LAYER
    ↓
NEW ARCHITECTURE
    ↓
MIGRATION
    ↓
VALIDATION
    ↓
OLD SYSTEM REMOVED
```

### 41.2 Préservation des données

**Données à préserver :**
- Utilisateurs existants
- Produits
- Clients
- Ventes
- Paramètres
- Données offline
- Historiques

### 41.3 Étapes de migration

```
Phase 1 : Identity Migration
├── Migrer users vers Supabase Auth
├── Créer profils User
├── Créer Tenants
└── Créer Memberships

Phase 2 : Data Migration
├── Migrer produits vers Supabase
├── Migrer clients vers Supabase
├── Migrer ventes vers Supabase
└── Conserver local comme cache

Phase 3 : Architecture Migration
├── Implémenter nouveaux repositories
├── Implémenter sync engine bidirectionnel
├── Migrer state management
└── Migrer UI components

Phase 4 : Validation
├── Tests cross-device
├── Tests offline
├── Tests recovery
└── Validation utilisateur

Phase 5 : Cleanup
├── Supprimer localStorage legacy
├── Supprimer code obsolète
└── Nettoyer Prisma
```

---

## 42. Architectural Decisions

### 42.1 Décisions définitives

#### BLOCKING

1. **Identity Model :** Supabase Auth comme source de vérité avec Profile + Membership + Tenant
2. **Local Database :** SQLite/IndexedDB avec abstraction (DatabaseAdapter)
3. **Sync Strategy :** Bidirectionnel (push + pull) avec Outbox + Sync Metadata
4. **Conflict Strategy :** Optimistic concurrency pour Product, Last Write Wins pour Client, Immutable pour Sale
5. **Tenant Model :** Multi-tenant avec RLS obligatoire sur toutes les tables
6. **Soft Delete :** Soft delete avec tombstone pour audit

#### IMPORTANT

7. **Realtime :** Activé pour notifications time-real uniquement (Product stock, Sales)
8. **Notifications :** Abstraction INotificationService avec adapters par plateforme
9. **Storage :** Supabase Storage pour tous les fichiers (images, exports, backups)
10. **AI Gateway :** Edge Functions avec Tools contrôlés pour accès données limité

#### OPTIONAL

11. **OAuth Providers :** Google + Apple (optionnels, Phase 2)
12. **Magic Link :** Alternative email (optionnel, Phase 2)
13. **Activity Remote :** Table Activity dans Supabase (optionnel, Phase 2)
14. **Trash Remote :** Table TrashItem dans Supabase (optionnel, Phase 2)

#### FUTURE

15. **Plans :** Tables Plan et Subscription (monétisation, Phase 3)
16. **Advanced Analytics :** Table Analytics + dashboards (Phase 3)
17. **Reports Custom :** Générateur de rapports personnalisés (Phase 3)

---

## 43. Open Questions

| Question | Pourquoi non résolu |
| -------- | ------------------ |
| **Provider IA** | Dépendra du budget et des besoins spécifiques |
| **OAuth Google/Apple** | Dépendra des besoins business et des ressources |
| **Complexité Analytics** | Dépendra des besoins métier à définir |

---

## 44. Risks

| Risque | Impact | Atténuation |
| ------ | ------ | ------------ |
| **Complexité migration** | HIGH | Migration progressive, tests, rollback possible |
| **Performance SQLite** | MEDIUM | Indexation, lazy loading, benchmarking |
| **Bug sync engine** | HIGH | Tests exhaustifs, monitoring, rollback |
| **Rétention utilisateurs** | MEDIUM | Communication claire, support pendant migration |
| **Compatibilité mobile** | MEDIUM | Tests sur devices réels, gradual rollout |

---

## 45. Migration Complexity

| Zone | Complexité | Justification |
| ---- | ---------- | -------------- |
| **Auth** | HIGH | Changement fondamental du modèle d'identité |
| **Local DB** | HIGH | Nouvelle couche d'infrastructure |
| **Sync** | VERY HIGH | Refactor complet du moteur de sync |
| **Identity** | HIGH | Nouveau modèle multi-tenant |
| **Tenant** | MEDIUM | RLS déjà partiellement en place |
| **State** | MEDIUM | Migration vers TanStack Query |
| **Security** | MEDIUM | Migration des secrets |
| **Storage** | LOW | Ajout Supabase Storage |
| **AI** | LOW | Nouveau système indépendant |

---

## Conclusion

Cette architecture cible définit une Casier d'Or professionnelle, robuste et scalable. Elle résout les problèmes identifiés dans les audits (authentification locale, sync unidirectionnel, conflits non gérés) tout en préservant les principes offline-first et local-first.

**Prochaines étapes :**
1. Validation de cette architecture avec les parties prenantes
2. Conception détaillée du modèle de données cible
3. Conception détaillée de l'authentification cible
4. Conception détaillée de la base de données locale cible
5. Conception détaillée du moteur de sync cible
6. Conception détaillée de Supabase cible
7. Plan de migration détaillé
