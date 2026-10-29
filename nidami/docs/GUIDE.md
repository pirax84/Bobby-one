# Guide pour débutant — NOTIIF

## 1. Essayer tout de suite
Ouvrez le lien de l'application sur votre téléphone ou votre PC. Entrez votre prénom, cochez la case, c'est parti.

## 2. L'installer comme une vraie application
- **Samsung / Android** : ouvrez le lien dans Chrome ou Samsung Internet, menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »).
- **iPhone** : ouvrez dans Safari, bouton Partager → « Sur l'écran d'accueil ».
- **PC** : dans Chrome ou Edge, icône « Installer » à droite de la barre d'adresse.

## 3. Tester les durées « par personne »
1. Dans Mon cercle, touchez **+** → Texte → « Amis sélectionnés » → Céline + Thomas → durée **5 s** → Publier.
2. Paramètres → « Changer de membre » → **Céline** → Accueil → Ouvrir : 5 secondes, puis c'est fini pour elle.
3. Passez à **Thomas** : il peut encore ouvrir, et il a ses propres 5 secondes.
4. Passez à **Émilie** (exclue) : elle ne voit rien.

## 4. Passer en « vraie » application (plus tard)
Il faudra un serveur. Étapes (aucune n'est faite à votre place, aucun paiement n'est nécessaire au début) :
1. Créer un compte gratuit sur supabase.com, puis un projet.
2. Dans « SQL Editor », coller le contenu de `supabase/migrations/001_init.sql` et l'exécuter. ⚠️ Ce fichier n'a **jamais été testé** : on le teste d'abord sur un projet d'essai.
3. Copier l'URL du projet et la clé « anon » dans un fichier `.env.local` (modèle : `.env.example`). Ne partagez **jamais** la clé « service_role ».
4. Me demander de brancher l'application sur le serveur.

## 5. Pour un développeur
```
cd nidami
npm install
npm run dev        # lancer en local
npm test           # tests des règles
npm run build      # construire le site
./build-static.sh  # variante sans Vite (copie dans ../public/nidami)
```
Dossiers : `src/lib/engine.ts` (règles), `src/lib/store.ts` (données locales), `src/ui/*` (écrans), `supabase/` (base de données).

## Inscription réelle (Google, Apple, Facebook, e-mail, FranceConnect…)

L'écran d'inscription est prêt. Il ne devient « réel » que lorsque le serveur est relié :
1. Créez un projet gratuit sur supabase.com, puis copiez l'adresse et la clé publique dans les variables Vercel `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
2. E-mail + mot de passe : rien d'autre à faire (activé par défaut dans Supabase).
3. Google : créer un identifiant OAuth sur console.cloud.google.com, puis le coller dans Supabase > Authentication > Providers.
4. Facebook : créer une application sur developers.facebook.com, même principe.
5. Apple : demande un compte Apple Developer (payant, environ 99 €/an).
6. Snapchat (Snap Kit), FranceConnect (habilitation de l'État via datapass.api.gouv.fr) et l'Identité Numérique La Poste (partenariat) demandent un accord préalable : les boutons existent, mais ne sont pas activables avant l'accord.
Le code de connexion n'a pas été testé sur un vrai serveur.
