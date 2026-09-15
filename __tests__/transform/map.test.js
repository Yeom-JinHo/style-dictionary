import { expect } from 'chai';
import { restore, stubMethod } from 'hanbi';
import StyleDictionary from '../../lib/StyleDictionary.js';
import { transformMap } from '../../lib/transform/map.js';
import { stripMeta } from '../../lib/utils/stripMeta.js';
import groupMessages from '../../lib/utils/groupMessages.js';
import { StopTransformError } from '../../lib/utils/stopTransformError.js';

const TRANSFORM_ERRORS = groupMessages.GROUP.TransformErrors;

const sd = new StyleDictionary({
  tokens: {
    colors: {
      red: {
        500: {
          value: '#ff0000',
          type: 'color',
        },
      },
      foreground: {
        primary: {
          value: '{colors.red.500}',
          type: 'color',
        },
      },
    },
    spacing: {
      0: {
        value: 0,
        type: 'dimension',
      },
      '0p5': {
        value: 2,
        type: 'dimension',
      },
      '0p5-ref': {
        value: '{spacing.0p5}',
        type: 'dimension',
      },
      1: {
        value: 4,
        type: 'dimension',
      },
      2: {
        value: 8,
        type: 'dimension',
      },
    },
    border: {
      value: {
        width: '{spacing.0p5-ref}',
        color: '{colors.foreground.primary}',
      },
      type: 'border',
    },
  },
});

const config = {
  transforms: [
    {
      type: 'attribute',
      filter: function (token) {
        return token.name === '0';
      },
      transform: function () {
        return { foo: 'bar' };
      },
    },
    {
      type: 'attribute',
      filter: function (token) {
        return token.name === '1';
      },
      // verify async transforms to also work properly
      transform: async function () {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { bar: 'foo' };
      },
    },
    {
      type: 'value',
      filter: function (token) {
        return token.path[0] === 'spacing';
      },
      transform: function (token) {
        return token.value + 'px';
      },
    },
    {
      type: 'value',
      // transitive because we have an object value with properties
      // so the properties must be resolved before we can transform the object as a whole
      transitive: true,
      filter: function (token) {
        return token.path[0] === 'border';
      },
      transform: function (token) {
        return { ...token.value, width_plus_one: token.value.width + 1 };
      },
    },
    {
      type: 'name',
      filter: function (token) {
        return token.path.includes('foreground');
      },
      // verify async transforms to also work properly
      transform: async function () {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'transform result';
      },
    },
  ],
};

