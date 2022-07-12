set -e

sh scripts/remove-dist.sh
npx ts-node scripts/cli-config.ts

tsc -p tsconfig.cli-config.json
