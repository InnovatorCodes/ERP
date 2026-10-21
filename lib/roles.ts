// Role and route access rules shared by middleware, the sidebar and server
// actions. No server-only imports here: middleware and client code use it too.

export type UserRole = 'admin' | 'manager' | 'production manager' | 'sales coordinator';

export const USER_ROLES: readonly UserRole[] = ['admin', 'manager', 'production manager', 'sales coordinator'];

export const ROLES = {
  ADMIN: ['admin'],
  MANAGEMENT: ['admin', 'manager'],
  SALES: ['admin', 'manager', 'sales coordinator'],
  PRODUCTION: ['admin', 'manager', 'production manager'],
  STAFF: USER_ROLES,
} as const satisfies Record<string, readonly UserRole[]>;

// Every protected page and API route, with the roles allowed to open it.
// The API routes check the same roles again themselves.
export const ROUTE_ACCESS: Record<string, readonly UserRole[]> = {
  '/dashboard': ROLES.MANAGEMENT,
  '/customers': ROLES.SALES,
  '/products': ROLES.SALES,
  '/place-order': ROLES.SALES,
  '/view-orders': ROLES.PRODUCTION,
  '/order-history': ROLES.MANAGEMENT,
  '/employees': ROLES.ADMIN,
  '/api/export-customers': ROLES.SALES,
  '/api/export-products': ROLES.SALES,
  '/api/export-orders': ROLES.PRODUCTION,
  '/api/export-order-history': ROLES.MANAGEMENT,
};

const HOME_PATH: Record<UserRole, string> = {
  admin: '/dashboard',
  manager: '/dashboard',
  'production manager': '/view-orders',
  'sales coordinator': '/customers',
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

/** The page a role lands on after login, and when it opens a page it can't access. */
export function homePathFor(role: UserRole): string {
  return HOME_PATH[role];
}

/** The access rule for a path (matching sub-paths too), or undefined if the path isn't listed. */
export function routeRolesFor(pathname: string): readonly UserRole[] | undefined {
  const route = Object.keys(ROUTE_ACCESS).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return route ? ROUTE_ACCESS[route] : undefined;
}

export function canAccess(role: UserRole | null | undefined, pathname: string): boolean {
  const allowed = routeRolesFor(pathname);
  return !!role && !!allowed && allowed.includes(role);
}
