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
- Listes de tâches : note dont chaque ligne commence par `[ ] `
  (`app/app/todo.ts`, pas de colonne de plus) ; cocher une tâche l'enlève de la
  liste et crée une note « Fait : … » (`handleCompleteTodo`), liste épinglée en haut
- Panneaux de détail : bouton agrandir/réduire (centré, bureau seulement)
- Notes en Markdown léger (`NoteMarkdown.tsx`, sans dépendance, rendu en
  éléments React) ; `NoteModal` a une barre gras/italique/titre/liste

`app/app/types.ts` définit les types `Project`, `Subproject`, `Note`
correspondant au schéma Supabase existant.

## Versioning et mises à jour

Même mécanique que idee : `public/version.json` (seule source de vérité) et
`public/CHANGELOG.md`, lus au build par `next.config.js`
(`NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_APP_CHANGELOG`). `PwaUpdater`
compare l'identifiant de build servi par `/api/build-id` et recharge dès
qu'aucune saisie n'est en cours ; `VersionToast` annonce « Mis à jour en
vX.Y.Z ». Réglages : export JSON, restauration d'une sauvegarde
(`importBackup.ts` : réécrit chaque ligne par son id, ne supprime rien),
version et 5 dernières versions.

Hors ligne : `public/sw.js` (même service worker que idee, caches
`source-*`) rejoue en lecture seule ce qui a déjà été vu en ligne ; enregistré
par `app/ServiceWorkerRegister.tsx`. Changer le suffixe `-v1` des caches pour
les invalider.

Piège : `PwaUpdater` pose `source_updated_from` (sessionStorage) avant de
recharger ; `VersionToast` l'utilise pour annoncer la mise à jour. Les radii
(`--radius-*`) et `--font-mono` (DM Mono) viennent des tokens ; les zones
tactiles 44 px passent par un pseudo-élément (`@media (pointer: coarse)`).
Écart assumé : la liste principale fait 800 px de large (token `content.maxWidth` : 680 px).

Mobile : les `:hover` sont sous `@media (hover: hover)` (et Tailwind en
`hoverOnlyWhenSupported`), sinon iOS exige un double toucher ; les champs sont
forcés à 16 px en `!important` (des champs ont un `fontSize` en ligne, que
`mobile.css` ne battait pas) ; le détail est une feuille par le bas
plein écran, fermé en glissant vers le bas depuis le haut du contenu (`useSheetDrag.ts`).

Seuil mobile : 768 px (`isMobile` dans `App.tsx` et les `@media` de
`globals.css`, comme `mobile.css`). Glisser-déposer au toucher : appui long de
250 ms sur la poignée (`TouchSensor`) ; `useKeyboardFit` cale le tiroir sur
`visualViewport` pour que le clavier iOS ne cache pas le champ de note.

## Icônes

Règle du design system : icônes Tabler au trait uniquement. Restent tels
quels, parce que ce ne sont pas des icônes d'interface : le logo ✦ de
l'en-tête (marque de l'app, à garder), le « ↳ » de l'export CSV (donnée) et
le préfixe `→ ` des notes de statut (lu par `isStatusNote`).

## Labo

`/app/labo` (`app/app/labo/page.tsx`, protégé par le middleware, lien dans les
Réglages) : banc d'essai de mises en page de la liste (liseré, pastille, fond
teinté, dense, groupé…) sur des données d'exemple, avec un menu d'ancres en
haut. Rien n'y est enregistré.

## Exceptions aux conventions

Aucune.
