# Roadmap synchronisation Casier d'Or v3

## État actuel (prototype)

- Données métier en `localStorage` avec scope par compte (`utils/accountStorage.ts`)
- File d'attente locale FIFO : `utils/syncQueue.ts` (`casier_sync_queue`)
- Schéma Prisma de référence : `prisma/schema.prisma`

## Prochaines étapes

1. Configurer `DATABASE_URL` et `npx prisma migrate dev`
2. API REST ou tRPC : push/pull par `tenantId`
3. Worker : `peekSyncQueue` → POST → `dequeueSyncItem` sur succès
4. Résolution conflits : `updatedAt` + stratégie « dernier gagnant » ou merge manuel
5. Sync planifiée (ex. toutes les 24 h) + indicateur dans Paramètres

## Mapping localStorage ↔ Prisma

| localStorage (STORAGE_KEYS) | Modèle Prisma |
|---------------------------|---------------|
| casier_products | Product |
| casier_clients | Client |
| casier_sales | Sale |
| casier_settings | Tenant + métadonnées |

Chaque enregistrement local doit conserver `localId` jusqu'à réception de l'`id` serveur.
