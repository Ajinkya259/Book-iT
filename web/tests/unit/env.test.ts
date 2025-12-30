import { describe, it, expect } from 'vitest';

describe('Environment Variables', () => {
  describe('Database Configuration', () => {
    it('should have DATABASE_URL defined', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).not.toBe('');
    });

    it('should have valid PostgreSQL connection string', () => {
      const dbUrl = process.env.DATABASE_URL!;
      expect(dbUrl).toMatch(/^postgresql:\/\//);
    });

    it('should connect to Supabase database', () => {
      const dbUrl = process.env.DATABASE_URL!;
      expect(dbUrl).toContain('supabase.co');
    });
  });

  describe('Supabase Configuration', () => {
    it('should have NEXT_PUBLIC_SUPABASE_URL defined', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).not.toBe('');
    });

    it('should have valid Supabase URL format', () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      expect(url).toMatch(/^https:\/\/.*\.supabase\.co$/);
    });

    it('should have NEXT_PUBLIC_SUPABASE_ANON_KEY defined', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).not.toBe('');
    });

    it('should have valid anon key format (JWT)', () => {
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      expect(key).toMatch(/^eyJ/); // JWT starts with eyJ
      expect(key.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should have SUPABASE_SERVICE_ROLE_KEY defined', () => {
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).not.toBe('');
    });

    it('should have valid service role key format (JWT)', () => {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      expect(key).toMatch(/^eyJ/);
      expect(key.split('.').length).toBe(3);
    });
  });

  describe('App Configuration', () => {
    it('should have NEXT_PUBLIC_APP_URL defined', () => {
      expect(process.env.NEXT_PUBLIC_APP_URL).toBeDefined();
    });

    it('should have valid URL format', () => {
      const url = process.env.NEXT_PUBLIC_APP_URL!;
      expect(url).toMatch(/^https?:\/\//);
    });
  });
});
