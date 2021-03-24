import { Record, Static, String } from '../';

const MyRecord = Record({ foo: String, bar: String }).asPartial();
type MyRecord = Static<typeof MyRecord>;

const validRecord: MyRecord = { foo: 'foo', bar: 'bar' };
const validRecord2: MyRecord = {};
const invalidRecord = 'Oh hai, mark!';

describe('record', () => {
  describe('check', () => {
    it('does not throw for a valid record', () => {
      expect(() => MyRecord.check(validRecord)).not.toThrow();
      expect(() => MyRecord.check(validRecord2)).not.toThrow();
    });
    it('throws for an invalid record', () => {
      expect(() => MyRecord.check(invalidRecord)).toThrow();
      expect(() => MyRecord.check([invalidRecord])).toThrow();
    });
  });
  describe('guard', () => {
    it('returns true for a valid record', () => {
      expect(MyRecord.guard(validRecord)).toBe(true);
      expect(MyRecord.guard(validRecord2)).toBe(true);
    });
    it('returns false for an invalid record', () => {
      expect(MyRecord.guard(invalidRecord)).toBe(false);
      expect(MyRecord.guard([invalidRecord])).toBe(false);
    });
  });
});
