set -e

npm run build

mv minimal.README.md README.md
node bin/cli.js create minimal -e http -pm npm -ps inject,router,view,mva,pipe,filter,testing,static,swagger,jwt,validator -f -sg -sr
cd minimal
npx ipare build

git config --global user.email hi@hal.wang
git config --global user.name hal-wang
git init -b minimal
git add -A
git commit -m "create"