import type { TransformedToken } from './DesignToken.js';

/**
 * A sorter is a function that compares two tokens and returns a number
 * indicating their relative order, following the Array.sort comparator pattern.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
 */
export type SorterFunction = (a: TransformedToken, b: TransformedToken) => number;

export interface Sorter {
  name: string;
  sorter: SorterFunction;
}

