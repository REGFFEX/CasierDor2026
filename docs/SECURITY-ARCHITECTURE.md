# Architecture de sécurité — Casier d'Or v3

## Modules

| Fichier | Rôle |
|---------|------|
| `utils/cryptoVault.ts` | Primitives Web Crypto (PBKDF2, AES-GCM) |
| `utils/recoveryKeyService.ts` | Clés de récupération (création, validation, fichiers) |
| `utils/securityUtils.ts` | Façade + verrouillage compte |
| `utils/authService.ts` | Mots de passe utilisateurs (PBKDF2 310k) |

## Clé de récupération

- **256 bits** d'entropie (`crypto.getRandomValues`)
- Format affiché : `CDOR-XXXX-…-CCCC` (checksum intégré)
- **Jamais stockée en clair** dans `localStorage` — uniquement `keyHash` + `keySalt` (PBKDF2 600k + pepper installation + accountId)
- Comparaison en **temps constant** (`timingSafeEqual`)

## Fichier `.key` (v2)

```json
{
  "v": 2,
  "format": "casierdor-recovery-key",
  "kdf": { "iterations": 600000, "salt": "..." },
  "cipher": { "alg": "AES-256-GCM", "iv": "...", "data": "..." },
  "deviceWrap": { "salt": "...", "iv": "...", "data": "..." }
}
```

- **cipher** : métadonnées chiffrées avec la clé de récupération (PBKDF2 600k)
- **deviceWrap** (optionnel) : copie de la clé chiffrée avec secret d'installation — auto-remplissage sur le même appareil uniquement
- **v1** (ancien) : AES CryptoJS + clé maître fixe dans le code — encore lisible pour migration

## Mots de passe utilisateurs

- Format : `v2.pbkdf2$310000$salt$hash`
- Migration automatique depuis l'ancien `btoa(password + salt)` à la prochaine connexion réussie

## Limites (application offline)

1. Secret d'installation dans `localStorage` — protège le deviceWrap, pas contre un accès root complet à l'appareil
2. Pas de HSM / TEE — standard pour une PWA/desktop locale
3. Clé fondateur universelle et clés employé one-shot : **hors scope**, prévus pour une couche serveur ultérieure
4. La sécurité maximale absolue nécessitera une base de données + authentification serveur (horizon v2/v3 du plan)

## Migration

Au démarrage (`initializeStore`) : migration automatique des anciennes clés en clair vers `keyHash`.

Les anciens fichiers `.key` v1 restent importables une fois.
