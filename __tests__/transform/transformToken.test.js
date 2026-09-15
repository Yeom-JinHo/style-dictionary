import { expect } from 'chai';
import transformToken from '../../lib/transform/token.js';
import { transformTypes } from '../../lib/enums/index.js';
import { StopTransformError } from '../../lib/utils/stopTransformError.js';
import GroupMessages from '../../lib/utils/groupMessages.js';

const TRANSFORM_ERRORS = GroupMessages.GROUP.TransformErrors;

const { value: transformTypeValue, name, attribute } = transformTypes;

const config = {
  transforms: [
    {
      type: attribute,
      transform: function () {
        return {
          foo: 'bar',
        };
      },
    },
    {
      type: attribute,
      transform: function () {
        return { bar: 'foo' };
      },
    },
    {
      type: name,
      filter: function (prop) {
        return prop.attributes.foo === 'bar';
      },
      transform: function () {
        return 'hello';
      },
    },
  ],
};

describe('transform', () => {
  describe('token', () => {
    it('transform token and apply transforms', async () => {
      const test = await transformToken({ attributes: { baz: 'blah' } }, config, {});
      expect(test).to.have.nested.property('attributes.bar', 'foo');
      expect(test).to.have.property('name', 'hello');
    });

    it('can throw anything and handle gracefully', async () => {
      const test = await transformToken(
        { name: 'foo-bar', value: 'abc', path: ['foo', 'bar'], original: { value: 'abc' } },
        {
          transforms: [
            {
              type: transformTypeValue,
              transform: function () {
                return 'def';
              },
            },
            {
              type: transformTypeValue,
              transform: function () {
                throw 123;
              },
            },
          ],
        },
        {},
      );
      expect(test).to.have.property('value', 'def');
    });

    // This allows transformObject utility to then consider this token's transformation undefined and thus "deferred"
    it('returns a token as undefined if transitive transform dictates that the transformation has to be deferred', async () => {
      const result = await transformToken(
        {
          value: '16',
          original: {
            value: '16',
          },
        },
        {
          transforms: [
            {
              type: transformTypeValue,
              transitive: true,
              transform: () => {
                return undefined;
              },
            },
          ],
        },
        {},
      );

      expect(result).to.be.undefined;
    });

    describe('StopTransformError', () => {
      beforeEach(() => {
        GroupMessages.flush(TRANSFORM_ERRORS);
      });

      it('stops applying further transforms to a token when a transform throws StopTransformError', async () => {
        let laterValueTransformRan = false;
        let laterNameTransformRan = false;
        const result = await transformToken(
          { name: 'foo-bar', value: '16', path: ['foo', 'bar'], original: { value: '16' } },
          {
            transforms: [
              {
                type: transformTypeValue,
                transform: function () {
                  return '16px';
                },
              },
              {
                name: 'validate/custom',
                type: transformTypeValue,
                transform: function () {
                  throw new StopTransformError('token is invalid');
                },
              },
              {
                type: transformTypeValue,
                transform: function () {
                  laterValueTransformRan = true;
                  return 'should-not-be-used';
                },
              },
              {
                type: name,
                transform: function () {
                  laterNameTransformRan = true;
                  return 'should-not-be-used';
                },
              },
            ],
          },
          {},
        );

        // token keeps the state of the last successful transform
        expect(result).to.have.property('value', '16px');
        expect(result).to.have.property('name', 'foo-bar');
        expect(laterValueTransformRan).to.be.false;
        expect(laterNameTransformRan).to.be.false;
        // the error is still collected like any other transform error
        expect(GroupMessages.count(TRANSFORM_ERRORS)).to.equal(1);
        expect(GroupMessages.fetchMessages(TRANSFORM_ERRORS)[0]).to.include('token is invalid');
        expect(GroupMessages.fetchMessages(TRANSFORM_ERRORS)[0]).to.include('validate/custom');
      });

      it('still applies further transforms when a transform throws a regular error', async () => {
        const result = await transformToken(
          { name: 'foo-bar', value: 'abc', path: ['foo', 'bar'], original: { value: 'abc' } },
          {
            transforms: [
              {
                type: transformTypeValue,
                transform: function () {
                  throw new Error('boom');
                },
              },
              {
                type: transformTypeValue,
                transform: function () {
                  return 'def';
                },
              },
            ],
          },
          {},
        );

        expect(result).to.have.property('value', 'def');
        expect(GroupMessages.count(TRANSFORM_ERRORS)).to.equal(1);
      });

      it('also stops for foreign errors named StopTransformError, without an instanceof match', async () => {
        class OtherRealmStopTransformError extends Error {
          constructor(message) {
            super(message);
            this.name = 'StopTransformError';
          }
        }
        let laterTransformRan = false;
        const result = await transformToken(
          { name: 'foo-bar', value: 'abc', path: ['foo', 'bar'], original: { value: 'abc' } },
          {
            transforms: [
              {
                type: transformTypeValue,
                transform: function () {
                  throw new OtherRealmStopTransformError('duck typed stop');
                },
              },
              {
                type: transformTypeValue,
                transform: function () {
                  laterTransformRan = true;
                  return 'def';
                },
              },
            ],
          },
          {},
        );

        expect(result).to.have.property('value', 'abc');
        expect(laterTransformRan).to.be.false;
        expect(GroupMessages.count(TRANSFORM_ERRORS)).to.equal(1);
      });
    });

    // Add more tests
  });
});
