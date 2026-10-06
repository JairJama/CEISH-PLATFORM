import type { ResearchType } from '../../shared/types/platform.types';

export interface ResearchTypeOption {
  id: ResearchType;
  name: string;
  description: string;
  annexes: Array<{ number: number; name: string }>;
}

export const RESEARCH_TYPES: ResearchTypeOption[] = [
  {
    id: 'scientific',
    name: 'Investigación científica',
    description: 'Para estudios con diseño experimental, observacional o analítico.',
    annexes: [
      { number: 1, name: 'Protocolo de investigación' },
      { number: 2, name: 'Consentimiento informado' },
      { number: 3, name: 'Hoja de vida del investigador' },
      { number: 5, name: 'Instrumento de recolección de datos' },
    ],
  },
  {
    id: 'clinical',
    name: 'Investigación clínica',
    description: 'Para investigaciones que involucran intervención o atención clínica.',
    annexes: [
      { number: 1, name: 'Protocolo de investigación' },
      { number: 2, name: 'Consentimiento informado' },
      { number: 6, name: 'Ficha de información para participantes' },
      { number: 7, name: 'Plan de seguridad y monitoreo' },
    ],
  },
  {
    id: 'social',
    name: 'Investigación social',
    description: 'Para estudios sociales, comunitarios o de ciencias humanas.',
    annexes: [
      { number: 1, name: 'Protocolo de investigación' },
      { number: 4, name: 'Carta de autorización institucional' },
      { number: 8, name: 'Guía de entrevista o encuesta' },
      { number: 9, name: 'Plan de manejo de información' },
    ],
  },
];

export function getResearchType(type: ResearchType): ResearchTypeOption {
  return RESEARCH_TYPES.find((option) => option.id === type) ?? RESEARCH_TYPES[0];
}
