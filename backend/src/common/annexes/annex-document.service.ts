import { Injectable, Logger } from "@nestjs/common";
import AdmZip from "adm-zip";
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface GeneratedAnnexData {
  annexNumber: 11 | 12 | 13 | 23 | 27;
  researchCode: string;
  title: string;
  researcherName: string;
  memberName: string;
  data: Record<string, unknown>;
  documents: Array<{ name: string; uploadedAt: string }>;
}

function xmlEscape(val: string): string {
  return val
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeRegex(val: string): string {
  return val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceText(xml: string, target: string, valueStr: string): string {
  const isPlaceholder = /^X+$/.test(target);
  const expression = new RegExp(
    `(<w:t\\b[^>]*>)${isPlaceholder ? "(?<!X)" : ""}${escapeRegex(target)}${isPlaceholder ? "(?!X)" : ""}(<\\/w:t>)`,
    "g",
  );
  const directReplacement = xml.replace(
    expression,
    `$1${xmlEscape(valueStr)}$2`,
  );
  if (directReplacement !== xml) return directReplacement;

  const plainExpression = new RegExp(
    `${isPlaceholder ? "(?<!X)" : ""}${escapeRegex(target)}${isPlaceholder ? "(?!X)" : ""}`,
  );
  let replacedAcrossRuns = false;
  return directReplacement.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) => {
    const text = plainText(paragraph);
    if (replacedAcrossRuns || !plainExpression.test(text)) return paragraph;
    replacedAcrossRuns = true;
    const updatedText = text.replace(plainExpression, valueStr);
    let wroteText = false;
    return paragraph.replace(
      /(<w:t\b[^>]*>)[\s\S]*?(<\/w:t>)/g,
      (_match, start, end) => {
        if (wroteText) return `${start}${end}`;
        wroteText = true;
        return `${start}${xmlEscape(updatedText)}${end}`;
      },
    );
  });
}

function plainText(xml: string): string {
  return xml
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function writeCellText(cell: string, valueStr: string): string {
  const escaped = xmlEscape(valueStr);
  if (/<w:t\b[^>]*\/>/.test(cell)) {
    return cell.replace(
      /<w:t\b[^>]*\/>/,
      `<w:t xml:space="preserve">${escaped}</w:t>`,
    );
  }
  if (/<w:t\b[^>]*>[\s\S]*?<\/w:t>/.test(cell)) {
    return cell.replace(/(<w:t\b[^>]*>)[\s\S]*?(<\/w:t>)/, `$1${escaped}$2`);
  }
  return cell.replace(
    "</w:p>",
    `<w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`,
  );
}

function fillTableRow(xml: string, label: string, values: string[]): string {
  let updated = false;
  return xml.replace(/<w:tr\b[\s\S]*?<\/w:tr>/g, (row) => {
    if (updated || !plainText(row).includes(label)) return row;
    const cells = row.match(/<w:tc\b[\s\S]*?<\/w:tc>/g);
    if (!cells || cells.length < values.length + 1) return row;
    updated = true;
    const replaced = cells.map((cell, index) =>
      index > 0 && index <= values.length
        ? writeCellText(cell, values[index - 1])
        : cell,
    );
    let cursor = 0;
    return row.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, () => replaced[cursor++]);
  });
}

function fillLastTableCell(
  xml: string,
  label: string,
  content: string,
  occurrence = 1,
): string {
  let updated = false;
  let matches = 0;
  return xml.replace(/<w:tr\b[\s\S]*?<\/w:tr>/g, (row) => {
    if (updated || !plainText(row).includes(label)) return row;
    matches += 1;
    if (matches !== occurrence) return row;
    const cells = row.match(/<w:tc\b[\s\S]*?<\/w:tc>/g);
    if (!cells?.length) return row;
    updated = true;
    const lastCell = cells.length - 1;
    const replaced = cells.map((cell, index) =>
      index === lastCell ? writeCellText(cell, content) : cell,
    );
    let cursor = 0;
    return row.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, () => replaced[cursor++]);
  });
}

