# 🔥 Coach Fitness — Guide d'installation PWA (100% gratuit)

Temps total : ~30 minutes. Fais les étapes dans l'ordre.

## 📦 Les fichiers

```
coach-fitness.html          ← l'application
manifest.webmanifest        ← identité de la PWA
sw.js                       ← service worker (hors ligne + notifications)
icon-192.png / icon-512.png / apple-touch-icon.png
subs.json                   ← tes abonnements aux notifications (vide au départ)
scripts/send.js             ← script d'envoi des notifications
.github/workflows/notifications.yml  ← l'automate qui envoie les notifs
```

---

## Étape 1 — Héberger sur GitHub Pages (10 min)

1. Va sur [github.com](https://github.com) → connecte-toi → bouton **New** (nouveau dépôt).
2. Nom : `coach-fitness` · visibilité : **Public** (obligatoire pour Pages gratuit) · **Create repository**.
3. Clique **uploading an existing file** et glisse TOUS les fichiers ci-dessus.
   ⚠️ Le dossier `.github/workflows/` doit garder sa structure. Si le glisser-déposer ne
   crée pas les dossiers : bouton **Add file → Create new file**, tape
   `.github/workflows/notifications.yml` comme nom (les `/` créent les dossiers),
   colle le contenu, Commit. Pareil pour `scripts/send.js`.
4. **Settings** (du dépôt) → **Pages** → Source : `Deploy from a branch` → Branch : `main` + `/ (root)` → **Save**.
5. Attends 2 min. Ton appli est en ligne à :
   `https://TON-PSEUDO.github.io/coach-fitness/coach-fitness.html`
   → ouvre-la, vérifie qu'elle marche, garde l'URL.

## Étape 2 — La clé secrète des notifications (2 min)

1. Dans ton dépôt : **Settings → Secrets and variables → Actions → New repository secret**.
2. Name : `VAPID_PRIVATE_KEY`
3. Secret : *(la clé privée que Claude t'a donnée dans la conversation — ne la mets JAMAIS dans un fichier du dépôt, il est public)*
4. **Add secret**.
5. Onglet **Actions** du dépôt → si un bandeau demande d'activer les workflows, clique **Enable**.

## Étape 3 — Firebase : sauvegarde cloud (10 min)

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) → **Créer un projet** → nom `coach-fitness` → désactive Analytics → Créer.
2. **Authentication** (menu gauche) → Commencer → onglet **Sign-in method** → active **Adresse e-mail/Mot de passe** → Enregistrer.
3. **Firestore Database** → Créer une base → mode **production** → région `europe-west` → Activer.
4. Onglet **Règles** de Firestore → remplace tout par :
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   → **Publier**. (Chaque utilisateur ne peut lire/écrire QUE ses propres données.)
5. ⚙️ **Paramètres du projet** → section *Vos applications* → icône **</>** (Web) → nom `coach-fitness` → Enregistrer → copie le bloc `firebaseConfig` affiché.
6. Retourne sur GitHub → ouvre `coach-fitness.html` → ✏️ (modifier) → cherche `COLLE_ICI`
   (tout en bas du fichier) → remplace les 6 valeurs par celles de TON firebaseConfig → **Commit changes**.
7. Recharge ton appli → onglet ⚙️ Réglages → crée ton compte (email + mot de passe) → le statut passe à « ☁️ Synchronisé ✓ ».

## Étape 4 — iPhone : installer + activer les notifications (5 min)

⚠️ Prérequis : iOS 16.4 minimum.

1. Ouvre l'URL de ton appli dans **Safari** (pas Chrome).
2. Bouton **Partager** (carré + flèche ↑) → **Sur l'écran d'accueil** → Ajouter.
3. Ouvre l'appli **depuis sa nouvelle icône** (obligatoire — les notifs ne marchent pas depuis Safari).
4. Onglet **⚙️ Réglages** → **🔔 Activer les notifications** → Autoriser.
5. Un code apparaît → **📋 Copier le code**.
6. Sur GitHub : ouvre `subs.json` → ✏️ → colle ton code **entre les crochets** :
   ```json
   [
   { ...ton code collé ici... }
   ]
   ```
   → **Commit changes**.

## Étape 5 — Tester (2 min)

1. GitHub → onglet **Actions** → workflow **Notifications programmées** → **Run workflow** (bouton à droite) → Run.
2. Regarde le log : hors créneau il affichera « Aucun créneau à envoyer » — c'est NORMAL et ça prouve que tout tourne.
3. Pour un vrai test de réception : modifie temporairement un créneau dans `scripts/send.js` pour l'heure qui vient (heure de Paris), attends le passage du cron (toutes les 30 min), puis remets le créneau normal.

## 📅 Les rappels programmés (modifiables dans scripts/send.js)

| Jour | Heure | Notification |
|---|---|---|
| Lundi | 8h17 | ⚖️ Pesée |
| Lundi | 19h15 | 🏋️ Clôture semaine + séance FORCE |
| Mercredi | 8h17 | ⚖️ Pesée |
| Mercredi | 19h15 | 💪 Séance VOLUME |
| Vendredi | 8h17 | ⚖️ Pesée + analyse |
| Vendredi | 19h15 | 🤸 Séance poids du corps |
| Samedi | 9h00 | 🏃 Course (à faire dans la journée) |
| Samedi (tous les 70 j, à partir du 11/07/2026) | 9h00 | ⏱️ Test VMA demi-Cooper (remplace la course) |

Les notifications arrivent entre l'heure programmée et ~15 minutes après (le cron GitHub passe toutes les 15 min).

## 🔧 Dépannage

- **Pas de notification reçue** : vérifie 1) l'appli est bien installée sur l'écran d'accueil ET tu l'as ouverte depuis l'icône, 2) ton code est bien dans `subs.json`, 3) le secret `VAPID_PRIVATE_KEY` existe, 4) l'onglet Actions montre des exécutions vertes.
- **« échec (410) » dans les logs** : ton abonnement a expiré (ça arrive si tu désinstalles l'appli) → refais l'étape 4.
- **Les notifs arrivent avec ~15-25 min de retard parfois** : normal, le cron GitHub n'est pas à la minute près.
- **La sync cloud ne marche pas** : vérifie que les 6 valeurs `COLLE_ICI` ont été remplacées et que Authentication 