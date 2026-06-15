"use client";

import { useMemo } from "react";
import {
  AbilityProvider as CaslAbilityProvider,
  useAbility as useCaslAbility,
  Can,
} from "@casl/react";
import { useSession } from "@/lib/auth/auth-client";
import { AppAbility, defineAbilityFor } from "@/lib/ability";

export { Can };

export function RequireAbility({
  action,
  children,
}: {
  action: string;
  children: React.ReactNode;
}) {
  return (
    <Can I={action} a="all">
      {() => <>{children}</>}
    </Can>
  );
}

export function useAbility(): AppAbility {
  return useCaslAbility<AppAbility>();
}

function resolvePermissions(value: unknown): string[] {
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value as string[];
  }
  return [];
}

export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const ability = useMemo(
    () => defineAbilityFor(resolvePermissions(session?.user?.permissions)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.user]
  );
  return (
    <CaslAbilityProvider value={ability}>
      {children}
    </CaslAbilityProvider>
  );
}