describe('transform', () => {
  describe('map', () => {
    beforeEach(() => {
      groupMessages.flush(TRANSFORM_ERRORS);
    });

    it('does not crash when called with empty map', async () => {
      const m = new Map();
      await transformMap(m, {}, {});
      expect(m).to.eql(new Map());
    });

    it('correctly transforms tokenMap and defers tokens transforms as needed', async () => {
      const transformedPropRefs = new Set();
      const deferredPropValueTransforms = new Set();
      const transformationContext = {
        transformedPropRefs,
        deferredPropValueTransforms,
      };

      await sd.hasInitialized;

      const m = structuredClone(sd.tokenMap);

      await transformMap(m, config, {}, transformationContext);
      expect([...transformedPropRefs]).to.eql([
        '{colors.red.500}',
        '{spacing.0}',
        '{spacing.1}',
        '{spacing.2}',
        '{spacing.0p5}',
      ]);
      expect([...deferredPropValueTransforms]).to.eql([
        '{colors.foreground.primary}',
        '{spacing.0p5-ref}',
        '{border}',
      ]);

      // Simulate 1 cycle of reference resolution
      m.set('{colors.foreground.primary}', {
        ...m.get('{colors.foreground.primary}'),
        value: '#ff0000',
      });
      m.set('{spacing.0p5-ref}', {
        ...m.get('{spacing.0p5-ref}'),
        value: 2,
      });
      m.set('{border}', {
        ...m.get('{border}'),
        value: {
          width: '{spacing.0p5}',
          color: '{colors.red.500}',
        },
      });

      await transformMap(m, config, {}, transformationContext);
      expect([...transformedPropRefs]).to.eql([
        '{colors.red.500}',
        '{spacing.0}',
        '{spacing.1}',
        '{spacing.2}',
        '{spacing.0p5}',
        '{colors.foreground.primary}',
        '{spacing.0p5-ref}',
      ]);
      expect([...deferredPropValueTransforms]).to.eql(['{border}']);

      // Simulate 2nd cycle of reference resolution
      m.set('{border}', {
        ...m.get('{border}'),
        value: {
          width: 2,
          color: '#ff0000',
        },
      });

      await transformMap(m, config, {}, transformationContext);
      expect([...transformedPropRefs]).to.eql([
        '{colors.red.500}',
        '{spacing.0}',
        '{spacing.1}',
        '{spacing.2}',
        '{spacing.0p5}',
        '{colors.foreground.primary}',
        '{spacing.0p5-ref}',
        '{border}',
      ]);
      expect([...deferredPropValueTransforms]).to.eql([]);

      const result = Array.from(m).map(([key, value]) => [
        key,
        stripMeta(value, { keep: ['value', 'name', 'attributes'] }),
      ]);
      await expect(JSON.stringify(result, null, 2)).to.matchSnapshot();
    });

    it('handles and collects errors from transformations', async () => {
      for (let transformType of ['attribute', 'value', 'name']) {
        const transformedPropRefs = new Set();
        const deferredPropValueTransforms = new Set();
        const transformationContext = {
          transformedPropRefs,
          deferredPropValueTransforms,
        };
        const m = new Map([
          [
            '{colors.red.500}',
            { value: 123, filePath: '/foo.json', path: ['colors', 'red', '500'] },
          ],
        ]);
        await transformMap(
          m,
          {
            transforms: [
              {
                type: transformType,
                name: `test-${transformType}-transform`,
                transform: (token) => {
                  const num = 123;
                  // .replace on number should throw
                  num.replace('', '');
                  return token.value.replace('', '');
                },
              },
            ],
          },
          transformationContext,
        );
        const token = m.get('{colors.red.500}');
        switch (transformType) {
          case 'attribute':
            expect(token.attributes).to.eql({});
            break;
          case 'value':
            expect(token.value).to.equal(123);
            break;
          case 'name':
            expect(token.name).to.equal('500');
            break;
        }
      }

      expect(groupMessages.count(TRANSFORM_ERRORS)).to.equal(3);
      await expect(
        groupMessages
          .fetchMessages(TRANSFORM_ERRORS)
          .map((m) => m.split('Object.transform')[0])
          .join('\n\n'),
      ).to.matchSnapshot();
    });

    it('stops the pipeline exactly once for a deferred (referenced) token when a transform throws StopTransformError', async () => {
      const logStub = stubMethod(console, 'log');
      try {
        const sdStop = new StyleDictionary({
          tokens: {
            size: {
              base: { value: 4, type: 'dimension' },
              ref: { value: '{size.base}', type: 'dimension' },
            },
          },
          platforms: {
            test: { transforms: ['validate/stop-on-ref'] },
          },
        });
        sdStop.registerTransform({
          name: 'validate/stop-on-ref',
          type: 'value',
          transitive: true,
          filter: (token) => token.path.includes('ref'),
          transform: () => {
            throw new StopTransformError('stop this token');
          },
        });
        const tokens = await sdStop.exportPlatform('test');

        // reference was resolved, but the throwing transform left the value untouched
        expect(tokens.size.ref.value).to.equal(4);
        expect(tokens.size.base.value).to.equal(4);
        // the error is collected and warned about exactly once at the end of the export
        expect(logStub.callCount).to.equal(1);
        expect(logStub.firstCall.args[0]).to.include(
          'Some token transformations (1) could not be applied correctly.',
        );
      } finally {
        restore();
      }
    });

    it('rejects at the end of the export when log.warnings is "error" and StopTransformError was thrown', async () => {
      const sdStop = new StyleDictionary({
        log: { warnings: 'error' },
        tokens: {
          size: {
            base: { value: 4, type: 'dimension' },
          },
        },
        platforms: {
          test: { transforms: ['validate/always-stop'] },
        },
      });
      sdStop.registerTransform({
        name: 'validate/always-stop',
        type: 'value',
        transform: () => {
          throw new StopTransformError('invalid token');
        },
      });
      await expect(sdStop.exportPlatform('test')).to.eventually.be.rejectedWith(
        'Some token transformations (1) could not be applied correctly.',
      );
    });
  });
});
