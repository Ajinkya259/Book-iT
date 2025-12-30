import { describe, it, expect } from 'vitest';
import { cn, formatPrice, formatTime, slugify } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (classnames)', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false })).toBe('foo');
    });
  });

  describe('formatPrice', () => {
    it('should format USD prices correctly', () => {
      expect(formatPrice(25)).toBe('$25.00');
    });

    it('should format cents correctly', () => {
      expect(formatPrice(25.5)).toBe('$25.50');
    });

    it('should format zero correctly', () => {
      expect(formatPrice(0)).toBe('$0.00');
    });

    it('should format large numbers correctly', () => {
      expect(formatPrice(1000)).toBe('$1,000.00');
    });

    it('should format with different currency', () => {
      expect(formatPrice(25, 'EUR')).toContain('25');
    });
  });

  describe('formatTime', () => {
    it('should format 24h time to 12h format', () => {
      expect(formatTime('09:00')).toBe('9:00 AM');
    });

    it('should format noon correctly', () => {
      expect(formatTime('12:00')).toBe('12:00 PM');
    });

    it('should format afternoon time correctly', () => {
      expect(formatTime('14:30')).toBe('2:30 PM');
    });

    it('should format midnight correctly', () => {
      expect(formatTime('00:00')).toBe('12:00 AM');
    });

    it('should format evening time correctly', () => {
      expect(formatTime('23:59')).toBe('11:59 PM');
    });
  });

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('foo bar baz')).toBe('foo-bar-baz');
    });

    it('should remove special characters', () => {
      expect(slugify("John's Barber Shop!")).toBe('johns-barber-shop');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('foo   bar')).toBe('foo-bar');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(slugify('  hello world  ')).toBe('hello-world');
    });

    it('should handle numbers', () => {
      expect(slugify('Shop 123')).toBe('shop-123');
    });

    it('should handle unicode characters', () => {
      expect(slugify('Café Délice')).toBe('caf-dlice');
    });

    it('should limit length', () => {
      const longName = 'A'.repeat(100);
      expect(slugify(longName).length).toBeLessThanOrEqual(50);
    });
  });
});

describe('Slug Generation for Vendors', () => {
  function generateSlug(businessName: string): string {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  it('should generate valid slug from business name', () => {
    expect(generateSlug('Acme Barber Shop')).toBe('acme-barber-shop');
  });

  it('should handle apostrophes', () => {
    expect(generateSlug("Joe's Haircuts")).toBe('joe-s-haircuts');
  });

  it('should handle ampersand', () => {
    expect(generateSlug('Cut & Style')).toBe('cut-style');
  });

  it('should handle numbers in name', () => {
    expect(generateSlug('Studio 54')).toBe('studio-54');
  });

  it('should handle all caps', () => {
    expect(generateSlug('THE BEST SALON')).toBe('the-best-salon');
  });

  it('should produce URL-safe slugs', () => {
    const slug = generateSlug('Test Business Name!@#$%');
    expect(/^[a-z0-9-]+$/.test(slug)).toBe(true);
  });
});
