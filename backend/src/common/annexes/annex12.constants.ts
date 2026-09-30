export type Annex12CriterionResult = "complies" | "does-not-comply";

export interface Annex12CriterionDefinition {
  id: string;
  characteristic: string;
}

export interface Annex12SectionDefinition {
  component: string;
  criteria: Annex12CriterionDefinition[];
}

export interface Annex12ChecklistItem {
  id: string;
  component: string;
  characteristic: string;
  result: Annex12CriterionResult;
  observations: string;
}

export const ANNEX_12_SECTIONS: Annex12SectionDefinition[] = [
  {
    component: "Título",
    criteria: [
      {
        id: "title",
        characteristic:
          "Refleja el contenido del trabajo, hace referencia a la población y evidencia elementos éticos.",
      },
    ],
  },
  {
    component: "Justificación del problema",
    criteria: [
      {
        id: "problem-justification",
        characteristic:
          "Presenta valor social, señala la importancia del problema, pertenece a una línea de investigación de la ULEAM y evidencia elementos éticos.",
      },
    ],
  },
  {
    component: "Descripción del problema",
    criteria: [
      {
        id: "problem-description",
        characteristic:
          "Es clara y precisa; delimita tiempo, espacio y persona; se refiere a ciencias de la vida o medio ambiente e identifica grupos vulnerables.",
      },
    ],
  },
  {
    component: "Fundamentación teórica",
    criteria: [
      {
        id: "theoretical-foundation",
        characteristic:
          "Es específica del problema, incluye bibliografía actualizada y aborda aspectos bioéticos.",
      },
    ],
  },
  {
    component: "Objetivos",
    criteria: [
      {
        id: "objectives",
        characteristic:
          "Son claros, precisos, concordantes, alcanzables y consideran elementos éticos o grupos vulnerables.",
      },
    ],
  },
  {
    component: "Hipótesis",
    criteria: [
      {
        id: "hypothesis",
        characteristic:
          "Está fundamentada en el conocimiento actual y es empíricamente comprobable.",
      },
      {
        id: "hypothesis-bioethics",
        characteristic: "Considera aspectos bioéticos, aunque sean implícitos.",
      },
    ],
  },
  {
    component: "Metodología",
    criteria: [
      { id: "method-study-type", characteristic: "Señala el tipo de estudio." },
      {
        id: "method-population-sample",
        characteristic: "El universo y la muestra son adecuados.",
      },
      {
        id: "method-inclusion-exclusion",
        characteristic: "Define criterios de inclusión y exclusión.",
      },
      {
        id: "method-variables",
        characteristic: "Las variables son susceptibles de medición.",
      },
      {
        id: "method-data-collection",
        characteristic: "El procedimiento de recolección de datos está claro.",
      },
      {
        id: "method-tools",
        characteristic: "Incluye herramientas para la recolección de datos.",
      },
      {
        id: "method-recruitment",
        characteristic:
          "Explica cómo se reclutan las personas participantes, si aplica.",
      },
      {
        id: "method-resources-timeline",
        characteristic: "Los recursos y el cronograma son adecuados.",
      },
      {
        id: "method-bioethics",
        characteristic: "Considera aspectos bioéticos.",
      },
    ],
  },
  {
    component: "Consideraciones éticas",
    criteria: [
      { id: "ethics-confidentiality", characteristic: "Confidencialidad." },
      {
        id: "ethics-autonomy",
        characteristic: "Autonomía de participantes, si aplica.",
      },
      {
        id: "ethics-animals",
        characteristic:
          "Cumple las normas de investigación con animales, si aplica.",
      },
      {
        id: "ethics-plants",
        characteristic:
          "Cumple los aspectos éticos de investigación con plantas, si aplica.",
      },
      {
        id: "ethics-environment",
        characteristic: "Protege el medio ambiente, suelos, aguas y aire.",
      },
      {
        id: "ethics-risk-benefit",
        characteristic:
          "Mantiene un balance adecuado entre riesgo y beneficio.",
      },
      {
        id: "ethics-resource-distribution",
        characteristic:
          "Considera la distribución equitativa de recursos, si aplica.",
      },
      {
        id: "ethics-vulnerable-population",
        characteristic: "Protege a la población vulnerable, si aplica.",
      },
      {
        id: "ethics-fair-selection",
        characteristic: "La selección de participantes es equitativa.",
      },
      {
        id: "ethics-consent-process",
        characteristic:
          "Describe el proceso de obtención del consentimiento informado, si aplica.",
      },
      {
        id: "ethics-consent-document",
        characteristic:
          "El documento de consentimiento informado cumple los criterios del comité.",
      },
      {
        id: "ethics-conflict-interest",
        characteristic: "Incluye declaración de conflicto de intereses.",
      },
      {
        id: "ethics-conscientious-objection",
        characteristic:
          "Incluye declaración de objeción de conciencia cuando corresponde.",
      },
      {
        id: "ethics-commercial-agency",
        characteristic:
          "Declara relación con perfumería, cosméticos, bebidas alcohólicas u otra agencia lucrativa, si aplica.",
      },
    ],
  },
  {
    component: "Consideraciones jurídicas",
    criteria: [
      {
        id: "legal-researcher-suitability",
        characteristic: "Idoneidad de los investigadores.",
      },
      {
        id: "legal-bioethics-training",
        characteristic:
          "Algún investigador tiene formación básica en bioética.",
      },
      {
        id: "legal-participant-benefits",
        characteristic:
          "Los participantes serán beneficiados con los resultados, si aplica.",
      },
      {
        id: "legal-results-disclosure",
        characteristic: "Los participantes serán informados de los resultados.",
      },
      {
        id: "legal-compensation",
        characteristic: "Considera compensación de gastos y daños, si aplica.",
      },
      {
        id: "legal-insurance",
        characteristic: "Considera una póliza para participantes, si aplica.",
      },
      {
        id: "legal-sensitive-information",
        characteristic:
          "Protege información sensible de interés para el Estado ecuatoriano.",
      },
      {
        id: "legal-national-heritage",
        characteristic: "Protege el patrimonio del Estado ecuatoriano.",
      },
      { id: "legal-other", characteristic: "Otro aspecto jurídico relevante." },
    ],
  },
  {
    component: "Referencias bibliográficas",
    criteria: [
      {
        id: "references",
        characteristic:
          "Cumple el formato exigido (APA, Vancouver u otro) y la actualización requerida.",
      },
    ],
  },
];

export const ANNEX_12_CRITERIA: Array<
  Annex12CriterionDefinition & { component: string }
> = ANNEX_12_SECTIONS.flatMap((s) =>
  s.criteria.map((c) => ({ ...c, component: s.component })),
);
