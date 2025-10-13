const DSL_SUPPORTED_EXTENSIONS = [".skr"] as const;

export function isValidDslPath(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  return DSL_SUPPORTED_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

export { DSL_SUPPORTED_EXTENSIONS };
