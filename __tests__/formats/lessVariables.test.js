import { expect } from 'chai';
import formats from '../../lib/common/formats.js';
import createFormatArgs from '../../lib/utils/createFormatArgs.js';
import { convertTokenData } from '../../lib/utils/convertTokenData.js';
import { isNode } from '../../lib/utils/isNode.js';
import { formats as fileFormats } from '../../lib/enums/index.js';

const { lessVariables } = fileFormats;

const file = {
  destination: 'output.less',
  format: lessVariables,
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

const format = formats[lessVariables];

describe('formats', () => {
  describe(lessVariables, () => {
    it('should have a valid less syntax and match snapshot', async () => {
      const result = await format(
        createFormatArgs({
          dictionary: { tokens, allTokens: convertTokenData(tokens, { output: 'array' }) },
          file,
          platform: {},
        }),
        {},
        file,
      );
      let _less;
      if (!isNode) {
        await import('less/dist/less.js');
        // eslint-disable-next-line no-undef
        _less = less;
      } else {
        _less = (await import('less')).default;
      }
      const lessResult = await _less.render(result);
      await expect(result).to.matchSnapshot(1);
      await expect(lessResult.css).to.matchSnapshot(2);
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

      // LESS variables: "@a-base:" should come before "@z-base:"
      expect(result.indexOf('@a-base')).to.be.lessThan(result.indexOf('@z-base'));

      // Snapshot for output stability
      await expect(result).to.matchSnapshot(3);
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

      // base must come before semantic (define-before-use)
      expect(result.indexOf('@z-base')).to.be.lessThan(result.indexOf('@a-semantic'));

      // still valid LESS
      let _less;
      if (!isNode) {
        await import('less/dist/less.js');
        // eslint-disable-next-line no-undef
        _less = less;
      } else {
        _less = (await import('less')).default;
      }
      await _less.render(result);
    });
    it('should accept sort as an array (e.g. ["name"])', async () => {
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
          sort: ['name'],
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

      expect(result.indexOf('@a-base')).to.be.lessThan(result.indexOf('@b-semantic'));

      let _less;
      if (!isNode) {
        await import('less/dist/less.js');
        // eslint-disable-next-line no-undef
        _less = less;
      } else {
        _less = (await import('less')).default;
      }
      await _less.render(result);
    });
  });
});
