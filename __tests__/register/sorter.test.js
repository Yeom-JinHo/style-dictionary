import { expect } from 'chai';
import StyleDictionary from '../../lib/StyleDictionary.js';
import { registerSuite } from './register.suite.js';

const configFoo = {
  name: 'foo',
  sorter: (a, b) => a.name.localeCompare(b.name),
};

registerSuite({
  config: configFoo,
  registerMethod: 'registerSorter',
  prop: 'sorters',
});

describe('register', () => {
  describe('sorter', () => {
    const StyleDictionaryExtended = new StyleDictionary({});

    it('should error if name is not a string', () => {
      expect(() => {
        StyleDictionaryExtended.registerSorter({
          sorter: function () {},
        });
      }).to.throw("Can't register sorter; sorter.name must be a string");

      expect(() => {
        StyleDictionaryExtended.registerSorter({
          name: 1,
          sorter: function () {},
        });
      }).to.throw("Can't register sorter; sorter.name must be a string");

      expect(() => {
        StyleDictionaryExtended.registerSorter({
          name: [],
          sorter: function () {},
        });
      }).to.throw("Can't register sorter; sorter.name must be a string");

      expect(() => {
        StyleDictionaryExtended.registerSorter({
          name: {},
          sorter: function () {},
        });
      }).to.throw("Can't register sorter; sorter.name must be a string");
    });

    it('should error if sorter is not a function', () => {
      expect(() => {
        StyleDictionaryExtended.registerSorter({
          name: 'test',
        });
      }).to.throw("Can't register sorter; sorter.sorter must be a function");

      expect(() => {
        StyleDictionaryExtended.registerSorter({
          name: 'test',
          sorter: 1,
        });
      }).to.throw("Can't register sorter; sorter.sorter must be a function");

      expect(() => {
        StyleDictionaryExtended.registerSorter({
          name: 'test',
          sorter: 'name',
        });
      }).to.throw("Can't register sorter; sorter.sorter must be a function");

      expect(() => {
        StyleDictionaryExtended.registerSorter({
          name: 'test',
          sorter: [],
        });
      }).to.throw("Can't register sorter; sorter.sorter must be a function");

      expect(() => {
        StyleDictionaryExtended.registerSorter({
          name: 'test',
          sorter: {},
        });
      }).to.throw("Can't register sorter; sorter.sorter must be a function");
    });

    it('should register a sorter and make it available', () => {
      const sorter = {
        name: 'test-sorter',
        sorter: (a, b) => a.name.localeCompare(b.name),
      };

      StyleDictionaryExtended.registerSorter(sorter);

      expect(StyleDictionaryExtended.hooks.sorters['test-sorter']).to.equal(sorter.sorter);
    });

    it('should properly pass the registered sorter to instances', async () => {
      const sorter = {
        name: 'test-sorter-extend',
        sorter: (a, b) => a.name.localeCompare(b.name),
      };

      StyleDictionaryExtended.registerSorter(sorter);
      const SDE2 = await StyleDictionaryExtended.extend({});
      expect(SDE2.hooks.sorters['test-sorter-extend']).to.equal(sorter.sorter);
    });

    it('should error when trying to register a sorter with a reserved built-in name', () => {
      expect(() => {
        StyleDictionaryExtended.registerSorter({
          name: 'name',
          sorter: (a, b) => a.name.localeCompare(b.name),
        });
      }).to.throw('is a reserved built-in sorter name');
    });

    it('should allow overwriting an already registered sorter', () => {
      const sorter1 = {
        name: 'test-overwrite',
        sorter: (a, b) => a.name.localeCompare(b.name),
      };

      const sorter2 = {
        name: 'test-overwrite',
        sorter: (a, b) => b.name.localeCompare(a.name), // reversed
      };

      StyleDictionaryExtended.registerSorter(sorter1);
      expect(StyleDictionaryExtended.hooks.sorters['test-overwrite']).to.equal(sorter1.sorter);

      // Overwrite with new sorter
      StyleDictionaryExtended.registerSorter(sorter2);
      expect(StyleDictionaryExtended.hooks.sorters['test-overwrite']).to.equal(sorter2.sorter);
      expect(StyleDictionaryExtended.hooks.sorters['test-overwrite']).to.not.equal(sorter1.sorter);
    });
  });
});
