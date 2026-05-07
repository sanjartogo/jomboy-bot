import directionsData from "./directions.json";

export interface Direction {
  id: number;
  name: string;
  responsibles: string[];
  yearly_plan_sum?: number;
  monthly_plan?: Record<string, number>;
}


export const DIRECTIONS: Direction[] = directionsData;

export function getDirection(id: number): Direction | undefined {
  return DIRECTIONS.find((d) => d.id === id);
}

/**
 * Tashkilot nomiga qarab unga tegishli barcha yo'nalishlar ID sini qaytaradi.
 */
export function getDirectionsForOrganization(orgName: string): number[] {
  return DIRECTIONS
    .filter((d) => d.responsibles.includes(orgName))
    .map((d) => d.id);
}

export function getDirectionShortName(id: number, maxLen = 60): string {
  const d = getDirection(id);
  if (!d) return `№${id}`;
  return d.name.length > maxLen ? d.name.slice(0, maxLen) + "…" : d.name;
}
