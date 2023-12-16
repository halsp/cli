set -e
npx tsc scripts/transpiler.ts --target es2022 --esModuleInterop --module commonjs
mv scripts/transpiler.js scripts/transpiler.cjs
ts-node scripts/ts-node-patch.ts