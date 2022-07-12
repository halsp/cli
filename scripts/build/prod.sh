set -e

sh scripts/remove-dist.sh

npx tsc

cd enter
npx tsc
cd ..
