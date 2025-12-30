import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Supabase Client', () => {
  describe('Anonymous Client', () => {
    let supabase: ReturnType<typeof createClient>;

    beforeAll(() => {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    });

    it('should create client successfully', () => {
      expect(supabase).toBeDefined();
    });

    it('should have auth module', () => {
      expect(supabase.auth).toBeDefined();
    });

    it('should have from method for database queries', () => {
      expect(supabase.from).toBeDefined();
      expect(typeof supabase.from).toBe('function');
    });

    it('should get session (null when not logged in)', async () => {
      const { data, error } = await supabase.auth.getSession();
      expect(error).toBeNull();
      expect(data.session).toBeNull();
    });

    it('should query categories table', async () => {
      const { data, error } = await supabase.from('categories').select('*').limit(5);
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Service Role Client', () => {
    let supabase: ReturnType<typeof createClient>;

    beforeAll(() => {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    });

    it('should create admin client successfully', () => {
      expect(supabase).toBeDefined();
    });

    it('should have admin auth methods', () => {
      expect(supabase.auth.admin).toBeDefined();
    });

    it('should list users (admin only)', async () => {
      const { data, error } = await supabase.auth.admin.listUsers();
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
    });
  });

  describe('Auth Operations', () => {
    let supabase: ReturnType<typeof createClient>;
    let testUserId: string | null = null;
    const testEmail = `auth-test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    beforeAll(() => {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    });

    afterAll(async () => {
      if (testUserId) {
        await supabase.auth.admin.deleteUser(testUserId);
      }
    });

    it('should create a new user', async () => {
      const { data, error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(testEmail);
      testUserId = data.user?.id ?? null;
    });

    it('should sign in with password', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(testEmail);
      expect(data.session).toBeDefined();
    });

    it('should fail sign in with wrong password', async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'wrongpassword',
      });

      expect(error).not.toBeNull();
    });

    it('should sign out', async () => {
      // First sign in
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      // Then sign out
      const { error } = await supabase.auth.signOut();
      expect(error).toBeNull();
    });

    it('should get user by id', async () => {
      const { data, error } = await supabase.auth.admin.getUserById(testUserId!);

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.id).toBe(testUserId);
    });

    it('should delete user', async () => {
      const { error } = await supabase.auth.admin.deleteUser(testUserId!);
      expect(error).toBeNull();
      testUserId = null;
    });
  });
});
