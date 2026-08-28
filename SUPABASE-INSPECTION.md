# Casier d'Or — Supabase Inspection Report

## Date d'inspection
2026-01-XX

## Project Supabase
- **Org:** ffibfgdtvsyrdxftalku
- **Project:** Casier d'Or
- **Project Ref:** muvwlimhzswwhdpiqxvj

---

## 1. Tables réellement déployées

### Tables PRÉSENTES

| Table | Statut | Observation |
| ----- | ------ | ----------- |
| **Tenant** | ✅ PRÉSENTE | Structure identique au schéma attendu |
| **User** | ✅ PRÉSENTE | Structure identique au schéma attendu |
| **Product** | ✅ PRÉSENTE | Structure identique sauf `deletedAt` manquant |
| **Client** | ✅ PRÉSENTE | Structure identique sauf `deletedAt` manquant |
| **Sale** | ✅ PRÉSENTE | Structure identique sauf `deletedAt` manquant |
| **SyncOutbox** | ✅ PRÉSENTE | Structure identique au schéma attendu |

### Tables ABSENTES

| Table | Statut | Impact |
| ----- | ------ | ------ |
| **Activity** | ❌ ABSENTE | Journal d'audit non disponible en distant |
| **TrashItem** | ❌ ABSENTE | Corbeille centralisée non disponible en distant |
| **Plan** | ❌ ABSENTE | Plans tarifaires non implémentés |
| **Subscription** | ❌ ABSENTE | Abonnements non implémentés |

---

## 2. Structure détaillée des tables présentes

### Tenant

| Colonne | Type | Nullable | Default | Observations |
| ------- | ---- | -------- | ------- | ------------ |
| id | text | NO | null | Primary key |
| name | text | NO | null | Nom de l'établissement |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP | Timestamp création |
| updatedAt | timestamp without time zone | NO | null | Timestamp mise à jour |

**Observation:** ✅ Structure correcte pour multi-tenancy

---

### User

| Colonne | Type | Nullable | Default | Observations |
| ------- | ---- | -------- | ------- | ------------ |
| id | text | NO | null | Primary key (lié à Supabase Auth) |
| tenantId | text | NO | null | Foreign key vers Tenant |
| email | text | NO | null | Email utilisateur |
| passwordHash | text | NO | null | Hash du mot de passe |
| role | text | NO | null | Rôle (admin, user, etc.) |
| displayName | text | YES | null | Nom affiché |
| storageAccountId | text | YES | null | ID pour isolation localStorage |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP | Timestamp création |
| updatedAt | timestamp without time zone | NO | null | Timestamp mise à jour |

**Observation:** ✅ Structure correcte pour authentification multi-tenant

---

### Product

| Colonne | Type | Nullable | Default | Observations |
| ------- | ---- | -------- | ------- | ------------ |
| id | text | NO | null | Primary key |
| tenantId | text | NO | null | Foreign key vers Tenant |
| sku | text | NO | null | SKU produit |
| name | text | NO | null | Nom produit |
| price | double precision | NO | null | Prix |
| stock | integer | NO | 0 | Stock actuel |
| criticalThreshold | integer | NO | 10 | Seuil critique |
| type | text | YES | null | Type produit |
| active | boolean | NO | true | Actif ou non |
| localId | text | YES | null | ID local |
| updatedAt | timestamp without time zone | NO | null | Timestamp mise à jour |

**⚠️ MANQUE:** `deletedAt` (timestamp) - présent dans Prisma mais PAS dans Supabase

**Observation:** Soft delete via `deletedAt` n'est pas implémenté en distant

---

### Client

| Colonne | Type | Nullable | Default | Observations |
| ------- | ---- | -------- | ------- | ------------ |
| id | text | NO | null | Primary key |
| tenantId | text | NO | null | Foreign key vers Tenant |
| code | text | YES | null | Code client |
| name | text | NO | null | Nom client |
| phone | text | YES | null | Téléphone |
| localId | text | YES | null | ID local |
| updatedAt | timestamp without time zone | NO | null | Timestamp mise à jour |

**⚠️ MANQUE:** `deletedAt` (timestamp) - présent dans Prisma mais PAS dans Supabase

**Observation:** Soft delete via `deletedAt` n'est pas implémenté en distant

---

### Sale

| Colonne | Type | Nullable | Default | Observations |
| ------- | ---- | -------- | ------- | ------------ |
| id | text | NO | null | Primary key |
| tenantId | text | NO | null | Foreign key vers Tenant |
| saleNumber | text | NO | null | Numéro de vente |
| total | double precision | NO | null | Total vente |
| status | text | NO | null | Statut |
| date | timestamp without time zone | NO | null | Date vente |
| localId | text | YES | null | ID local |
| payload | text | YES | null | Données JSON supplémentaires |
| syncedAt | timestamp without time zone | YES | null | Timestamp sync |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP | Timestamp création |

**⚠️ MANQUE:** `deletedAt` (timestamp) - présent dans Prisma mais PAS dans Supabase

**Observation:** Soft delete via `deletedAt` n'est pas implémenté en distant

---

### SyncOutbox

| Colonne | Type | Nullable | Default | Observations |
| ------- | ---- | -------- | ------- | ------------ |
| id | text | NO | null | Primary key |
| tenantId | text | NO | null | Foreign key vers Tenant |
| entity | text | NO | null | Entité concernée |
| operation | text | NO | null | Opération (create/update/delete) |
| payload | text | NO | null | Données JSON |
| attempts | integer | NO | 0 | Nombre de tentatives |
| lastError | text | YES | null | Dernière erreur |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP | Timestamp création |

