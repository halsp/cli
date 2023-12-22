set -e

pnpm install

npm run build

npm run lint
npm run test
