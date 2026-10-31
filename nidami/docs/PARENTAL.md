# Compte « enfant supervisé » — conception (pas encore construit)

**État : conception uniquement. Rien de ceci n'est actif dans l'application.**
Le contrôle parental ne peut être fiable que **côté serveur** : en mode démo tout reste sur l'appareil et l'enfant pourrait le contourner. On ne le construit donc qu'avec le serveur (Supabase) et après relecture juridique.

## Principes décidés avec l'utilisateur
1. Le **parent crée** le compte de l'enfant depuis le sien (= accord parental vérifiable). L'enfant entre avec un code donné par le parent.
2. Le parent **approuve chaque ami** (demande → parent → ami ajouté seulement après « oui »).
3. Pas de recherche publique, pas d'inconnus, publication seulement vers les amis approuvés.
4. Le parent reçoit des **alertes** : contenu interdit, harcèlement, signalement, inconnu qui écrit, demande d'ami.
5. Le parent fixe des **horaires** et peut **mettre en pause** le compte.
6. Le parent peut **lire les messages, jamais en cachette** :
   - l'enfant est informé que son compte est supervisé ;
   - ses amis voient « compte supervisé » avant d'écrire ;
   - **moins de 13 ans** : lecture libre ; **13–14 ans** : ouverture d'une conversation en cas de doute, l'enfant est prévenu à chaque ouverture ;
   - chaque lecture est journalisée (`guardian_access_log`).
7. L'enfant **ne peut jamais lever** la supervision lui-même.

## À faire avant toute mise en route
- Exécuter et tester `supabase/migrations/002_parental_DRAFT.sql` sur un Supabase de **test** (jamais exécuté).
- Brancher les points listés en section 6 du SQL dans les vraies fonctions (demandes d'amis, publication, messages, signalements).
- Écrans parent et enfant à valider en image avant de les coder.
- **Relecture par un avocat** : données de mineurs (RGPD art. 8, lois locales, COPPA aux États-Unis), information des tiers, durée de conservation du journal.
- Les CGU / politique de confidentialité / protection des mineurs doivent décrire ce fonctionnement.

## Limites honnêtes
- Aucune application n'empêche un enfant de mentir sur son âge ailleurs ; seul le compte créé par le parent est solide.
- La lecture des messages impose que les messages ne soient pas chiffrés de bout en bout (c'est déjà le cas : le chiffrement n'est pas implémenté).
