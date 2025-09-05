// hooks/useEquipment.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Equipment, EquipmentFormData } from '../types/equipment';

export const useEquipment = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          assigned_to:profiles(full_name, email),
          technician:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipment(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEquipment = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          assigned_to:profiles(full_name, email),
          technician:profiles(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const createEquipment = async (equipmentData: EquipmentFormData) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([equipmentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const updateEquipment = async (id: string, equipmentData: Partial<EquipmentFormData>) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update(equipmentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  return {
    equipment,
    loading,
    error,
    refetch: fetchEquipment,
    getEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment
  };
};