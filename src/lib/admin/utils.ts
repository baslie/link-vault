function extractRoleCandidates(source: unknown): string[] {
  if (typeof source === "string") {
    return [source];
  }

  if (Array.isArray(source)) {
    return source
      .filter((value): value is string => typeof value === "string")
      .map((value) => value);
  }

  if (source && typeof source === "object") {
    const record = source as Record<string, unknown>;
    const nestedSources = [record.role, record.roles, record.default_role, record.defaultRole];

    return nestedSources.flatMap((entry) => extractRoleCandidates(entry));
  }

  return [];
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

export function isAdminSession(session: unknown): boolean {
  if (!session || typeof session !== "object") {
    return false;
  }

  const sessionRecord = session as { user?: unknown };
  const user = sessionRecord.user;

  if (!user || typeof user !== "object") {
    return false;
  }

  const userRecord = user as Record<string, unknown>;
  const appMetadata = toRecord(userRecord.app_metadata);
  const userMetadata = toRecord(userRecord.user_metadata);

  const explicitFlags = [appMetadata["is_admin"], userMetadata["is_admin"]].some(
    (value) => value === true,
  );
  if (explicitFlags) {
    return true;
  }

  const candidateRoles = [
    appMetadata["role"],
    userMetadata["role"],
    appMetadata["default_role"],
    userMetadata["default_role"],
    appMetadata["claims"],
    userMetadata["claims"],
    appMetadata["roles"],
    userMetadata["roles"],
  ];

  return candidateRoles
    .flatMap((value) => extractRoleCandidates(value))
    .some((role) => role?.toLowerCase() === "admin");
}
