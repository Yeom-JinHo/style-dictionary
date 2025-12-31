import { expect } from 'chai';
import { compileString } from 'sass';
import formats from '../../lib/common/formats.js';
import createFormatArgs from '../../lib/utils/createFormatArgs.js';
import { convertTokenData } from '../../lib/utils/convertTokenData.js';
import { formats as fileFormats } from '../../lib/enums/index.js';

const { scssVariables } = fileFormats;

const file = {
  destination: 'output.scss',
  format: scssVariables,
  name: 'foo',
};

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

const format = formats[scssVariables];

describe('formats', () => {
  describe(scssVariables, () => {
    it('should have a valid scss syntax and match snapshot', async () => {
      const result = await format(
        createFormatArgs({
          dictionary: { tokens, allTokens: convertTokenData(tokens, { output: 'array' }) },
          file,
          platform: {},
        }),
        {},
        file,
      );
      const scssResult = compileString(result);
      await expect(result).to.matchSnapshot(1);
      await expect(scssResult.css).to.matchSnapshot(2);
    });

    it('should optionally use !default', async () => {
      const themeableDictionary = {
        tokens,
        allTokens: convertTokenData(tokens, { output: 'array' }),
      };
      const formattedScss = await format(
        createFormatArgs({
          dictionary: { tokens, allTokens: convertTokenData(tokens, { output: 'array' }) },
          file,
          platform: {},
        }),
        {},
        file,
      );

      expect(formattedScss).not.to.match(new RegExp('!default;'));

      themeableDictionary.allTokens[0].themeable = true;
      const themeableScss = await format(
        createFormatArgs({
          dictionary: themeableDictionary,
          file,
          platform: {},
        }),
        {},
        file,
      );

      expect(themeableScss).to.match(new RegExp('#EF5350 !default;'));
    });

    it('should sort variables by name when options.sort = "name"', async () => {
      const tokensForSort = {
        color: {
          z: {
            name: 'z-base',
            value: '#111111',
            original: { value: '#111111' },
            path: ['color', 'z'],
          },
          a: {
            name: 'a-base',
            value: '#222222',
            original: { value: '#222222' },
            path: ['color', 'a'],
          },
        },
      };

      const fileWithSort = {
        ...file,
        options: {
          sort: 'name',
        },
      };

      const result = await format(
        createFormatArgs({
          dictionary: {
            tokens: tokensForSort,
            unfilteredTokens: tokensForSort,
            allTokens: convertTokenData(tokensForSort, { output: 'array' }),
          },
          file: fileWithSort,
          platform: {},
        }),
        {},
        fileWithSort,
      );

      // SCSS variables: "$a-base:" should come before "$z-base:"
      expect(result.indexOf('$a-base')).to.be.lessThan(result.indexOf('$z-base'));

      const scssResult = compileString(result);
      await expect(result).to.matchSnapshot(3);
      expect(scssResult.css).to.not.be.undefined;
    });

    it('should keep reference-safe ordering when outputReferences=true even if sort="name"', async () => {
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

      const fileWithRefsAndSort = {
        ...file,
        options: {
          outputReferences: true,
          sort: 'name',
        },
      };

      const result = await format(
        createFormatArgs({
          dictionary: {
            tokens: tokensWithRef,
            unfilteredTokens: tokensWithRef,
            allTokens: convertTokenData(tokensWithRef, { output: 'array' }),
          },
          file: fileWithRefsAndSort,
          platform: {},
        }),
        {},
        fileWithRefsAndSort,
      );

      // base must be defined before it is referenced
      expect(result.indexOf('$z-base')).to.be.lessThan(result.indexOf('$a-semantic'));
      compileString(result); // still valid SCSS
    });

    it('should accept sort as an array (e.g. ["reference", "name"])', async () => {
      const tokensWithRef = {
        color: {
          semantic: {
            primary: {
              name: 'b-semantic',
              value: '{color.base.red.400.value}',
              original: { value: '{color.base.red.400.value}' },
              path: ['color', 'semantic', 'primary'],
            },
          },
          base: {
            red: {
              400: {
                name: 'a-base',
                value: '#EF5350',
                original: { value: '#EF5350' },
                path: ['color', 'base', 'red', '400'],
              },
            },
          },
        },
      };

      const fileWithArraySort = {
        ...file,
        options: {
          outputReferences: true,
          sort: ['reference', 'name'],
        },
      };

      const result = await format(
        createFormatArgs({
          dictionary: {
            tokens: tokensWithRef,
            unfilteredTokens: tokensWithRef,
            allTokens: convertTokenData(tokensWithRef, { output: 'array' }),
          },
          file: fileWithArraySort,
          platform: {},
        }),
        {},
        fileWithArraySort,
      );

      // still reference-safe
      expect(result.indexOf('$a-base')).to.be.lessThan(result.indexOf('$b-semantic'));
      compileString(result);
    });
  });
});
