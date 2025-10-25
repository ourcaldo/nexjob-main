/**
 * Authentication library for Neon Auth
 * This is a temporary simple implementation.
 * TODO: Integrate with Stack Auth or implement full JWT-based auth
 */

import { query } from './database';
import type { Profile } from './database';

export interface Session {
  user: {
    id: string;
    email: string;
  };
  access_token: string;
}

export interface AuthState {
  session: Session | null;
  error: any;
}

// Simple session cache (in-memory for now)
// TODO: Replace with Redis or database-based session storage
const sessionCache = new Map<string, { user: any; expiresAt: number }>();

/**
 * Validate a session token and return user data
 * For now, this is a placeholder that we'll implement properly with Stack Auth
 */
export const validateSessionToken = async (token: string): Promise<{ user: any; error: any }> => {
  try {
    // Check cache first
    const cached = sessionCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return { user: cached.user, error: null };
    }

    // TODO: Implement actual token validation with Stack Auth or JWT
    // For now, this is a placeholder that always returns unauthorized
    return { user: null, error: 'Session validation not implemented yet' };
  } catch (error) {
    return { user: null, error };
  }
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const result = await query(
      'SELECT * FROM profiles WHERE id = $1',
      [userId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<Profile | null> => {
  try {
    const result = await query(
      'SELECT * FROM profiles WHERE email = $1',
      [email]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

/**
 * Create a new user profile
 */
export const createUserProfile = async (data: {
  id: string;
  email: string;
  full_name?: string;
  role?: 'user' | 'super_admin';
}): Promise<Profile | null> => {
  try {
    const result = await query(
      `INSERT INTO profiles (id, email, full_name, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [data.id, data.email, data.full_name || null, data.role || 'user']
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> => {
  try {
    const allowedFields = ['full_name', 'phone', 'birth_date', 'gender', 'location', 'photo_url', 'bio'];
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    values.push(userId);
    const result = await query(
      `UPDATE profiles SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = async (userId: string): Promise<boolean> => {
  try {
    const result = await query(
      'SELECT role FROM profiles WHERE id = $1',
      [userId]
    );
    
    return result.rows[0]?.role === 'super_admin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
};

// Client-side auth state management (placeholder)
let authStateCache: { session: any; timestamp: number } | null = null;
const CACHE_DURATION = parseInt(process.env.AUTH_CACHE_DURATION || '5000');

export const getAuthState = async (): Promise<AuthState> => {
  // TODO: Implement client-side auth state retrieval
  // For now, return no session
  return { session: null, error: null };
};

export const getCachedAuthState = async (): Promise<AuthState> => {
  const now = Date.now();
  
  if (authStateCache && (now - authStateCache.timestamp) < CACHE_DURATION) {
    return { session: authStateCache.session, error: null };
  }
  
  const { session, error } = await getAuthState();
  
  authStateCache = {
    session,
    timestamp: now
  };
  
  return { session, error };
};

export const clearAuthCache = () => {
  authStateCache = null;
};

export const waitForAuthInitialization = () => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 100);
  });
};
