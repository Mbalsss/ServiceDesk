import { supabase, DatabaseTechnician } from '../lib/supabase';
import { TechAvailability } from '../types';

// Convert database technician to app format
const convertDatabaseTechnician = (dbTech: DatabaseTechnician): TechAvailability => ({
  id: dbTech.id,
  name: dbTech.name,
  status: dbTech.status,
  currentTask: dbTech.current_task,
  workload: dbTech.workload,
  nextAvailable: dbTech.next_available ? new Date(dbTech.next_available) : undefined
});

export const technicianService = {
  // Get all technicians
  async getAllTechnicians(): Promise<TechAvailability[]> {
    // Return mock data since table doesn't exist in Supabase
    return [
      {
        id: '1',
        name: 'John Smith',
        status: 'available',
        currentTask: undefined,
        workload: 45,
        nextAvailable: undefined
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        status: 'busy',
        currentTask: 'Network troubleshooting',
        workload: 85,
        nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000)
      },
      {
        id: '3',
        name: 'Mike Wilson',
        status: 'away',
        currentTask: undefined,
        workload: 0,
        nextAvailable: new Date(Date.now() + 30 * 60 * 1000)
      },
      {
        id: '4',
        name: 'Lisa Chen',
        status: 'available',
        currentTask: undefined,
        workload: 30,
        nextAvailable: undefined
      },
      {
        id: '5',
        name: 'David Wilson',
        status: 'busy',
        currentTask: 'Database optimization',
        workload: 75,
        nextAvailable: new Date(Date.now() + 1 * 60 * 60 * 1000)
      },
      {
        id: '6',
        name: 'Emma Thompson',
        status: 'offline',
        currentTask: undefined,
        workload: 0,
        nextAvailable: new Date(Date.now() + 8 * 60 * 60 * 1000)
      }
    ];

    /*
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching technicians:', error);
        // Return mock data if table doesn't exist
        return [
          {
            id: '1',
            name: 'John Smith',
            status: 'available',
            currentTask: undefined,
            workload: 45,
            nextAvailable: undefined
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            status: 'busy',
            currentTask: 'Network troubleshooting',
            workload: 85,
            nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000)
          },
          {
            id: '3',
            name: 'Mike Wilson',
            status: 'away',
            currentTask: undefined,
            workload: 0,
            nextAvailable: new Date(Date.now() + 30 * 60 * 1000)
          },
          {
            id: '4',
            name: 'Lisa Chen',
            status: 'available',
            currentTask: undefined,
            workload: 30,
            nextAvailable: undefined
          }
        ];
      }

      return data?.map(convertDatabaseTechnician) || [];
    } catch (error) {
      console.error('Error fetching technicians:', error);
      // Return mock data as fallback
      return [
        {
          id: '1',
          name: 'John Smith',
          status: 'available',
          currentTask: undefined,
          workload: 45,
          nextAvailable: undefined
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          status: 'busy',
          currentTask: 'Network troubleshooting',
          workload: 85,
          nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000)
        },
        {
          id: '3',
          name: 'Mike Wilson',
          status: 'away',
          currentTask: undefined,
          workload: 0,
          nextAvailable: new Date(Date.now() + 30 * 60 * 1000)
        },
        {
          id: '4',
          name: 'Lisa Chen',
          status: 'available',
          currentTask: undefined,
          workload: 30,
          nextAvailable: undefined
        }
      ];
    }
    */
  },

  // Update technician status
  async updateTechnicianStatus(technicianId: string, status: string, currentTask?: string): Promise<boolean> {
    // Return true for mock implementation
    console.log(`Mock update: Technician ${technicianId} status changed to ${status}${currentTask ? ` with task: ${currentTask}` : ''}`);
    return true;

    /*
    try {
      const updateData: any = { status };
      
      if (currentTask !== undefined) {
        updateData.current_task = currentTask;
      }

      // Update workload based on status
      if (status === 'available') {
        updateData.workload = Math.floor(Math.random() * 60) + 20; // 20-80%
      } else if (status === 'busy') {
        updateData.workload = Math.floor(Math.random() * 20) + 80; // 80-100%
      } else if (status === 'away' || status === 'offline') {
        updateData.workload = 0;
      }

      const { error } = await supabase
        .from('technicians')
        .update(updateData)
        .eq('id', technicianId);

      if (error) {
        console.error('Error updating technician status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating technician status:', error);
      return false;
    }
    */
  },

  // Update technician workload
  async updateTechnicianWorkload(technicianId: string, workload: number): Promise<boolean> {
    // Return true for mock implementation
    console.log(`Mock update: Technician ${technicianId} workload changed to ${workload}%`);
    return true;

    /*
    try {
      const { error } = await supabase
        .from('technicians')
        .update({ workload })
        .eq('id', technicianId);

      if (error) {
        console.error('Error updating technician workload:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating technician workload:', error);
      return false;
    }
    */
  },

  // Get available technicians for assignment
  async getAvailableTechnicians(): Promise<TechAvailability[]> {
    // Return mock available technicians
    return [
      {
        id: '1',
        name: 'John Smith',
        status: 'available',
        currentTask: undefined,
        workload: 45,
        nextAvailable: undefined
      },
      {
        id: '4',
        name: 'Lisa Chen',
        status: 'available',
        currentTask: undefined,
        workload: 30,
        nextAvailable: undefined
      }
    ];

    /*
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('status', 'available')
        .order('workload');

      if (error) {
        console.error('Error fetching available technicians:', error);
        // Return mock available technicians
        return [
          {
            id: '1',
            name: 'John Smith',
            status: 'available',
            currentTask: undefined,
            workload: 45,
            nextAvailable: undefined
          },
          {
            id: '4',
            name: 'Lisa Chen',
            status: 'available',
            currentTask: undefined,
            workload: 30,
            nextAvailable: undefined
          }
        ];
      }

      return data?.map(convertDatabaseTechnician) || [];
    } catch (error) {
      console.error('Error fetching available technicians:', error);
      // Return mock available technicians as fallback
      return [
        {
          id: '1',
          name: 'John Smith',
          status: 'available',
          currentTask: undefined,
          workload: 45,
          nextAvailable: undefined
        },
        {
          id: '4',
          name: 'Lisa Chen',
          status: 'available',
          currentTask: undefined,
          workload: 30,
          nextAvailable: undefined
        }
      ];
    }
    */
  }
};