# 📋 Casier d'Or — Plan de Développement

> **Règle d'or**: Chaque fonctionnalité doit aller jusqu'au bout. Pas de code statique ou à moitié fait. Quand on ajoute une fonctionnalité, on l'ajoute d'abord à cette liste si elle n'y est pas, puis on la coche quand elle est **réellement** terminée et vérifiée.

---

## ✅ Terminé

- [x] Configuration Supabase (URL + anon key) — secrets livrés au conteneur
- [x] Design system Crystal iOS 15 (glassmorphism, boutons, cartes)
- [x] **Refonte Module Paramètres** — Navigation par sections (15 cartes, chaque bloc sur sa propre vue avec bouton retour)
- [x] **Dashboard — Bloc "Accès rapide"** — Bouton changement de vue (grille ↔ liste) + bouton plier/déplier
- [x] **Dashboard — Bloc "Tous les accès"** — Icônes compactes, accès direct à tous les modules
- [x] **Header — Photo de profil utilisateur** — Avatar utilisateur affiché à côté du logo entreprise
- [x] **Remplacement des emojis par de vraies icônes** (Lucide) — NewSale, PermissionsPage, SettingsPage nettoyés

---

## 🔄 En cours

- [ ] **Boutons arrondis** style iOS 15 — vérifier et corriger les boutons carrés restants (rounded-lg → rounded-2xl/rounded-full)

---

## 📌 À faire — Priorité 1 (Core UX)

- [ ] **Champs de contact (téléphone, email, WhatsApp)**
  - [ ] Séparer les champs: téléphone, email, WhatsApp (3 champs distincts)
  - [ ] Afficher les 3 champs directement, vides si non renseignés
  - [ ] Appliquer dans: clients, utilisateurs, et tous les modules concernés

---

## 📌 À faire — Priorité 2 (Modules métier)

- [ ] **Module Historique — Amélioration des exports**
  - [ ] Menu 3 points sur chaque élément (reçus, exports, etc.)
  - [ ] Choix du format de téléchargement (XLSX, PDF)
  - [ ] Option: télécharger plusieurs éléments en ZIP (tous formats)
  - [ ] Vrais fichiers Excel XLSX (pas CSV), bien formatés et lisibles
  - [ ] Fichiers PDF propres
- [ ] **Module Corbeille — Améliorations**
  - [ ] Toutes les suppressions doivent passer par la corbeille d'abord
  - [ ] Vérification de conflits avant restauration
  - [ ] Tout doit être restaurable
- [ ] **Module Activité — Logs complets**
  - [ ] Afficher tous les logs: créations, suppressions, imports, exports
  - [ ] Logs en termes simples et lisibles
- [ ] **Module Utilisateurs — Permissions par module**
  - [ ] Configuration des modules accessibles par utilisateur
  - [ ] Permissions par module et par endroit
  - [ ] Connexion avec la gestion des modules

---

## 📌 À faire — Priorité 3 (Auth & Sync)

- [ ] **Réinitialisation de mot de passe** — Réparer le flux
- [ ] **Connexion Google et Apple** — Réparer via Supabase OAuth
  - [ ] But: sauvegarder le compte pour retrouver les données sur d'autres appareils
  - [ ] Pousser les sauvegardes de transfert vers la base de données
  - [ ] Option de sauvegarde cloud dans les paramètres

---

## 📌 À faire — Priorité 4 (Logistique & Types)

- [ ] **Refonte des types de produits**
  - [ ] "Casier" n'est plus un type de produit — c'est un type de conteneur
  - [ ] Types de produits: boissons, accessoires, autres
  - [ ] Types de conteneurs: casier, carton, etc. (paramétrables)
  - [ ] Configurer le nombre de produits par conteneur
  - [ ] Calcul logistique: valeur du conteneur = nb produits × prix unitaire
- [ ] **Champ "Autre" personnalisable**
  - [ ] Quand on choisit "Autre", un champ texte apparaît pour nommer le type
  - [ ] Le nouveau type est sauvegardé dans le système (base de données)
  - [ ] Disponible partout pour tous les utilisateurs
  - [ ] Appliquer sur: types de produits, types de conteneurs, types d'utilisateurs

---

## 📌 À faire — Priorité 5 (Vues & Listes)

- [ ] **Sélecteur de mode de vue** dans tous les modules de liste
  - [ ] Bouton qui ouvre un cadre de choix de vue
  - [ ] Vues: cartes, liste
  - [ ] Tailles de cartes: très petites, petites, moyennes, grandes
  - [ ] Adaptation mobile (petites cartes) vs desktop (cartes plus grandes)
  - [ ] Appliquer dans: produits, clients, corbeille, historique, etc.

---

## 📌 À faire — Priorité 6 (Polish)

- [ ] Vérifier le rendu dark mode (effet glass)
- [ ] Vérifier le layout desktop
- [ ] Vérifier les débordements sur mobile (Settings, Accounting, Replenishment)

---

## 📝 Notes

- L'application est **local-first** (IndexedDB). Supabase sert uniquement pour l'auth et la sync des sauvegardes.
- Les boutons et icônes doivent suivre le style iOS 15 (arrondis, Lucide icons, pas d'emojis).
- Toute nouvelle fonctionnalité doit être ajoutée à cette liste avant d'être implémentée.
- Une fonctionnalité n'est cochée que quand elle est **réellement fonctionnelle et vérifiée**.
