@.claude/conventions.md

# source — notes pour Claude Code

"source" est l'app de gestion de projet
(https://source-sigma-kohl.vercel.app/app), avec exactement la même
architecture que `supershivas/idee` : Next.js / React / TypeScript /
Tailwind, structure `app/app/App.tsx` + composants dans
`app/app/components/`, styles globaux dans `app/globals.css`. Catégorie :
**primaire**. Cible : mobile et bureau.

## Base de données partagée (IMPORTANT)

"source" utilise l'**instance Supabase existante** — pas de nouvelle base,
pas de migration de schéma. Tables utilisées : `projects`,
`subprojects`, `notes` (+ `auth.users` pour l'authentification). La colonne
`trashed` (boolean, soft-delete / corbeille) existe déjà sur `projects` et
`subprojects` côté Supabase, il n'y a aucun outil de migration dans ce repo.

Credentials Supabase (URL + clé anon) à configurer dans `.env.local`
(non commité, voir `.env.local.example`) :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Comme idee, l'authentification se fait via Supabase Auth
(email/password), avec un middleware (`middleware.ts`) qui protège les
routes `/app/*` et redirige vers `/login` si non authentifié.

## Parité visuelle avec idee (IMPORTANT)

"source" et `supershivas/idee` doivent avoir **exactement la même sidebar**
(espacements, dividers, tailles d'icônes, hauteurs de bouton, etc.) — seul le
contenu/la fonction de l'app change. Si tu modifies un style de sidebar ici
(`App.tsx`, composants sous `app/app/components/`), vérifie toujours son
équivalent dans idee (`app/app/App.tsx`, composants), et applique le même
changement des deux côtés dans la même session. Ne jamais laisser les deux
diverger.

La sidebar est "toujours sombre", indépendamment du thème clair/sombre de
l'app — les variables `--sidebar-*` dans `app/globals.css` doivent rester
identiques entre les blocs `:root` (light) et `html.dark` (dark), exactement
comme dans idee.

## Design tokens

Source de vérité canonique : `supershivas/design-system` (`design-tokens.json`).
Toute valeur partagée (couleurs sidebar, radii, fonts, dimensions
search/kbd/header/divider) doit être modifiée **là-bas en premier**, puis
synchronisée ici par `scripts/sync-design-system.sh` (lancé automatiquement
au début de chaque session, avec `app/mobile.css`), puis reportée dans
`app/globals.css` / les styles inline qui la consomment. Ne jamais modifier
une valeur partagée uniquement ici sans la reporter dans design-system et
idee.

## Fonctionnalités

- CRUD projets / sous-projets / notes
- Drag-and-drop (`@dnd-kit`, comme dans idee)
- Filtres / tri, navigation année / catégorie
- Reset de mot de passe (`/login` + `/reset-password`)
- Dashboard / stats (`app/app/components/Dashboard.tsx`)
- Export CSV (vue filtrée courante, projets + sous-projets)
- Archivage (toggle projets/sous-projets, vue "Archivés")
- Corbeille (`app/app/components/TrashView.tsx` : restaurer / supprimer
  définitivement, soft-delete via `trashed`)
- Settings (`app/app/components/SettingsModal.tsx` : thème clair/sombre,
  taille du texte, couleur d'accent, persistés en localStorage)
- Modals (projet/sous-projet, note, confirmation), Enter-to-submit

`app/app/types.ts` définit les types `Project`, `Subproject`, `Note`
correspondant au schéma Supabase existant.

## Versioning et mises à jour

Même mécanique que idee : `public/version.json` (seule source de vérité) et
`public/CHANGELOG.md`, lus au build par `next.config.js`
(`NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_APP_CHANGELOG`). `PwaUpdater`
compare l'identifiant de build servi par `/api/build-id` et recharge dès
qu'aucune saisie n'est en cours ; `VersionToast` annonce « Mis à jour en
vX.Y.Z ». Réglages : export JSON, version et 5 dernières versions.

## Exceptions aux conventions

Aucune.
