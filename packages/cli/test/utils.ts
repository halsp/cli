export async function runin(path: string, fn: () => void | Promise<void>) {
  const cwd = process.cwd();
  process.chdir(path);
  try {
    await fn();
  } finally {
    process.chdir(cwd);
  }
}
