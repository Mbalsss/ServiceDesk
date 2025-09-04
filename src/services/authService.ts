import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'technician';
  department?: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'technician';
  department?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  // ---------------------------
  // Sign up a new user
  // ---------------------------
  async signUp(data: SignupData): Promise<{ success: boolean; message: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            role: data.role,
            department: data.department,
          },
        },
      });

      if (authError) {
        console.error('Supabase auth signUp error:', authError);
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Failed to create user.' };
      }

      // Profile creation is handled automatically by the trigger (using service_role key in DB)
      return {
        success: true,
        message: 'Account created! Please check your email to confirm before logging in.',
      };
    } catch (err: any) {
      console.error('Unexpected error during signup:', err);
      return { success: false, message: err.message || 'Unexpected error during signup' };
    }
  }

  // ---------------------------
  // Sign in user
  // ---------------------------
  async signIn(data: LoginData): Promise<{ user?: AuthUser; error?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('email')) {
          return { error: 'Email not confirmed' };
        }
        return { error: authError.message };
      }

      if (!authData.user) return { error: 'Login failed' };

      // Fetch the profile AFTER successful authentication
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        console.warn('Profile not found, falling back to auth metadata:', profileError);
        return {
          user: {
            id: authData.user.id,
            name: authData.user.user_metadata?.full_name || 'Unknown',
            email: authData.user.email,
            role: (authData.user.user_metadata?.role as any) || 'user',
            department: authData.user.user_metadata?.department,
          },
        };
      }

      return {
        user: {
          id: profile.id,
          name: profile.full_name,
          email: profile.email || authData.user.email,
          role: profile.role,
          department: profile.department,
        },
      };
    } catch (err: any) {
      console.error('Unexpected error during sign-in:', err);
      return { error: 'Login failed. Please try again.' };
    }
  }

  // ---------------------------
  // Resend confirmation email
  // ---------------------------
  async resendConfirmationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.resendVerificationEmail({ email });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Confirmation email resent. Please check your inbox.' };
    } catch (err: any) {
      console.error('Unexpected error during resend confirmation:', err);
      return { success: false, message: 'Failed to resend confirmation email' };
    }
  }
}

export const authService = new AuthService();
