set -e

npx tsc -p tsconfig.cli-config.json
mv dist/index.js node_modules/@ipare/cli-config/dist/index.js
mv dist/index.d.ts node_modules/@ipare/cli-config/dist/index.d.ts