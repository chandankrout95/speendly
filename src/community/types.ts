export type Page = 'home' | 'doctors' | 'emergency' | 'bus' | 'ferry' | 'blood';
export interface Service { id: string; name: string; category: string; phone: string; address?: string }
export interface RouteRecord { id: string; route: string; name: string; departure: string | null; arrival: string | null; duration: string; fare: string; active: boolean; stops: { name: string; time: string }[] }
export interface Camp { id: string; name: string; organizer: string; date: string; time: string; location: string; status: string; collected: number; target: number; groups: string[] }
export interface CommunityData { services: Service[]; doctors: Service[]; bus: RouteRecord[]; ferry: RouteRecord[]; camps: Camp[]; stats: { totalCamps: number; upcoming: number; ongoing: number; donors: number } }
