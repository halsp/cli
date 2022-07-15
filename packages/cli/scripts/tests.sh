set -e

npm install

npm run build
rm -f ./package-lock.json
npm install

npm run lint
npm run test
