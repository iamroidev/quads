import api from './api';

export interface Program {
  code: string;
  name: string;
  faculty: string;
}

export interface Hall {
  name: string;
  type: 'on-campus' | 'hostel' | 'off-campus';
}

export interface PickupSpot {
  name: string;
  area: string;
  description: string;
  isActive: boolean;
  isManual: boolean;
}

export type Level = string;

export interface ReferenceData {
  programs: Program[];
  levels: Level[];
  halls: Hall[];
  pickupSpots: PickupSpot[];
}

let cache: ReferenceData | null = null;

const referenceService = {
  getAll: async (): Promise<ReferenceData> => {
    if (cache) return cache;
    const res = await api.get('/reference/all');
    if (res.data.success) {
      cache = res.data.data;
      return cache!;
    }
    throw new Error('Failed to load reference data');
  },

  getPrograms: async (): Promise<Program[]> => {
    const data = await referenceService.getAll();
    return data.programs;
  },

  getHalls: async (): Promise<Hall[]> => {
    const data = await referenceService.getAll();
    return data.halls;
  },

  getLevels: async (): Promise<Level[]> => {
    const data = await referenceService.getAll();
    return data.levels;
  },

  getPickupSpots: async (): Promise<PickupSpot[]> => {
    const data = await referenceService.getAll();
    return data.pickupSpots;
  },

  invalidateCache: () => { cache = null; },
};

export default referenceService;
