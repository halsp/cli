set -e

args=""

while [ $# -gt 0 ];
do
  args="${args} $1"
  shift
done

node --no-warnings=ExperimentalWarning --loader ts-node/esm $args
