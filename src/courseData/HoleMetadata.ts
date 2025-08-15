export type HoleMeta = {
  par: number;
  handicap: number;
  yards: number;
};

// Re-export existing JS data if any; otherwise, create a typed facade that imports the JS at runtime.
// For now, import the JS module and type assert.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import raw from './HoleMetadata.js';
export const HoleMetadata = raw as Record<number, HoleMeta>;


