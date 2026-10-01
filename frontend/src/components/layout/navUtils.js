import { navGroups } from './navigationConfig';

const normalise = (path) => {
  if (!path) return '/';
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
};

/** Flat route list — powers the command palette and mobile drawer. */
export const flatNavItems = navGroups.flatMap((group) =>
  group.items.flatMap((item) => [
    { name: item.name, path: item.path, icon: item.icon, group: group.group },
    ...(item.children || []).map((child) => ({
      name: child.name,
      path: child.path,
      icon: child.icon || item.icon,
      group: group.group,
      isChild: true,
    })),
  ])
);

/** True when `pathname` belongs to `path` (exact or nested route). */
export function matchesPath(pathname, path) {
  const current = normalise(pathname);
  const target = normalise(path);
  if (target === '/') return current === '/';
  return current === target || current.startsWith(`${target}/`);
}

/** The nav item whose route (or one of its children) matches the current URL. */
export function findActiveItem(pathname) {
  for (const group of navGroups) {
    for (const item of group.items) {
      const candidates = [item.path, ...(item.children || []).map((c) => c.path)];
      if (candidates.some((candidate) => matchesPath(pathname, candidate))) {
        return { group, item };
      }
    }
  }
  return { group: null, item: null };
}

/** Breadcrumb trail for the topbar: Group / Item / Child. */
export function getBreadcrumbs(pathname) {
  const { group, item } = findActiveItem(pathname);
  if (!item) return [{ label: 'Dashboard', path: '/dashboard' }];

  const crumbs = [{ label: group.group, path: null }, { label: item.name, path: item.path }];
  const child = (item.children || []).find((c) => normalise(c.path) === normalise(pathname));

  if (child && child.name !== item.name) {
    crumbs.push({ label: child.name, path: child.path });
  } else if (/^\/content\/[^/]+\/dna$/.test(pathname)) {
    crumbs.push({ label: 'Content DNA', path: pathname });
  } else if (/^\/content\/[^/]+$/.test(pathname)) {
    crumbs.push({ label: 'Content Detail', path: pathname });
  }

  return crumbs;
}
