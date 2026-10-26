# Nidami — état d'avancement (honnête)

Légende : ✅ fait et testé · 🟡 fait mais non testé sur un vrai appareil/serveur · ⏳ à faire (demande un serveur)

## Fait
| Fonction | État | Remarque |
|---|---|---|
| Nom, logo, icônes, favicon, thème sombre + clair | ✅ | |
| Installation PWA (PC, Android, iPhone, tablette) | 🟡 | manifeste + service worker présents ; test réel sur S25 à faire |
| Règles des publications éphémères **par destinataire** (cas A à J du cahier des charges) | ✅ | 19 tests automatiques (`npm test`) |
| Publier texte/photo, durées 3/5/10/30/60 s, durée perso (1 à 600 s), permanente | ✅ | testé en navigateur |
| Destinataires : tous / groupe / sélectionnés / tous sauf / liste / moi seul + compteur avant publication | ✅ | |
| Visionneuse avec compte à rebours, fermeture automatique, « expirée pour vous » | ✅ | |
| Suppression du fichier quand plus personne ne peut le voir | ✅ (démo) | en mode serveur : fonction `purge_expired` 🟡 |
| Réactions, commentaires, réponses, suppression | ✅ | |
| Stories 24 h, « vu par », réponse privée | ✅ | |
| Amis (code d'invitation), demandes, blocage, signalement, listes | ✅ | démo : amis fictifs |
| Groupes (admin, règles, retrait de membres, fil du groupe) | ✅ | |
| Messagerie : texte, photos, réponses, modifier/supprimer, épingler, recherche, lu/envoyé, messages éphémères après lecture | ✅ | démo locale (un seul appareil) |
| Messages vocaux | 🟡 | code présent, micro non testable ici |
| Événements + réponses de présence | ✅ | |
| Jeux : Morpion à deux, Quiz | ✅ | |
| Notifications dans l'application | ✅ | |
| Export et suppression des données | ✅ | |
| Messages « vue unique » (disparaît à la fermeture), éphémères après lecture, permanents | ✅ | démo locale |
| Filigrane (nom du destinataire + date) incrusté dans les photos affichées | ✅ | dissuade, n'empêche pas la copie |
| Blocage des captures d'écran | ⚠️ partiel | **impossible à garantir dans un site web** : masquage au changement de fenêtre / touches de capture, auteur prévenu. Blocage réel seulement dans une appli Android native (étape future) ; impossible sur iPhone |
| QR code personnel automatique (lien d'invitation), code renouvelable, pseudo @, visibilité Public / Limité / Invisible, recherche respectant ce choix | ✅ | scan caméra intégré 🟡 (non testable ici) ; l'appareil photo du téléphone ouvre le lien |
| Partage avec accord : demande → l'auteur autorise/refuse → republication = simple lien vers l'original (durées conservées) → l'auteur peut retirer ou supprimer et tout disparaît chez les autres | ✅ | 5 tests dédiés (K à O) |
| Documents juridiques (mentions, CGU, charte, droit d'auteur, RGPD, signalement, mineurs) | 🟡 | modèle à faire valider par un avocat ; champs [à compléter] |
| Schéma PostgreSQL + RLS + fonctions `publish_post` / `open_post` / `purge_expired` | 🟡 | écrit, **jamais exécuté** sur un vrai Supabase |

## À faire (nécessite le serveur Supabase)
- Vrais comptes (e-mail, vérification, mot de passe oublié), invitations par lien.
- Messages et publications **entre vrais téléphones** (temps réel).
- Photos dans un stockage privé avec URL signées courtes.
- Appels audio/vidéo (WebRTC + serveur TURN) — **payant à grande échelle**.
- Notifications push.
- Vidéos courtes, albums, Échecs, Rami.
- Chiffrement de bout en bout : **non implémenté** (la messagerie n'est donc PAS présentée comme chiffrée).
- Applications Android/iPhone dans les magasins (Capacitor), après le serveur.

## Limites à connaître
- Mode démo : tout reste sur l'appareil ; rien n'est réellement protégé contre quelqu'un qui ouvre les outils du navigateur. La **vraie** protection viendra du serveur.
- Aucune application ne peut empêcher une capture d'écran faite avec un autre appareil.
- Le nom « Nidami » n'a pas fait l'objet d'une recherche de marque officielle (INPI/EUIPO) : à faire avant toute publication commerciale.
