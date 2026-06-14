import { createMongoAbility, MongoAbility } from "@casl/ability";

export type AppAbility = MongoAbility<[string, "all"]>;

/**
 * Builds a CASL ability from the permissions array on the session user.
 * AbilityContext reads session?.user?.permissions (string[]) and passes it here.
 * Each permission (e.g. "manage_members") becomes a CASL rule: can(permission, "all").
 * Custom roles created via /admin/configurations/roles are included automatically
 * because the /me endpoint returns all granted permissions regardless of role source.
 */
export function defineAbilityFor(permissions: string[]): AppAbility {
  // If user.permissions is available, use it dynamically
  if (Array.isArray(permissions) && permissions.length > 0) {
    return createMongoAbility(
      permissions.map((action) => ({ action, subject: "all" }))
    );
  }
  // Fallback: no permissions granted
  return createMongoAbility([]);
}
