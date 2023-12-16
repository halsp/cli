import type { Configuration } from "../../../../src";

export default ({ mode }) => {
  return {
    mode: mode,
    exports: 1,
  } as Configuration;
};
