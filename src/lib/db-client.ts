/**
 * Legacy Supabase compatibility layer
 * This file maintains backward compatibility while transitioning to Neon DB
 * 
 * TODO: Once all code is migrated, this file can be removed
 */

// Re-export database types and functions
export * from './database';
export * from './auth';

import { query as dbQuery } from './database';
import { validateSessionToken, getUserProfile } from './auth';

// Auth state change listeners
type AuthChangeCallback = (event: string, session: any) => void;
const authListeners: AuthChangeCallback[] = [];

// Legacy Supabase client interface for backward compatibility
interface SupabaseClient {
  from: (table: string) => any;
  auth: {
    getSession: () => Promise<any>;
    getUser: (token?: string) => Promise<any>;
    onAuthStateChange: (callback: AuthChangeCallback) => { data: { subscription: { unsubscribe: () => void } } };
    signOut: () => Promise<{ error: any }>;
  };
}

// Create a compatibility wrapper that mimics Supabase client API
const createCompatibilityClient = (isServer: boolean = false): SupabaseClient => {
  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            try {
              const result = await dbQuery(
                `SELECT ${columns} FROM ${table} WHERE ${column} = $1 LIMIT 1`,
                [value]
              );
              return { data: result.rows[0] || null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          order: (column: string, options: any) => ({
            async then(resolve: any) {
              try {
                const direction = options?.ascending ? 'ASC' : 'DESC';
                const result = await dbQuery(
                  `SELECT ${columns} FROM ${table} WHERE ${column} = $1 ORDER BY ${column} ${direction}`,
                  [value]
                );
                resolve({ data: result.rows, error: null });
              } catch (error) {
                resolve({ data: null, error });
              }
            }
          })
        }),
        order: (column: string, options: any) => ({
          limit: (limitValue: number) => ({
            single: async () => {
              try {
                const direction = options?.ascending ? 'ASC' : 'DESC';
                const result = await dbQuery(
                  `SELECT ${columns} FROM ${table} ORDER BY ${column} ${direction} LIMIT ${limitValue}`,
                  []
                );
                return { data: result.rows[0] || null, error: null };
              } catch (error) {
                return { data: null, error };
              }
            },
            async then(resolve: any) {
              try {
                const direction = options?.ascending ? 'ASC' : 'DESC';
                const result = await dbQuery(
                  `SELECT ${columns} FROM ${table} ORDER BY ${column} ${direction} LIMIT ${limitValue}`,
                  []
                );
                resolve({ data: result.rows, error: null });
              } catch (error) {
                resolve({ data: null, error });
              }
            }
          }),
          async then(resolve: any) {
            try {
              const direction = options?.ascending ? 'ASC' : 'DESC';
              const result = await dbQuery(
                `SELECT ${columns} FROM ${table} ORDER BY ${column} ${direction}`,
                []
              );
              resolve({ data: result.rows, error: null });
            } catch (error) {
              resolve({ data: null, error });
            }
          }
        }),
        async then(resolve: any) {
          try {
            const result = await dbQuery(`SELECT ${columns} FROM ${table}`, []);
            resolve({ data: result.rows, error: null });
          } catch (error) {
            resolve({ data: null, error });
          }
        }
      }),
      insert: (values: any) => ({
        select: () => ({
          single: async () => {
            try {
              const keys = Object.keys(values);
              const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
              const result = await dbQuery(
                `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
                Object.values(values)
              );
              return { data: result.rows[0], error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        }),
        async then(resolve: any) {
          try {
            const keys = Object.keys(values);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const result = await dbQuery(
              `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
              Object.values(values)
            );
            resolve({ data: result.rows, error: null });
          } catch (error) {
            resolve({ data: null, error });
          }
        }
      }),
      update: (values: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              try {
                const keys = Object.keys(values);
                const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
                const result = await dbQuery(
                  `UPDATE ${table} SET ${sets} WHERE ${column} = $${keys.length + 1} RETURNING *`,
                  [...Object.values(values), value]
                );
                return { data: result.rows[0], error: null };
              } catch (error) {
                return { data: null, error };
              }
            }
          }),
          async then(resolve: any) {
            try {
              const keys = Object.keys(values);
              const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
              await dbQuery(
                `UPDATE ${table} SET ${sets} WHERE ${column} = $${keys.length + 1}`,
                [...Object.values(values), value]
              );
              resolve({ error: null });
            } catch (error) {
              resolve({ error });
            }
          }
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          async then(resolve: any) {
            try {
              await dbQuery(
                `DELETE FROM ${table} WHERE ${column} = $1`,
                [value]
              );
              resolve({ error: null });
            } catch (error) {
              resolve({ error });
            }
          }
        })
      })
    }),
    auth: {
      getSession: async () => {
        // TODO: Implement session retrieval from Neon Auth/Stack
        return { data: { session: null }, error: null };
      },
      getUser: async (token?: string) => {
        if (!token) {
          return { data: { user: null }, error: 'No token provided' };
        }
        
        try {
          const { user, error } = await validateSessionToken(token);
          return { data: { user }, error };
        } catch (error) {
          return { data: { user: null }, error };
        }
      },
      onAuthStateChange: (callback: AuthChangeCallback) => {
        // Add callback to listeners
        authListeners.push(callback);
        
        // Return subscription object
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const index = authListeners.indexOf(callback);
                if (index > -1) {
                  authListeners.splice(index, 1);
                }
              }
            }
          }
        };
      },
      signOut: async () => {
        try {
          // TODO: Implement Neon Auth sign out
          // For now, just trigger auth state change
          authListeners.forEach(callback => {
            callback('SIGNED_OUT', null);
          });
          return { error: null };
        } catch (error) {
          return { error };
        }
      }
    }
  };
};

// Export the compatibility client
export const supabase = createCompatibilityClient(false);

// Server-side client
export const createServerSupabaseClient = () => {
  return createCompatibilityClient(true);
};

// Auth cache for better performance
let authCache: { session: any; timestamp: number } | null = null;
const AUTH_CACHE_DURATION = 5000; // 5 seconds

export async function getCachedAuthState() {
  const now = Date.now();
  
  if (authCache && (now - authCache.timestamp) < AUTH_CACHE_DURATION) {
    return { session: authCache.session, error: null };
  }
  
  const { data, error } = await supabase.auth.getSession();
  
  if (!error && data.session) {
    authCache = {
      session: data.session,
      timestamp: now
    };
  }
  
  return { session: data.session, error };
}

export function clearAuthCache() {
  authCache = null;
}
