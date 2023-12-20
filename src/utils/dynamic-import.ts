export const dynamicImport = new Function(
  "specifier",
  `return import(specifier);
  `,
) as <T = any>(specifier: string) => Promise<T>;

export async function dynamicImportDefault<T = any>(specifier: string) {
  const module = await dynamicImport(specifier);
  return module.default as T;
}
