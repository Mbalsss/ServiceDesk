// src/services/userService.ts
import { supabase } from "../lib/supabase";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  status: string; // active, inactive, invited, etc.
  created_at: string;
}

/**
 * Fetch all users, with optional filters (role, status, search).
 */
export async function fetchUsers(filters?: {
  role?: string;
  status?: string;
  search?: string;
}): Promise<User[]> {
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });

  if (filters?.role) query = query.eq("role", filters.role);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as User[];
}

/**
 * Invite a new user (default role = user, but can be overridden).
 */
export async function inviteUser(email: string, role: string = "user", department: string = "") {
  const { data, error } = await supabase
    .from("profiles")
    .insert([{ email, role, department, status: "invited" }])
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

/**
 * Update user role.
 */
export async function updateUserRole(userId: string, newRole: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

/**
 * Update user department.
 */
export async function updateUserDepartment(userId: string, newDepartment: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ department: newDepartment })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

/**
 * Toggle user status (active / inactive).
 */
export async function toggleUserStatus(userId: string, newStatus: "active" | "inactive") {
  const { data, error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

/**
 * Delete a user completely.
 */
export async function deleteUser(userId: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;
  return true;
}
