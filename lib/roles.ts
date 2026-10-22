// Role and route access rules shared by middleware, the sidebar and server
// actions. No server-only imports here: middleware and client code use it too.

/** Roles an admin can give an employee. */
export type StaffRole = 'admin' | 'manager' | 'production manager' | 'sales coordinator';

/**
 * Every role a profile can have. `demo` is the public read-only showcase
 * account: it can open every screen, but every write is refused (here and by
 * the database). It is assigned in SQL only, never from the Employees page.
 */
export type UserRole = StaffRole | 'demo';

export const USER_ROLES: readonly StaffRole[] = ['admin', 'manager', 'production manager', 'sales coordinator'];
export const DEMO_ROLE = 'demo' satisfies UserRole;

const ALL_ROLES: readonly UserRole[] = [...USER_ROLES, DEMO_ROLE];

// Who may make changes. The demo role is in none of these.
export const ROLES = {
  ADMIN: ['admin'],
  MANAGEMENT: ['admin', 'manager'],
  SALES: ['admin', 'manager', 'sales coordinator'],
  PRODUCTION: ['admin', 'manager', 'production manager'],
  STAFF: ALL_ROLES,
} as const satisfies Record<string, readonly UserRole[]>;

/** The given roles plus the read-only demo role, for pages and read-only actions. */
export function viewers(roles: readonly UserRole[]): readonly UserRole[] {
  return [...roles, DEMO_ROLE];
}

// Every protected page and API route, with the roles allowed to open it.
// The API routes check the same roles again themselves.
export const ROUTE_ACCESS: Record<string, readonly UserRole[]> = {
  '/dashboard': viewers(ROLES.MANAGEMENT),
  '/customers': viewers(ROLES.SALES),
  '/products': viewers(ROLES.SALES),
  '/place-order': viewers(ROLES.SALES),
  '/view-orders': viewers(ROLES.PRODUCTION),
  '/order-history': viewers(ROLES.MANAGEMENT),
  '/employees': viewers(ROLES.ADMIN),
  '/api/export-customers': viewers(ROLES.SALES),
  '/api/export-products': viewers(ROLES.SALES),
  '/api/export-orders': viewers(ROLES.PRODUCTION),
  '/api/export-order-history': viewers(ROLES.MANAGEMENT),
};

const HOME_PATH: Record<UserRole, string> = {
  admin: '/dashboard',
  manager: '/dashboard',
  'production manager': '/view-orders',
  'sales coordinator': '/customers',
  demo: '/dashboard',
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (ALL_ROLES as readonly string[]).includes(value);
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