function replaceRiskConclusion(xml: string, conclusion: string): string {
  let updated = false;
  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) => {
    if (updated || !plainText(paragraph).includes(", es:")) return paragraph;
    updated = true;
    let replaced = false;
    return paragraph
      .replace(
        /(<w:t\b[^>]*>[^<]*, es:\s*)_+(<\/w:t>)/,
        `$1${xmlEscape(conclusion)}$2`,
      )
      .replace(/(<w:t\b[^>]*>)_+(<\/w:t>)/, (match, start, end) => {
        if (replaced) return match;
        replaced = true;
        return `${start}${end}`;
      });
  });
}

function val(
  data: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const item = data[key];
  if (typeof item === "string") return item.trim() || fallback;
  if (typeof item === "number" || typeof item === "boolean")
    return String(item);
  return fallback;
}

function formatDate(raw: string): string {
  const date =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(`${raw}T12:00:00`)
      : raw
        ? new Date(raw)
        : new Date();
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const ANNEX_12_TEMPLATE_ANCHORS: Record<string, string> = {
  title: "Refleja el contenido",
  "problem-justification": "Valor social",
  "problem-description": "Es Claro y Preciso",
  "theoretical-foundation": "¿Es específica del",
  objectives: "Son Claros, precisos",
  hypothesis: "Está fundamentada en el",
  "hypothesis-bioethics": "Toca aspectos Bioéticos",
  "method-study-type": "Señala el tipo de estudio",
  "method-population-sample": "Universo y muestra",
  "method-inclusion-exclusion": "Tiene criterios de inclusión",
  "method-variables": "Las variables son",
  "method-data-collection": "Está claro el procedimiento",
  "method-tools": "Se incluye las herramientas",
  "method-recruitment": "Explica cómo se reclutan",
  "method-resources-timeline": "Recursos y cronograma",
  "method-bioethics": "Toca aspectos Bioéticos",
  "ethics-confidentiality": "Confidencialidad",
  "ethics-autonomy": "Autonomía de participantes",
  "ethics-animals": "Cumple con las normas",
  "ethics-plants": "Cumple con aspectos éticos",
  "ethics-environment": "La investigación protege el",
  "ethics-risk-benefit": "Balance riesgo beneficio",
  "ethics-resource-distribution": "distribución equitativa",
  "ethics-vulnerable-population": "Protección de población",
  "ethics-fair-selection": "Selección equitativa",
  "ethics-consent-process": "Descripción del proceso",
  "ethics-consent-document": "Documento consentimiento",
  "ethics-conflict-interest": "Declaración de conflicto",
  "ethics-conscientious-objection": "Declaración de Objeción",
  "ethics-commercial-agency": "Investigación relacionada con",
  "legal-researcher-suitability": "Idoneidad de investigadores",
  "legal-bioethics-training": "formación básica en bioética",
  "legal-participant-benefits": "beneficiados con los",
  "legal-results-disclosure": "informados de los resultados",
  "legal-compensation": "compensación de",
  "legal-insurance": "considerado una póliza",
  "legal-sensitive-information": "información sensible",
  "legal-national-heritage": "patrimonio del",
  "legal-other": "OTRO, Especificar",
  references: "Cumple con el formato exigido",
};

const ANNEX_12_TEMPLATE_OCCURRENCES: Partial<Record<string, number>> = {
  "hypothesis-bioethics": 2,
  "method-bioethics": 3,
};

function checklistResultLabel(result: unknown): string {
  if (result === "complies") return "CUMPLE";
  if (result === "does-not-comply") return "NO CUMPLE";
  return "SIN RESPUESTA";
}

@Injectable()
export class AnnexDocumentService {
  private readonly logger = new Logger(AnnexDocumentService.name);

  private getTemplatePath(annexNumber: number): string {
    return path.resolve(
      process.cwd(),
      "..",
      "public",
      "annex-templates",
      `anexo-${annexNumber}.docx`,
    );
  }

  async generateAnnexDocx(annex: GeneratedAnnexData): Promise<Buffer> {
    const templatePath = this.getTemplatePath(annex.annexNumber);
    const templateBuffer = await readFile(templatePath);

    const zip = new AdmZip(templateBuffer);
    const documentXmlEntry = zip.getEntry("word/document.xml");
    if (!documentXmlEntry) {
      throw new Error(
        "El archivo DOCX de la plantilla no contiene word/document.xml",
      );
    }

    const sourceXml = documentXmlEntry.getData().toString("utf8");
    let transformedXml = sourceXml;

    switch (annex.annexNumber) {
      case 11:
        transformedXml = this.applyAnnex11(sourceXml, annex);
        break;
      case 12:
        transformedXml = this.applyAnnex12(sourceXml, annex);
        break;
      case 13:
        transformedXml = this.applyAnnex13(sourceXml, annex);
        break;
      case 23:
        transformedXml = this.applyAnnex23(sourceXml, annex);
        break;
      case 27:
        transformedXml = this.applyAnnex27(sourceXml, annex);
        break;
    }

    zip.updateFile("word/document.xml", Buffer.from(transformedXml, "utf8"));
    return zip.toBuffer();
  }

  private applyAnnex11(xml: string, annex: GeneratedAnnexData): string {
    const issueDate = formatDate(val(annex.data, "issueDate"));
    let next = replaceText(
      xml,
      "Formato de Carta de exención",
      "Resolución de aprobación",
    );
    next = replaceText(
      next,
      "como notifica a Usted que este proyecto es una investigación exenta de evaluación por parte del CEISH-Uleam, de acuerdo con lo establecido en la normativa legal vigente.",
      "notifica a Usted que este proyecto ha sido APROBADO por el CEISH-Uleam para su ejecución, conforme a la evaluación realizada.",
    );
    next = replaceText(
      next,
      "Esta carta de exención tiene una vigencia de un año, contado desde la fecha de recepción de esta documentación.",
      "La presente resolución de aprobación entra en vigencia a partir de su fecha de emisión.",
    );
    next = replaceText(
      next,
      "Oficio Nro.",
      `Oficio Nro. ${val(annex.data, "officeNumber", annex.researchCode)}`,
    );
    next = replaceText(next, "Manta, XX de XX 20XX", `Manta, ${issueDate}`);
    next = replaceText(next, "XXXXXXXXX", annex.researcherName);
    next = replaceText(next, "XXXXXXXXXXXXXXXXXXXXXXXXXXXXX", annex.title);
    next = replaceText(next, "XXXXXXXX", annex.researchCode);
    next = replaceText(
      next,
      "Tipo de estudio",
      `Tipo de estudio: ${val(annex.data, "studyType", "Investigación sin riesgo")}`,
    );
    next = replaceText(
      next,
      "Duración del estudio (meses)",
      `Duración del estudio (meses): ${val(annex.data, "durationMonths", "No especificada")}`,
    );
    next = replaceText(
      next,
      "Instituciones participantes",
      `Instituciones participantes: ${val(annex.data, "participatingInstitutions", "Universidad Laica Eloy Alfaro de Manabí")}`,
    );
    next = replaceText(
      next,
      "Investigadores del estudio",
      `Investigadores del estudio: ${val(annex.data, "studyResearchers", annex.researcherName)}`,
    );

    const defaultRows = [
      "Declaración de responsabilidad",
      "Carta de interés de el/las máximas autoridades de el/los establecimientos",
      "Solicitud de exención con justificación para considerarlo exento",
      "Formulario para la presentación de protocolos de investigaciones",
      "Instrumentos que se emplearán para la ejecución del estudio",
    ];
    defaultRows.forEach((row, index) => {
      const doc = annex.documents[index];
      const name =
        doc?.name ??
        (index === 4 && annex.documents.length > 5
          ? `${annex.documents
              .slice(4)
              .map((i) => i.name)
              .join("; ")}`
          : "—");
      const date = doc ? formatDate(doc.uploadedAt) : "—";
      next = fillTableRow(next, row, [name, "—", date]);
    });
    return next;
  }

  private applyAnnex12(xml: string, annex: GeneratedAnnexData): string {
    const affiliation = val(annex.data, "affiliation", "No registrada");
    const issueDate = val(annex.data, "reviewedAt");
    let next = fillTableRow(xml, "Título de laInvestigación:", [annex.title]);
    next = fillTableRow(next, "Código:", [annex.researchCode]);
    next = fillTableRow(next, "Tipo de Investigación:", [
      val(annex.data, "researchType", "Investigación sin riesgo"),
    ]);
    next = fillTableRow(next, "Carrera/Instituto:", [affiliation]);
    next = fillTableRow(next, "Lugar a Efectuarse:", [
      val(annex.data, "location", "No registrado"),
    ]);
    next = fillTableRow(next, "Entidad Patrocinadora", [
      val(annex.data, "sponsor", "No aplica"),
    ]);
    next = fillTableRow(next, "Instituciones/CentrosInvolucrados:", [
      val(annex.data, "involvedInstitutions", affiliation),
    ]);
    next = fillTableRow(next, "Financiamiento", [
      val(annex.data, "funding", "No aplica"),
    ]);
    next = fillTableRow(next, "Institución/esResponsables:", [
      val(annex.data, "responsibleInstitutions", affiliation),
    ]);
    next = fillTableRow(next, "Investigador Principal.", [
      `${annex.researcherName} · Cédula: ${val(annex.data, "researcherId", "No registrada")} · ${val(annex.data, "researcherDegree", "Título no registrado")}`,
    ]);
    next = fillTableRow(next, "Fecha de Comienzo:", [
      val(annex.data, "startDate", "No registrada"),
    ]);
    next = fillTableRow(next, "Facha Propuesta deCulminación:", [
      val(annex.data, "endDate", "No registrada"),
    ]);
    next = fillTableRow(next, "Fecha de Recepción:", [
      formatDate(val(annex.data, "receivedAt", issueDate)),
    ]);

    const checklist = Array.isArray(annex.data.checklist)
      ? annex.data.checklist
      : [];
    for (const rawItem of checklist) {
      if (!rawItem || typeof rawItem !== "object") continue;
      const item = rawItem as Record<string, unknown>;
      const id = val(item, "id");
      const anchor = ANNEX_12_TEMPLATE_ANCHORS[id];
      if (!anchor) continue;
      const detail = val(item, "observations");
      next = fillLastTableCell(
        next,
        anchor,
        `${checklistResultLabel(item.result)}${detail ? ` — ${detail}` : ""}`,
        ANNEX_12_TEMPLATE_OCCURRENCES[id] ?? 1,
      );
    }

    const general = val(annex.data, "generalObservations");
    if (general) {
      next = replaceText(
        next,
        "(Firma del miembro evaluador CEISH-Uleam)",
        `Observaciones generales: ${general}\n\n(Firma del miembro evaluador CEISH-Uleam)`,
      );
    }
    next = replaceText(next, "Nombres y Apellidos", annex.memberName);
    next = replaceText(
      next,
      "Fecha: ______________________________________",
      `Fecha: ${formatDate(issueDate)}`,
    );
    return next;
  }

  private applyAnnex13(xml: string, annex: GeneratedAnnexData): string {
    const affiliation = val(
      annex.data,
      "affiliation",
      "Universidad Laica Eloy Alfaro de Manabí",
    );
    const reviewedAt = formatDate(val(annex.data, "reviewedAt"));
    let next = replaceText(
      xml,
      "Nombre del Investigador Principal",
      annex.researcherName,
    );
    next = replaceText(next, "INSTITUCIÓN A LA QUE PERTENECE", affiliation);
    next = replaceText(next, "___________", annex.researcherName);
    next = replaceText(next, "______________", annex.title);
    next = replaceText(next, "día-mes-año", reviewedAt);
    next = replaceText(
      next,
      "(número de versión)",
      `(revisión ${val(annex.data, "revisionNumber", "1")})`,
    );
    next = replaceText(next, "XXXX XXXX XXXX", annex.researchCode);
    next = replaceText(
      next,
      "INDICAR EL NOMBRE DE LA INSTITUCIÓN",
      affiliation,
    );
    next = replaceText(next, '"TITULO"', `"${annex.title}"`);
    next = replaceText(next, "(NOMBRE DE LA INSTITUCIÓN)", affiliation);
    if (val(annex.data, "decision") === "cancelled") {
      next = replaceText(
        next,
        "carta de aprobación definitiva- estudios observacionales/de intervención",
        "resolución de no aprobación y cierre del caso",
      );
      next = replaceText(next, "APROBADO", "NO APROBADO");
    }
    return next;
  }

  private applyAnnex23(xml: string, annex: GeneratedAnnexData): string {
    const hasConflict = annex.data.hasConflict === true;
    const placeDate = val(annex.data, "placeDate", `Manta, ${formatDate("")}`);
    let next = replaceText(xml, "Lugar y fecha", placeDate);
    next = replaceText(next, "NOMBRE DEL MIEMBRO DEL CEISH", annex.memberName);
    next = replaceText(next, "…………..", annex.title);
    next = replaceText(
      next,
      "NOMBRE Y FIRMA DEL MIEMBRO DEL CEISH-Uleam",
      annex.memberName,
    );
    if (hasConflict) {
      next = replaceText(
        next,
        "no poseer conflicto de interés personal o profesional",
        "poseer conflicto de interés personal o profesional",
      );
      const details = val(
        annex.data,
        "details",
        "No se proporcionó detalle adicional.",
      );
      next = replaceText(
        next,
        "eximiré mi participación.",
        `eximiré mi participación. Detalle declarado: ${details}`,
      );
    }
    return next;
  }

  private applyAnnex27(xml: string, annex: GeneratedAnnexData): string {
    let next = fillTableRow(xml, "Título de laInvestigación:", [annex.title]);
    next = fillTableRow(next, "Código CEISH-Uleam:", [annex.researchCode]);
    next = fillTableRow(next, "Tipo de Investigación:", [
      val(annex.data, "researchType", "Investigación sin riesgo"),
    ]);
    next = fillTableRow(next, "Lugar a Efectuarse:", [
      val(annex.data, "location"),
    ]);
    next = fillTableRow(next, "Institución/esResponsables:", [
      val(annex.data, "responsibleInstitutions"),
    ]);
    next = fillTableRow(
      next,
      "Investigador Principal.Cédula.Título de 4to Nivel (si aplica):",
      [
        `${annex.researcherName} · Cédula: ${val(annex.data, "principalInvestigatorId")} · ${val(annex.data, "principalInvestigatorDegree", "Sin título registrado")}`,
      ],
    );

    const templateIndicators = [
      "Investigaciones que no se realizan sobre seres humanos, sus datos o sus muestras biológicas.",
      "Investigaciones que utilizan datos abiertos o públicos.",
      "Análisis secundario de datos consolidados o bases de datos anonimizadas",
      "Revisiones de políticas públicas y reglamentación.",
      "Investigaciones que utilizan fuentes secundarias de literatura científica.",
      "Investigaciones que evalúen anónimamente el sabor y/o calidad de alimentos",
      "Investigaciones que evalúen anónimamente programas públicos o prácticas educativas.",
      "Investigaciones con recopilación de información de forma anónima",
    ];
    const criteria = Array.isArray(annex.data.criteria)
      ? annex.data.criteria
      : [];
    for (const [index, rawCriterion] of criteria.entries()) {
      if (!rawCriterion || typeof rawCriterion !== "object") continue;
      const criterion = rawCriterion as Record<string, unknown>;
      const indicator = templateIndicators[index];
      if (!indicator) continue;
      const answer = val(criterion, "answer");
      next = fillTableRow(next, indicator, [
        answer === "yes" ? "X" : "",
        answer === "no" ? "X" : "",
        val(criterion, "observations"),
      ]);
    }
    next = replaceRiskConclusion(next, "Investigación sin riesgo");
    next = replaceText(next, "Nombres y Apellidos ", annex.memberName);
    next = replaceText(next, "Nombres y Apellidos", annex.memberName);
    next = replaceText(
      next,
      "Fecha: _______________________________",
      `Fecha: ${formatDate("")}`,
    );
    return next;
  }
}
