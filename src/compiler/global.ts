declare global {
  const _require: NodeRequire;
  const _resolve: (
    specifier: string,
    parent?: string | URL | undefined,
  ) => string;
}

export {};
