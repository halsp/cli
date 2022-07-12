set -e

sh scripts/remove-dist.sh
npx ts-node scripts/create-ipare.ts
tsc

cd enter
npx tsc
cd ..
