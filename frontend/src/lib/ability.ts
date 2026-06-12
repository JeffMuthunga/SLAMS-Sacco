import { createMongoAbility, MongoAbility } from "@casl/ability";

export type AppAbility = MongoAbility<[string, "all"]>;

export function defineAbilityFor(permissions: string[]): AppAbility {
  return createMongoAbility(
    permissions.map((action) => ({ action, subject: "all" }))
  );
}
