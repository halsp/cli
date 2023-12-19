set -e
ts-node scripts/ts-node-unpatch.ts
npx tsc scripts/add-shims.ts --target es2022 --esModuleInterop --module commonjs
mv scripts/add-shims.js scripts/add-shims.cjs
ts-node scripts/ts-node-patch.ts