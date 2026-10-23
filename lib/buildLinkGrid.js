import { ensureFallbackColorsInPagesJson } from "./ensureFallbackColors.js";
import { ensureLocalIconImagesInPagesJson } from "./ensureLocalIconImages.js";
import { linkIconFileExists, isPublicLinkIconPath } from "./iconImagePath.js";
import { loadPagesJson } from "./loadPages.js";
import { persistFetchedTitlesInPagesJson } from "./persistFetchedTitlesInPagesJson.js";
import {
  canonicalPageUrl,
  displayTitleForUrl,
  flushLinkGridFetchCache,
  resolveIconAndTitleForUrl,
} from "./resolveIcon.js";

const DEFAULT_CONCURRENCY = Math.max(
  1,
  Math.min(32, Number.parseInt(process.env.LINK_GRID_FETCH_CONCURRENCY ?? "12", 10) || 12),
);

function hasValidLocalIconRow(p, cwd) {
  if (p.useImage === false) return true;
  const w = p.iconImagePath?.trim();
  if (!w || !isPublicLinkIconPath(w)) return false;
  return linkIconFileExists(cwd, w);
}

function pageNeedsNetworkForUrl(pages, urlKey, cwd) {
  return pages.some((p) => {
    const k = canonicalPageUrl(p.url) ?? p.url.trim();
    if (k !== urlKey) return false;
    const needsTitle = !String(p.title ?? "").trim();
    const needsRemoteIconMeta = p.useImage !== false && !hasValidLocalIconRow(p, cwd);
    return needsTitle || needsRemoteIconMeta;
  });
}

/**
 * Resolve icon + title for each unique URL once, then map back to all rows (faster when the same
 * URL appears in multiple categories). Results are cached on disk under `.cache/link-grid-fetch.json`.
 * Skips network entirely for a URL when every row has a local `iconImagePath` on disk and an
 * explicit JSON title (so titles are not re-fetched).
 */
async function resolveIcons(pages, concurrency = DEFAULT_CONCURRENCY) {
  const cwd = process.cwd();
  const urlKeys = [];
  const seen = new Set();
  for (const p of pages) {
    const key = canonicalPageUrl(p.url) ?? p.url.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (pageNeedsNetworkForUrl(pages, key, cwd)) urlKeys.push(key);
  }

  const urlToResult = new Map();
  let index = 0;

  async function worker() {
    while (index < urlKeys.length) {
      const currentIndex = index++;
      const urlKey = urlKeys[currentIndex];
      const result = await resolveIconAndTitleForUrl(urlKey);
      urlToResult.set(urlKey, result);
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);
  flushLinkGridFetchCache();

  const items = pages.map((p) => {
    const key = canonicalPageUrl(p.url) ?? p.url.trim();
    const { iconUrl: fetchedIcon, pageTitle } = urlToResult.get(key) ?? {
      iconUrl: "",
      pageTitle: null,
    };
    const localIcon =
      p.useImage !== false && p.iconImagePath?.trim() && isPublicLinkIconPath(p.iconImagePath.trim())
        ? p.iconImagePath.trim()
        : null;
    const iconUrl =
      p.useImage === false
        ? null
        : (fetchedIcon && String(fetchedIcon).trim()) || localIcon || null;

    return {
      url: p.url,
      title: displayTitleForUrl(p.url, p.title, pageTitle),
      iconUrl,
      category: p.category,
      fallbackColor: p.fallbackColor,
      useImage: p.useImage !== false,
    };
  });

  return { items, urlToResult };
}

export async function buildLinkGridCategories() {
  await ensureFallbackColorsInPagesJson();
  await ensureLocalIconImagesInPagesJson();
  const pages = await loadPagesJson();
  const { items, urlToResult } = await resolveIcons(pages);
  await persistFetchedTitlesInPagesJson(urlToResult);

  const categoryOrder = [];
  const categoryToItems = new Map();
  for (const item of items) {
    const category = item.category;
    if (!categoryToItems.has(category)) {
      categoryToItems.set(category, []);
      categoryOrder.push(category);
    }
    categoryToItems.get(category).push(item);
  }

  return { categoryOrder, categoryToItems };
}
