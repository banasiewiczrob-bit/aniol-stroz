const APP_LINK_HOST = 'aniolstroz.com.pl';
const APP_LINK_PREFIX = '/app';

function stripAppPrefix(pathname: string) {
  if (pathname === APP_LINK_PREFIX) {
    return '/';
  }

  if (pathname.startsWith(`${APP_LINK_PREFIX}/`)) {
    return pathname.slice(APP_LINK_PREFIX.length);
  }

  return pathname;
}

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (!path) {
      return path;
    }

    if (path.startsWith('/')) {
      const [pathname, suffix = ''] = path.split(/([?#].*)/, 2);
      return `${stripAppPrefix(pathname)}${suffix}`;
    }

    const url = new URL(path);

    if (url.hostname !== APP_LINK_HOST) {
      return path;
    }

    return `${stripAppPrefix(url.pathname)}${url.search}${url.hash}`;
  } catch {
    return path;
  }
}
