set -e

npm install
cd enter && npm install && cd ..
npm run build

node bin/index.js create minimal -e http -pm npm -ps inject,router,view,mva,pipe,filter,testing,static,swagger,jwt -f
cd minimal
npx sfa build

git config --global user.email hi@hal.wang
git config --global user.name hal-wang
git init -b minimal
git add -A
git commit -m "create"