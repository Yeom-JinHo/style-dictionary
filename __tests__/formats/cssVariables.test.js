import { convertTokenData } from '../../lib/utils/convertTokenData.js';
import createFormatArgs from '../../lib/utils/createFormatArgs.js';
import { expect } from 'chai';
import { formats as fileFormats } from '../../lib/enums/index.js';
import formats from '../../lib/common/formats.js';

const { cssVariables } = fileFormats;

const propertyName = 'color-base-red-400';
const propertyValue = '#EF5350';

const tokens = {
  color: {
    base: {
      red: {
        400: {
          name: propertyName,
          value: propertyValue,
          original: {
            value: propertyValue,
          },
          path: ['color', 'base', 'red', '400'],
        },
      },
    },
  },
};

const format = formats[cssVariables];

describe('formats', () => {
  describe(cssVariables, () => {
    it('should have a valid CSS syntax and match snapshot', async () => {
      const file = {
        destination: '__output/',
        format: cssVariables,
        name: 'foo',
        options: {
          selector: '.selector',
        },
      };
      const result = await format(
        createFormatArgs({
          dictionary: { tokens, allTokens: convertTokenData(tokens, { output: 'array' }) },
          file,
          platform: {},
        }),
        {},
        file,
      );
      await expect(result).to.matchSnapshot(1);
    });

    it('should have a valid CSS syntax and match snapshot when selector is an array', async () => {
      const file = {
        destination: '__output/',
        format: cssVariables,
        name: 'foo',
        options: {
          selector: ['@media screen and (min-width: 768px)', '.selector1', '.selector2'],
        },
      };

      const result = await format(
        createFormatArgs({
          dictionary: { tokens, allTokens: convertTokenData(tokens, { output: 'array' }) },
          file,
          platform: {},
        }),
        {},
        file,
      );
      await expect(result).to.matchSnapshot(2);
    });

    it('should sort variables by name when sort option is "name"', async () => {
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

      // Intentionally reverse to ensure input order is NOT already alphabetical
      const allTokensForSort = convertTokenData(tokensForSort, { output: 'array' }).reverse();

      const file = {
        destination: '__output/',
        format: cssVariables,
        name: 'foo',
        options: {
          selector: '.selector',
          sort: 'name',
        },
      };

      const result = await format(
        createFormatArgs({
          dictionary: { tokens: tokensForSort, allTokens: allTokensForSort },
          file,
          platform: {},
        }),
        {},
        file,
      );

      // ensure "--color-a" comes before "--color-z"
      expect(result.indexOf('--color-a')).to.be.lessThan(result.indexOf('--color-z'));
      await expect(result).to.matchSnapshot(3);
    });

    it('should keep reference-safe ordering first when outputReferences=true even if sort="name"', async () => {
      // semantic is defined before base (insertion order), but semantic references base
      // name order is also "a-semantic" before "z-base"
      const tokens = {
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

      const file = {
        destination: '__output/',
        format: cssVariables,
        name: 'foo',
        options: {
          selector: '.selector',
          outputReferences: true,
          sort: 'name', // would normally put a-semantic first, but outputReferences requires reference-safe order
        },
      };

      const result = await format(
        createFormatArgs({
          dictionary: {
            tokens,
            unfilteredTokens: tokens,
            allTokens: convertTokenData(tokens, { output: 'array' }),
          },
          file,
          platform: {},
        }),
        {},
        file,
      );

      // base definition must appear before the referencing token
      expect(result.indexOf('--z-base')).to.be.lessThan(result.indexOf('--a-semantic'));
    });

    it('should throw for invalid sort option (fail loudly)', async () => {
      const tokens = {
        color: {
          a: {
            name: 'a-base',
            value: '#222222',
            original: { value: '#222222' },
            path: ['color', 'a'],
          },
        },
      };

      const file = {
        destination: '__output/',
        format: cssVariables,
        name: 'foo',
        options: {
          selector: '.selector',
          sort: 'naem', // typo
        },
      };

      let error;
      try {
        await format(
          createFormatArgs({
            dictionary: {
              tokens,
              unfilteredTokens: tokens,
              allTokens: convertTokenData(tokens, { output: 'array' }),
            },
            file,
            platform: {},
          }),
          {},
          file,
        );
      } catch (err) {
        error = err;
      }
      expect(error, 'Expected format() to throw').to.exist;
      expect(String(error)).to.include('Invalid "sort" option');
    });
  });
});
