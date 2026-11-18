import type { ResearchType } from '../../shared/types/platform.types';

export interface ResearchTypeOption {
  id: ResearchType;
  name: string;
  description: string;
}

export const RESEARCH_TYPES: ResearchTypeOption[] = [
  {
    id: 'general',
    name: 'Investigación general',
    description: 'Sube tu investigación con todos los documentos que necesites, sin límite de archivos.',
  },
];

export function getResearchType(): ResearchTypeOption {
  return RESEARCH_TYPES[0];
}
