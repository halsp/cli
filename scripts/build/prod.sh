set -e

sh scripts/remove-dist.sh

tsc

cd enter
npx tsc
cd ..
