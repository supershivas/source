# source — notes pour Claude Code

"source" est la réécriture de `supershivas/La-fabrique` (mêmes fonctionnalités,
nouveau nom) avec exactement la même architecture que `supershivas/idee` :
Next.js / React / TypeScript / Tailwind, structure `app/app/App.tsx` +
composants dans `app/app/components/`, styles globaux dans `app/globals.css`.

## Base de données partagée (IMPORTANT)

"source" utilise la **même instance Supabase** que La-fabrique — pas de
nouvelle base, pas de migration de schéma. Tables utilisées : `projects`,
`subprojects`, `notes` (+ `auth.users` pour l'authentification). La colonne
`trashed` (boolean, soft-delete / corbeille) existe déjà sur `projects` et
`subprojects` côté Supabase, il n'y a aucun outil de migration dans ce repo.

Credentials Supabase (URL + clé anon) à configurer dans `.env.local`
(non commité, voir `.env.local.example`) :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Comme La-fabrique et idee, l'authentification se fait via Supabase Auth
(email/password), avec un middleware (`middleware.ts`) qui protège les
routes `/app/*` et redirige vers `/login` si non authentifié.

## Parité visuelle avec idee et La-fabrique (IMPORTANT)

"source", `supershivas/idee` et `supershivas/La-fabrique` doivent avoir
**exactement la même sidebar** (espacements, dividers, tailles d'icônes,
hauteurs de bouton, etc.) — seul le contenu/la fonction de l'app change. Si
tu modifies un style de sidebar ici (`App.tsx`, composants sous
`app/app/components/`), vérifie toujours son équivalent dans idee
(`app/app/App.tsx`, composants) et dans La-fabrique (`index.html`,
`style.css`, `app.js`), et applique le même changement des trois côtés dans
la même session/PR. Ne jamais laisser les trois diverger.

La sidebar est "toujours sombre", indépendamment du thème clair/sombre de
l'app — les variables `--sidebar-*` dans `app/globals.css` doivent rester
identiques entre les blocs `:root` (light) et `html.dark` (dark), exactement
comme dans idee.

## Design tokens

Source de vérité canonique : `supershivas/design-system` (`design-tokens.json`).
Toute valeur partagée (couleurs sidebar, radii, fonts, dimensions
search/kbd/header/divider) doit être modifiée **là-bas en premier**, puis
synchronisée ici via `./scripts/sync-tokens.sh`, puis reportée dans
`app/globals.css` / les styles inline qui la consomment. Ne jamais modifier
une valeur partagée uniquement ici sans la reporter dans design-system, idee
et La-fabrique.

## État du portage

La coquille Next.js/Tailwind/TS (config, layout, login, connexion Supabase,
middleware, sidebar de base, sync des tokens) est en place. Les
fonctionnalités de La-fabrique restent à porter une par une dans
`app/app/components/` :

- CRUD projets / sous-projets / notes
- Drag-and-drop (réutiliser `@dnd-kit`, comme dans idee)
- Filtres / tri, navigation année / catégorie
- Dashboard / stats
- Export CSV
- Archivage
- Corbeille (soft-delete via `trashed`)
- Settings (thème / accent / taille de police)
- Modals (projet/sous-projet, note, settings, année, confirmation),
  Enter-to-submit

`app/app/types.ts` définit déjà les types `Project`, `Subproject`, `Note`
correspondant au schéma Supabase existant.

## Workflow Git

- Toujours brancher depuis `main`, jamais commit direct sur `main`.
- Commits descriptifs en français.
- Une fois la branche poussée : créer une PR vers `main`, puis squash-merge
  (`merge_method: "squash"`). C'est le pattern utilisé pour tout ce repo.
