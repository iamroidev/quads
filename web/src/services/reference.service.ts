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
}

export type Level = string;

export interface ReferenceData {
  programs: Program[];
  levels: Level[];
  halls: Hall[];
  pickupSpots: PickupSpot[];
}

class ReferenceService {
  private cache: ReferenceData | null = null;

  async getAll(): Promise<ReferenceData> {
    if (this.cache) return this.cache;
    const res = await api.get('/reference/all');
    if (res.data.success) {
      this.cache = res.data.data;
      return this.cache!;
    }
    throw new Error('Failed to load reference data');
  }

  async getPrograms(): Promise<Program[]> {
    const data = await this.getAll();
    return data.programs;
  }

  async getHalls(): Promise<Hall[]> {
    const data = await this.getAll();
    return data.halls;
  }

  async getPickupSpots(): Promise<PickupSpot[]> {
    const data = await this.getAll();
    return data.pickupSpots;
  }

  async getLevels(): Promise<Level[]> {
    const data = await this.getAll();
    return data.levels;
  }

  /** Get only on-campus halls */
  getOnCampusHalls(halls: Hall[]): Hall[] {
    return halls.filter(h => h.type === 'on-campus');
  }

  /** Search programs by query */
  searchPrograms(programs: Program[], query: string): Program[] {
    const q = query.toLowerCase();
    return programs.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.faculty.toLowerCase().includes(q)
    );
  }

  /** Search pickup spots by query */
  searchPickupSpots(spots: PickupSpot[], query: string): PickupSpot[] {
    const q = query.toLowerCase();
    return spots.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }

  invalidateCache(): void {
    this.cache = null;
  }
}

export default new ReferenceService();