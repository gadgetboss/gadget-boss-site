import { describe, expect, it } from 'vitest';
import {
  isValidGhanaPhone,
  maskPhone,
  normalizeGhanaPhone,
  phoneVariants,
} from '../src/auth/phone';

describe('normalizeGhanaPhone', () => {
  it('accepts the local 10-digit form', () => {
    expect(normalizeGhanaPhone('0241234567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('0551234567')).toBe('+233551234567');
  });

  it('accepts the bare 9-digit subscriber number', () => {
    expect(normalizeGhanaPhone('241234567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('501234567')).toBe('+233501234567');
  });

  it('accepts E.164 and the country code without a plus', () => {
    expect(normalizeGhanaPhone('+233241234567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('233241234567')).toBe('+233241234567');
  });

  it('drops a leading 00 international prefix', () => {
    expect(normalizeGhanaPhone('00233241234567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('00233 024 123 4567')).toBe('+233241234567');
  });

  it('drops a leading 0 that follows the country code', () => {
    expect(normalizeGhanaPhone('2330241234567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('+2330241234567')).toBe('+233241234567');
  });

  it('ignores spaces, dashes, parens and dots', () => {
    expect(normalizeGhanaPhone('024 123 4567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('024-123-4567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('(024) 123 4567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('+233 (24) 123-4567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('  024.123.4567  ')).toBe('+233241234567');
  });

  it('covers every common GH mobile prefix', () => {
    for (const local of [
      '0201234567',
      '0231234567',
      '0241234567',
      '0251234567',
      '0261234567',
      '0271234567',
      '0281234567',
      '0501234567',
      '0531234567',
      '0541234567',
      '0551234567',
      '0561234567',
      '0571234567',
      '0591234567',
    ]) {
      expect(normalizeGhanaPhone(local)).toBe(`+233${local.slice(1)}`);
    }
  });

  it('rejects junk, wrong lengths and implausible prefixes', () => {
    expect(normalizeGhanaPhone('')).toBeNull();
    expect(normalizeGhanaPhone('   ')).toBeNull();
    expect(normalizeGhanaPhone('024123456')).toBeNull(); // one digit short
    expect(normalizeGhanaPhone('02412345678')).toBeNull(); // one digit long
    expect(normalizeGhanaPhone('12345')).toBeNull();
    expect(normalizeGhanaPhone('not a phone')).toBeNull();
    expect(normalizeGhanaPhone('0000000000')).toBeNull();
    expect(normalizeGhanaPhone('0111234567')).toBeNull(); // landline, not mobile
    expect(normalizeGhanaPhone('0301234567')).toBeNull(); // Accra landline
    expect(normalizeGhanaPhone('+2348012345678')).toBeNull(); // Nigeria
    expect(normalizeGhanaPhone(null)).toBeNull();
    expect(normalizeGhanaPhone(undefined)).toBeNull();
  });

  it('exposes a boolean helper', () => {
    expect(isValidGhanaPhone('0241234567')).toBe(true);
    expect(isValidGhanaPhone('0301234567')).toBe(false);
  });
});

describe('phoneVariants', () => {
  it('returns every stored spelling for legacy row matching', () => {
    expect(phoneVariants('+233241234567')).toEqual([
      '+233241234567',
      '233241234567',
      '0241234567',
      '241234567',
    ]);
  });

  it('accepts any input form and still returns the canonical variants', () => {
    expect(phoneVariants('024 123 4567')).toEqual(phoneVariants('+233241234567'));
  });

  it('returns an empty list for invalid input', () => {
    expect(phoneVariants('nope')).toEqual([]);
  });
});

describe('maskPhone', () => {
  it('masks the middle of the subscriber number', () => {
    expect(maskPhone('+233241234567')).toBe('+233 24 *** 4567');
    expect(maskPhone('0551234567')).toBe('+233 55 *** 4567');
  });

  it('returns an empty string for invalid input', () => {
    expect(maskPhone('nope')).toBe('');
  });
});
