set -e

npm install
npm run update-config

npm run build
rm -f ./package-lock.json
npm install

npm run lint
npm run test
