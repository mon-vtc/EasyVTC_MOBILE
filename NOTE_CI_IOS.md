# Note — Ajout du build iOS au CI

J'ai modifié `.github/workflows/ci.yml` : les jobs `eas-preview` (branche `develop`) et `eas-production` (branche `main`) buildaient uniquement l'Android (`eas build --platform android`), ils utilisent maintenant `--platform all` pour builder Android **et** iOS dans le même run. Le projet est en Expo managé pur (pas de dossier `ios/` natif), donc EAS Build compile iOS dans le cloud, sans Mac. Les credentials iOS (certificat de distribution, clé Push APNs, et même une App Store Connect API Key) sont déjà enregistrées et valides côté EAS (compte Khadim Mbacke N'DAW) — rien à configurer de ce côté, le prochain push sur `develop`/`main` devrait déclencher un build iOS sans intervention.

Seul point de vigilance : le certificat `.p12` (avec sa clé privée) et la clé `.p8` existent aussi en clair dans le dossier `Infos_iOS/` à la racine — ils font doublon avec ce qui est déjà stocké chiffré côté EAS. Comme ce dossier n'est pas versionné dans un repo Git, il n'y a pas de risque de fuite via un commit, mais je recommande de les déplacer vers un gestionnaire de secrets (1Password, Bitwarden…) puis de supprimer les copies locales une fois fait, plutôt que de les laisser dans un dossier de projet.

## Build iOS "preview" (interne) : action manuelle encore requise

Après le premier run avec Node 22 (voir plus bas), le build **Android** preview passe, mais le build **iOS preview** échoue avec :
```
Failed to set up credentials.
You're in non-interactive mode. EAS CLI couldn't find any credentials
suitable for internal distribution. Run this command again in interactive mode.
```
Le profil `preview` distribue en interne (`distribution: internal`), ce qui pour iOS veut dire un IPA Ad Hoc installable sur un vrai iPhone — ça nécessite un **profil de provisionnement Ad Hoc** lié aux UDID des iPhones de test enregistrés. Le certificat de distribution existe déjà, mais aucun appareil/profil Ad Hoc n'a encore été enregistré, et ça ne peut pas se créer tout seul en CI non-interactif.

**Action à faire une fois, avec le compte Apple Developer :**
1. Récupérer l'UDID du/des iPhone(s) de test (Réglages → Général → Informations, ou via Xcode/Finder)
2. `eas device:create` (en local, interactif) pour enregistrer le/les UDID sur le compte Apple Developer
3. `eas build --platform ios --profile preview` (en local, interactif) une fois — EAS génère alors le profil Ad Hoc et le stocke côté serveur
4. Une fois fait, les runs CI non-interactifs (`eas-preview`) devraient réussir aussi côté iOS

Je n'ai pas touché à `eas.json` : j'ai délibérément gardé la distribution Ad Hoc (installable sur vrai appareil) plutôt que de basculer sur un build simulateur, car l'app est déjà testée sur un iPhone physique (cf. capture du bug de connexion).

## Fix Node 22 (2026-09-05)

Le CI échouait aussi sur `eas-preview`/`eas-production` avec :
```
error @oclif/plugin-autocomplete@3.3.0: The engine "node" is incompatible
with this module. Expected version ">=22.0.0". Got "20.20.2"
```
`eas-cli` exige désormais Node ≥ 22. Les deux jobs sont passés de Node 20 à Node 22 dans `ci.yml` — ça a réglé l'échec de l'étape "Setup EAS CLI" (le build Android preview est allé jusqu'au bout après ce fix).
