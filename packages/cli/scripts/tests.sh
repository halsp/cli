set -e

npm install
cd src/enter && npm install && cd ../..

npm run build
rm -f ./package-lock.json
npm install

npm run lint
npm run test
