set -e

sh scripts/remove-dist.sh
npx ts-node scripts/create-ipare.ts
npx tsc

cd enter
npx tsc
cd ..
