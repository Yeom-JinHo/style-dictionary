import type { Dictionary, TransformedToken } from './DesignToken.js';
import type { File } from './File.js';
import type { LocalOptions, Config, PlatformConfig } from './Config.js';
import { formats } from '../lib/enums/index.js';
import { builtInSorts } from '../lib/enums/sorts.js';
type formats = typeof formats;
type builtInSorts = typeof builtInSorts;

export interface FormatFnArguments {
  /**
   * The transformed and resolved dictionary object
   */
  dictionary: Dictionary;
  /**
   * The file configuration the format is called in
   */
  file: File;
  /**
   * The options object,
   */
  options: Config & LocalOptions;
  /**
   * The platform configuration the format is called in
   */
  platform: PlatformConfig;
}

/**
 * The format function receives an overloaded object as its arguments and
 * it should return a string, which will be written to a file.
 */
export type FormatFn = ((args: FormatFnArguments) => unknown | Promise<unknown>) & {
  nested?: boolean;
};

export interface Format {
  name: string | formats[keyof formats];
  format: FormatFn;
}

export type OutputReferences =
  | ((token: TransformedToken, options: { dictionary: Dictionary; usesDtcg?: boolean }) => boolean)
  | boolean;

/**
 * A single sort item - either a built-in sort string or a custom comparator function
 */
export type SortItem = keyof builtInSorts | ((a: TransformedToken, b: TransformedToken) => number);

/**
 * Sort option for formattedVariables - can be a single sort item or an array of sort items
 * (for chaining multiple sorters as tie-breakers)
 */
export type SortOption = SortItem | SortItem[];
