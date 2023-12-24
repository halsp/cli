set -e

sh scripts/ts-node.sh scripts/ts-node/ts-node-unpatch.ts
npx tsc scripts/ts-node/add-shims.ts --target es2022 --esModuleInterop --module commonjs
mv scripts/ts-node/add-shims.js scripts/ts-node/add-shims.cjs
sh scripts/ts-node.sh scripts/ts-node/ts-node-patch.ts