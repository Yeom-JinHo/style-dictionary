import sortByName from './formatHelpers/sortByName.js';

/**
 * @typedef {import('../../types/Sorter.d.ts').SorterFunction} SorterFunction
 */

/**
 * @namespace Sorters
 */

/** @type {Record<string, SorterFunction>} */
export default {
  /**
   * Sort tokens alphabetically by name
   * @memberof Sorters
   */
  name: sortByName,
};
