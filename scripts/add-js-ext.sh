set -e
npx tsc scripts/add-js-ext.ts --target es2022 --esModuleInterop --module commonjs
mv scripts/add-js-ext.js scripts/add-js-ext.cjs
ts-node scripts/ts-node-patch.ts