import { expect } from 'chai';
import formattedVariables from '../../../lib/common/formatHelpers/formattedVariables.js';
import { convertTokenData } from '../../../lib/utils/convertTokenData.js';
import { propertyFormatNames } from '../../../lib/enums/index.js';

const { css, sass, less } = propertyFormatNames;

const tokens = {
  color: {
    base: {
      red: {
        400: {
          name: 'color-base-red-400',
          value: '#EF5350',
          original: { value: '#EF5350' },
          path: ['color', 'base', 'red', '400'],
        },
      },
      blue: {
        500: {
          name: 'color-base-blue-500',
          value: '#2196F3',
          original: { value: '#2196F3' },
          path: ['color', 'base', 'blue', '500'],
        },
      },
    },
  },
};

describe('formatHelpers', () => {
  describe('formattedVariables', () => {
    it('should format variables with CSS format and match snapshot', async () => {
      const dictionary = {
        tokens,
        allTokens: convertTokenData(tokens, { output: 'array' }),
        unfilteredTokens: tokens,
      };

      const result = formattedVariables({
        format: css,
        dictionary,
      });

      expect(result).to.include('--color-base-red-400');
      expect(result).to.include('--color-base-blue-500');
      expect(result).to.include('#EF5350');
      expect(result).to.include('#2196F3');
      await expect(result).to.matchSnapshot(1);
    });

    it('should format variables with SASS format and match snapshot', async () => {
      const dictionary = {
        tokens,
        allTokens: convertTokenData(tokens, { output: 'array' }),
        unfilteredTokens: tokens,
      };

      const result = formattedVariables({
        format: sass,
        dictionary,
      });

      expect(result).to.include('$color-base-red-400');
      expect(result).to.include('$color-base-blue-500');
      expect(result).to.include('#EF5350');
      expect(result).to.include('#2196F3');
      await expect(result).to.matchSnapshot(2);
    });

    it('should format variables with LESS format and match snapshot', async () => {
      const dictionary = {
        tokens,
        allTokens: convertTokenData(tokens, { output: 'array' }),
        unfilteredTokens: tokens,
      };

      const result = formattedVariables({
        format: less,
        dictionary,
      });

      expect(result).to.include('@color-base-red-400');
      expect(result).to.include('@color-base-blue-500');
      expect(result).to.include('#EF5350');
      expect(result).to.include('#2196F3');
      await expect(result).to.matchSnapshot(3);
    });

    it('should sort variables by name when sort option is "name" and match snapshot', async () => {
      const tokensForSort = {
        color: {
          z: {
            name: 'color-z',
            value: '#111111',
            original: { value: '#111111' },
            path: ['color', 'z'],
          },
          a: {
            name: 'color-a',
            value: '#000000',
            original: { value: '#000000' },
            path: ['color', 'a'],
          },
        },
      };

      // convertTokenData preserves insertion order: z comes before a, so result is [z, a] (not alphabetical)
      const allTokensForSort = convertTokenData(tokensForSort, { output: 'array' });

      const dictionary = {
        tokens: tokensForSort,
        allTokens: allTokensForSort,
        unfilteredTokens: tokensForSort,
      };

      const result = formattedVariables({
        format: css,
        dictionary,
        sort: 'name',
      });

      // ensure "--color-a" comes before "--color-z"
      expect(result.indexOf('--color-a')).to.be.lessThan(result.indexOf('--color-z'));
      await expect(result).to.matchSnapshot(4);
    });

    it('should accept sort as an array and chain as tie-breakers (custom -> name)', () => {
      const tokensForChain = {
        color: {
          // different value => custom sorter decides regardless of name
          // Placed first to verify it gets sorted down (would be wrong position if sorting fails)
          c: {
            name: 'm-diff',
            value: '#111111',
            original: { value: '#111111' },
            path: ['color', 'c'],
          },
          // same value => custom sorter returns 0, so "name" decides order
          a: {
            name: 'z-same',
            value: '#000000',
            original: { value: '#000000' },
            path: ['color', 'a'],
          },
          b: {
            name: 'a-same',
            value: '#000000',
            original: { value: '#000000' },
            path: ['color', 'b'],
          },
        },
      };

      // primary sorter: value
      const byValue = (t1, t2) => String(t1.value).localeCompare(String(t2.value));

      const dictionary = {
        tokens: tokensForChain,
        allTokens: convertTokenData(tokensForChain, { output: 'array' }),
        unfilteredTokens: tokensForChain,
      };

      const result = formattedVariables({
        format: css,
        dictionary,
        sort: [byValue, 'name'],
      });

      // '#000000' group first; within the group, "name" sorts a-same before z-same
      expect(result.indexOf('--a-same')).to.be.lessThan(result.indexOf('--z-same'));
      // '#111111' should come after '#000000' regardless of name
      expect(result.indexOf('--z-same')).to.be.lessThan(result.indexOf('--m-diff'));
    });

    it('should keep reference-safe ordering first when outputReferences=true even if sort="name"', () => {
      // semantic is defined before base (insertion order), but semantic references base
      // name order is also "a-semantic" before "z-base"
      const tokensWithRef = {
        color: {
          semantic: {
            primary: {
              name: 'a-semantic',
              value: '{color.base.red.400.value}',
              original: { value: '{color.base.red.400.value}' },
              path: ['color', 'semantic', 'primary'],
            },
          },
          base: {
            red: {
              400: {
                name: 'z-base',
                value: '#EF5350',
                original: { value: '#EF5350' },
                path: ['color', 'base', 'red', '400'],
              },
            },
          },
        },
      };

      const dictionary = {
        tokens: tokensWithRef,
        unfilteredTokens: tokensWithRef,
        allTokens: convertTokenData(tokensWithRef, { output: 'array' }),
      };

      // Test with outputReferences: true - reference-safe order takes precedence
      const resultWithRefs = formattedVariables({
        format: css,
        dictionary,
        outputReferences: true,
        sort: 'name', // would normally put a-semantic first, but outputReferences requires reference-safe order
      });

      // base definition must appear before the referencing token
      expect(resultWithRefs.indexOf('--z-base')).to.be.lessThan(
        resultWithRefs.indexOf('--a-semantic'),
      );
      // should output reference
      expect(resultWithRefs).to.include('var(--z-base)');

      // Test with outputReferences: false - name sorting should apply
      const resultWithoutRefs = formattedVariables({
        format: css,
        dictionary,
        outputReferences: false,
        sort: 'name',
      });

      // name order should apply: a-semantic comes before z-base
      expect(resultWithoutRefs.indexOf('--a-semantic')).to.be.lessThan(
        resultWithoutRefs.indexOf('--z-base'),
      );
      // should output raw value, not reference
      expect(resultWithoutRefs).to.include('{color.base.red.400.value}');
      expect(resultWithoutRefs).to.not.include('var(--z-base)');
    });

    it('should output references when outputReferences=true and match snapshot', async () => {
      const tokensWithRef = {
        color: {
          base: {
            red: {
              400: {
                name: 'color-base-red-400',
                value: '#EF5350',
                original: { value: '#EF5350' },
                path: ['color', 'base', 'red', '400'],
              },
            },
          },
          semantic: {
            primary: {
              name: 'color-semantic-primary',
              value: '{color.base.red.400.value}',
              original: { value: '{color.base.red.400.value}' },
              path: ['color', 'semantic', 'primary'],
            },
          },
        },
      };

      const dictionary = {
        tokens: tokensWithRef,
        unfilteredTokens: tokensWithRef,
        allTokens: convertTokenData(tokensWithRef, { output: 'array' }),
      };

      const result = formattedVariables({
        format: css,
        dictionary,
        outputReferences: true,
      });

      expect(result).to.include('--color-base-red-400: #EF5350');
      expect(result).to.include('var(--color-base-red-400)');
      await expect(result).to.matchSnapshot(5);
    });

    it('should throw for invalid sort option (fail loudly)', () => {
      const dictionary = {
        tokens,
        allTokens: convertTokenData(tokens, { output: 'array' }),
        unfilteredTokens: tokens,
      };

      let error;
      try {
        formattedVariables({
          format: css,
          dictionary,
          sort: 'naem',
        });
      } catch (err) {
        error = err;
      }

      expect(error, 'Expected formattedVariables() to throw').to.exist;
      expect(String(error)).to.include('Invalid "sort" option');
    });

    it('should throw for invalid sort option type', () => {
      const dictionary = {
        tokens,
        allTokens: convertTokenData(tokens, { output: 'array' }),
        unfilteredTokens: tokens,
      };

      let error;
      try {
        formattedVariables({
          format: css,
          dictionary,
          sort: 123, // invalid type
        });
      } catch (err) {
        error = err;
      }

      expect(error, 'Expected formattedVariables() to throw').to.exist;
      expect(String(error)).to.include('Invalid "sort" option type');
    });

    it('should use custom lineSeparator from formatting options', () => {
      const dictionary = {
        tokens,
        allTokens: convertTokenData(tokens, { output: 'array' }),
        unfilteredTokens: tokens,
      };

      const result = formattedVariables({
        format: css,
        dictionary,
        formatting: {
          lineSeparator: '\n\n',
        },
      });

      // Should have double newlines between variables
      // Note: CSS format may include indentation, so we check for the pattern more flexibly
      const lines = result.split('\n\n');
      expect(lines.length).to.be.greaterThan(1);
      expect(result).to.include('--color-base-red-400');
      expect(result).to.include('--color-base-blue-500');
    });

    it('should handle themeable tokens with SASS format', () => {
      const themeableTokens = {
        color: {
          base: {
            red: {
              400: {
                name: 'color-base-red-400',
                value: '#EF5350',
                original: { value: '#EF5350' },
                path: ['color', 'base', 'red', '400'],
                themeable: true,
              },
            },
          },
        },
      };

      const allTokens = convertTokenData(themeableTokens, { output: 'array' });
      allTokens[0].themeable = true;

      const dictionary = {
        tokens: themeableTokens,
        allTokens,
        unfilteredTokens: themeableTokens,
      };

      const result = formattedVariables({
        format: sass,
        dictionary,
        themeable: true,
      });

      expect(result).to.include('!default');
    });
  });
});
