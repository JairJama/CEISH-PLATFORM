import type { EvaluationSession } from '../types/evaluation.types';

const MOCK_SESSION: EvaluationSession = {
  id: 'eval-001',
  documentName: 'Tesis_Metodologia_Investigacion_2024.pdf',
  evaluator: 'Dr. Marco Zambra',
  institution: 'CEISH',
  matrix: {
    id: 'matrix-001',
    name: 'Matriz de Evaluación Estándar',
    version: '2.0',
    criteria: [
      {
        id: 'c-01',
        label: 'El documento contiene una introducción clara',
        category: 'Estructura',
        status: 'pending',
        observation: '',
      },
      {
        id: 'c-02',
        label: 'Los objetivos están claramente definidos',
        category: 'Estructura',
        status: 'pending',
        observation: '',
      },
      {
        id: 'c-03',
        label: 'La metodología es apropiada para el tipo de investigación',
        description: 'Verificar que el enfoque metodológico se justifica adecuadamente.',
        category: 'Metodología',
        status: 'pending',
        observation: '',
      },
      {
        id: 'c-04',
        label: 'La población de estudio está correctamente definida',
        category: 'Metodología',
        status: 'pending',
        observation: '',
      },
      {
        id: 'c-05',
        label: 'Los instrumentos de recolección están descritos',
        category: 'Metodología',
        status: 'pending',
        observation: '',
      },
      {
        id: 'c-06',
        label: 'El marco teórico es pertinente al tema',
        category: 'Marco Teórico',
        status: 'pending',
        observation: '',
      },
      {
        id: 'c-07',
        label: 'Las referencias bibliográficas están en formato APA',
        category: 'Bibliografía',
        status: 'pending',
        observation: '',
      },
      {
        id: 'c-08',
        label: 'El documento cumple con los criterios de extensión mínima',
        category: 'Formato',
        status: 'pending',
        observation: '',
      },
      {
        id: 'c-09',
        label: 'Las conclusiones responden a los objetivos planteados',
        category: 'Resultados',
        status: 'pending',
        observation: '',
      },
      {
        id: 'c-10',
        label: 'El documento fue aprobado por el tutor o director',
        category: 'Administrativo',
        status: 'pending',
        observation: '',
      },
    ],
  },
  status: 'in-progress',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const evaluationService = {
  async getSession(id: string): Promise<EvaluationSession> {
    void id;
    await new Promise((r) => setTimeout(r, 300));
    return structuredClone(MOCK_SESSION);
  },

  async saveSession(session: EvaluationSession): Promise<EvaluationSession> {
    await new Promise((r) => setTimeout(r, 200));
    return { ...session, updatedAt: new Date().toISOString() };
  },
};
