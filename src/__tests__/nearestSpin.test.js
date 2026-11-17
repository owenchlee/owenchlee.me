import { expect, it } from 'vitest';
import { nearestSpin } from '../nearestSpin';

it('turns the short way round to the asked-for cabinet', () => {
  expect(nearestSpin(0, 3, 10)).toBe(3);
  expect(nearestSpin(0, 9, 10)).toBe(-1);
  expect(nearestSpin(12, 1, 10)).toBe(11);
  expect(nearestSpin(-1, 0, 10)).toBe(0);
});