**Observation:** ✅ Structure correcte pour sync outbox

---

## 3. Comparaison Code vs Réalité

### Prisma Schema vs Supabase Réel

| Table | Prisma | Supabase | Écart |
| ----- | ------ | -------- | ----- |
| Tenant | ✅ défini | ✅ présent | ✅ MATCH |
| User | ✅ défini | ✅ présent | ✅ MATCH |
| Product | ✅ défini avec deletedAt | ✅ présent SANS deletedAt | ⚠️ COLONNE MANQUANTE |
| Client | ✅ défini avec deletedAt | ✅ présent SANS deletedAt | ⚠️ COLONNE MANQUANTE |
| Sale | ✅ défini avec deletedAt | ✅ présent SANS deletedAt | ⚠️ COLONNE MANQUANTE |
| SyncOutbox | ✅ défini | ✅ présent | ✅ MATCH |
| Activity | ✅ défini | ❌ absent | ❌ TABLE MANQUANTE |
| TrashItem | ✅ défini | ❌ absent | ❌ TABLE MANQUANTE |
| Plan | ✅ défini | ❌ absent | ❌ TABLE MANQUANTE |
| Subscription | ✅ défini | ❌ absent | ❌ TABLE MANQUANTE |

---

## 4. Fonctions et Triggers

### Fonctions (attendues mais non inspectées)
- `current_tenant_id()` - Fonction pour résoudre le tenant courant
- `handle_auth_user_created()` - Trigger pour créer Tenant+User à l'inscription

**Statut:** À vérifier via interface Supabase

### Triggers (attendus mais non inspectés)
- `on_auth_user_created` - Trigger sur auth.users

**Statut:** À vérifier via interface Supabase

---

## 5. RLS Policies

### Policies attendues (selon migration locale)

| Table | Policy | Action | Statut |
| ----- | ------ | ------ | ------ |
| Tenant | tenant_select_own | SELECT | À vérifier |
| Tenant | tenant_update_own | UPDATE | À vérifier |
| User | user_select_tenant | SELECT | À vérifier |
| User | user_update_self | UPDATE | À vérifier |
| Product | product_tenant_all | ALL | À vérifier |
| Client | client_tenant_all | ALL | À vérifier |
| Sale | sale_tenant_all | ALL | À vérifier |
| SyncOutbox | sync_outbox_tenant_all | ALL | À vérifier |

**Statut:** À vérifier via interface Supabase

---

## 6. Données existantes

### Utilisateurs Supabase Auth
**À renseigner:** Combien d'utilisateurs ?

### Rows par table
**À renseigner:**
- Tenant: ? rows
- User: ? rows
- Product: ? rows
- Client: ? rows
- Sale: ? rows
- SyncOutbox: ? rows

---

## 7. Conclusions

### ✅ Ce qui fonctionne
1. **Multi-tenancy** : Structure Tenant + User correcte
2. **Sync outbox** : Table SyncOutbox présente et structurée
3. **Isolation** : tenantId présent sur toutes les tables métier

### ⚠️ Ce qui est partiel
1. **Soft delete** : Colonnes `deletedAt` manquantes dans Product, Client, Sale
   - Impact : Suppression gérée via `active: false` uniquement
   - Risque : Pas de traçabilité des suppressions

### ❌ Ce qui est absent
1. **Activity logging** : Table Activity non déployée
   - Impact : Journal d'audit distant non disponible
2. **Trash centralisé** : Table TrashItem non déployée
   - Impact : Corbeille centralisée non disponible
3. **Plans/Subscription** : Tables Plan et Subscription non déployées
   - Impact : Monétisation non implémentée

---

## 8. Recommandations pour Phase 3

### Immédiat
1. **Décider :** Soft delete via `deletedAt` ou via `active: false` ?
2. **Décider :** Activity logging nécessaire en distant ?
3. **Décider :** TrashItem nécessaire en distant ?

### Architecture cible
1. **Soft delete :** Ajouter `deletedAt` si traçabilité des suppressions requise
2. **Activity :** Créer table Activity si audit distant requis
3. **Sync v2 :** Réévaluer SyncOutbox vs nouvelle stratégie de sync

---

## 9. État actuel vs Architecture cible

### État actuel
```
Supabase
├── Tenant ✅
├── User ✅
├── Product ⚠️ (sans deletedAt)
├── Client ⚠️ (sans deletedAt)
├── Sale ⚠️ (sans deletedAt)
├── SyncOutbox ✅
└── (Activity, TrashItem, Plan, Subscription) ❌ absents
```

### Architecture cible (à définir en Phase 3)
```
Supabase
├── Tenant
├── User
├── Product (+ deletedAt ?)
├── Client (+ deletedAt ?)
├── Sale (+ deletedAt ?)
├── SyncOutbox (ou nouveau système)
├── Activity (?)
├── TrashItem (?)
├── Plan (?)
└── Subscription (?)
```

---

## 10. Suivi

- **Date inspection:** 2026-01-XX
- **Prochaine étape:** Phase 3 - Conception architecture cible
- **Décisions à prendre:** Soft delete, Activity logging, Trash centralisé
