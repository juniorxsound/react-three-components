// Enable React act() environment for testing
// Empty export makes this a module, required for `declare global` to work and make TypeScript happy
export {};

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
