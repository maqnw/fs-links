# GitHub Pages deployment (reference)

This note documents **why** static export can break on GitHub Pages and **what** we set so the site (CSS, JS, and local icons) loads correctly when served from a **project** URL like `https://<user>.github.io/<repo>/`.

The app uses **Astro static output** (`output: "static"` and `outDir: "out"` in `astro.config.mjs`). The build output lives in **`out/`**, which is what you publish to the **`gh-pages`** branch.

---

## 1. Two separate problems (symptoms looked similar)

| Symptom | Root cause |
|--------|------------|
| Requests went to `https://<user>.github.io/_astro/...` (missing `/<repo>`) | **Subpath hosting** — HTML used root-absolute URLs. |
| Requests went to `https://<user>.github.io/<repo>/_astro/...` but still **404** | **Jekyll** on GitHub Pages **omitted** the `_astro` folder. |

You may fix one and still see failures until both are addressed.

---

## 2. Project sites vs root sites

GitHub Pages has two common URL shapes:

- **Project site:** `https://<user>.github.io/<repository-name>/`  
  Everything under that repo’s Pages build is served **under** `/<repository-name>/`.

- **User/org site:** `https://<user>.github.io/` from a repo named `<user>.github.io`  
  The site is served from the **domain root** (no extra path segment).

- **Custom domain at apex** (e.g. `https://example.com/`): also behaves like a **root** site for path purposes.

Astro’s default static HTML uses **root-absolute** asset URLs unless `base` is set: `/_astro/...`, `/favicon.ico`, etc. That is correct only when the site is served at **`/`**. On a **project** site, the browser resolves `/_astro/...` against the **host**, not the repo folder, so it requests the wrong URL and assets **404**.

---

## 3. Fix A — `base` (Astro)

### 3.1 What we did

- **`lib/siteBasePath.js`** exports a single string, e.g. `"/fs-links"`, which must match the **repository name** segment in the GitHub Pages URL (leading slash, no trailing slash).
- **`astro.config.mjs`** imports that value and sets Astro’s **`base`** when it is non-empty. That prefixes **framework** assets: `/_astro/...`, scripts, and preloads.

Official reference: [Astro `base`](https://docs.astro.build/en/reference/configuration-reference/#base).

### 3.2 When to use `""`

Set **`siteBasePath`** in `lib/siteBasePath.js` to **`""`** (and keep `astro.config.mjs` importing it) if you deploy only to:

- a **user/org** GitHub Pages site at the domain root, or  
- a **custom domain** where the app is served at `/`.

Then Astro omits `base` from the config object entirely (`...(siteBasePath ? { base: siteBasePath } : {})`).

### 3.3 Public files in `pages.json` (`/link-icons/...`)

JSON and build logic still store **root-absolute** paths such as `/link-icons/<hash>.ico`. Those strings are **not** rewritten by `base` automatically when passed to a plain `<img src={...} />`.

**`src/components/LinkIcon.astro`** imports **`siteBasePath`** and prefixes **only** same-origin style paths: strings starting with `/` that are not protocol-relative (`//`). External `https://...` URLs are unchanged.

If you add other raw `/...` public URLs in the UI later, apply the same rule so they respect the subpath.

---

## 4. Fix B — `.nojekyll` (GitHub Pages + Jekyll)

### 4.1 What went wrong

GitHub Pages runs **Jekyll** on published branches **by default**. Jekyll **ignores** files and directories whose names start with **`_`** (with limited exceptions). Astro’s build output includes a directory named **`_astro`**, so Jekyll **does not publish** it unless Jekyll is disabled.

### 4.2 What we did

- Added **`public/.nojekyll`** (empty file). Astro copies everything under `public/` into the root of **`out/`**, so the published site includes **`out/.nojekyll`**.
- That file tells GitHub Pages to **disable Jekyll** for the site so **`_astro`** is deployed and served like any other folder.

After each `astro build`, confirm **`out/.nojekyll`** exists next to **`out/_astro/`** before you deploy.

---

## 5. Deploy workflow (example)

This project does **not** automate GitHub Actions here; a typical flow is:

1. **`npm run build`** — produces a fresh **`out/`** tree (including **`.nojekyll`** and **`_astro/`**).
2. Push **`out/`** to the remote branch GitHub Pages uses (often **`gh-pages`**), e.g.:

   ```bash
   git subtree push --prefix out origin gh-pages
   ```

3. In the GitHub repo → **Settings → Pages**, ensure the source is the branch you pushed (e.g. **`gh-pages`**) and the folder is **root** (`/`).

**Important:** If you deploy an **`out/`** built **before** `.nojekyll` or **before** `base` was set, the live site will stay broken until you rebuild and redeploy.

---

## 6. Local verification

### 6.1 Why plain `http-server out` breaks with `base`

GitHub Pages serves the **contents** of your `gh-pages` branch at `https://<user>.github.io/<repo>/`. There is **no** `/<repo>/` folder on disk: the host maps the first URL segment to the site root. So `https://<user>.github.io/<repo>/_astro/foo.css` reads the file `/_astro/foo.css` at the **deploy root** (same layout as your local `out/` folder).

A generic static server rooted at **`out/`** instead interprets the path literally. The browser requests `http://127.0.0.1:8080/fs-links/_astro/foo.css`, so the server looks for **`out/fs-links/_astro/...`**, which does not exist → **404** for every asset.

**`scripts/serve-out.mjs`** strips `siteBasePath` from the URL and then resolves files under `out/`, matching GitHub Pages behavior.

- **`npm run dev`** — runs `astro build` then `node scripts/serve-out.mjs` (default port **8080**). Open **`http://127.0.0.1:8080/fs-links/`** (adjust if `PORT` is set).
- **`npm run start`** — serves the existing **`out/`** the same way (no rebuild).
- **`npm run dev:astro`** — **`astro dev`** with hot reload; open **`http://localhost:4321/fs-links/`**.

### 6.2 Quick production checks

After deploy:

- **`https://<user>.github.io/<repo>/.nojekyll`** — should return an empty response (proves Jekyll is off).
- **`https://<user>.github.io/<repo>/_astro/<some>.css`** — should return **200** (not 404).

---

## 7. File checklist

| File | Role |
|------|------|
| `lib/siteBasePath.js` | Single source of truth for the repo path segment; must match GitHub repo name for project Pages. |
| `astro.config.mjs` | Imports `siteBasePath` and applies `base`. |
| `src/components/LinkIcon.astro` | Prefixes root-relative icon URLs with `siteBasePath`. |
| `public/.nojekyll` | Copied to `out/.nojekyll` so GitHub Pages serves `_astro/`. |
| `scripts/serve-out.mjs` | Local static preview of `out/` with the same URL shape as GitHub Pages (strip `siteBasePath` before resolving files). |

---

## 8. Further reading

- [Astro: Static sites](https://docs.astro.build/en/basics/project-structure/)  
- [GitHub Pages: Using a static site generator](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)  
- Common static hosting gotcha: [Files that start with an underscore are missing](https://github.blog/2009-12-29-bypassing-jekyll-on-github-pages/) (`.nojekyll` bypass)
