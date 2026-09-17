import { execFile as execFileCallback } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

export interface GeneratedAnnexData {
  annexNumber: 11 | 23 | 27;
  researchCode: string;
  title: string;
  researcherName: string;
  memberName: string;
  data: Record<string, unknown>;
  documents: Array<{ name: string; uploadedAt: string }>;
}

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceText(xml: string, target: string, value: string): string {
  const isPlaceholder = /^X+$/.test(target);
  const expression = new RegExp(
    `(<w:t\\b[^>]*>)${isPlaceholder ? '(?<!X)' : ''}${escapeRegex(target)}${isPlaceholder ? '(?!X)' : ''}(<\\/w:t>)`,
    'g',
  );
  const directReplacement = xml.replace(expression, `$1${xmlEscape(value)}$2`);
  if (directReplacement !== xml) return directReplacement;

  const plainExpression = new RegExp(
    `${isPlaceholder ? '(?<!X)' : ''}${escapeRegex(target)}${isPlaceholder ? '(?!X)' : ''}`,
  );
  let replacedAcrossRuns = false;
  return directReplacement.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) => {
    const text = plainText(paragraph);
    if (replacedAcrossRuns || !plainExpression.test(text)) return paragraph;
    replacedAcrossRuns = true;
    const updatedText = text.replace(plainExpression, value);
    let wroteText = false;
    return paragraph.replace(/(<w:t\b[^>]*>)[\s\S]*?(<\/w:t>)/g, (_match, start, end) => {
      if (wroteText) return `${start}${end}`;
      wroteText = true;
      return `${start}${xmlEscape(updatedText)}${end}`;
    });
  });
}

function plainText(xml: string): string {
  return xml
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function writeCellText(cell: string, value: string): string {
  const escaped = xmlEscape(value);
  if (/<w:t\b[^>]*\/>/.test(cell)) {
    return cell.replace(/<w:t\b[^>]*\/>/, `<w:t xml:space="preserve">${escaped}</w:t>`);
  }
  if (/<w:t\b[^>]*>[\s\S]*?<\/w:t>/.test(cell)) {
    return cell.replace(/(<w:t\b[^>]*>)[\s\S]*?(<\/w:t>)/, `$1${escaped}$2`);
  }
  return cell.replace('</w:p>', `<w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`);
}

function fillTableRow(xml: string, label: string, values: string[]): string {
  let updated = false;
  return xml.replace(/<w:tr\b[\s\S]*?<\/w:tr>/g, (row) => {
    if (updated || !plainText(row).includes(label)) return row;
    const cells = row.match(/<w:tc\b[\s\S]*?<\/w:tc>/g);
    if (!cells || cells.length < values.length + 1) return row;
    updated = true;
    const replaced = cells.map((cell, index) => (
      index > 0 && index <= values.length ? writeCellText(cell, values[index - 1]) : cell
    ));
    let cursor = 0;
    return row.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, () => replaced[cursor++]);
  });
}

function replaceRiskConclusion(xml: string, conclusion: string): string {
  let updated = false;
  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) => {
    if (updated || !plainText(paragraph).includes(', es:')) return paragraph;
    updated = true;
    let replaced = false;
    return paragraph
      .replace(/(<w:t\b[^>]*>[^<]*, es:\s*)_+(<\/w:t>)/, `$1${xmlEscape(conclusion)}$2`)
      .replace(/(<w:t\b[^>]*>)_+(<\/w:t>)/, (match, start, end) => {
        if (replaced) return match;
        replaced = true;
        return `${start}${end}`;
      });
  });
}

function value(data: Record<string, unknown>, key: string, fallback = ''): string {
  const item = data[key];
  return typeof item === 'string' && item.trim() ? item.trim() : fallback;
}

function formatDate(raw: string): string {
  // Las fechas de los inputs HTML no incluyen zona horaria. Al interpretarlas
  // como UTC podían mostrarse con un día menos en Ecuador.
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00`) : raw ? new Date(raw) : new Date();
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
}

function applyAnnex11(xml: string, annex: GeneratedAnnexData): string {
  const issueDate = formatDate(value(annex.data, 'issueDate'));
  let next = replaceText(xml, 'Oficio Nro.', `Oficio Nro. ${value(annex.data, 'officeNumber', annex.researchCode)}`);
  next = replaceText(next, 'Manta, XX de XX 20XX', `Manta, ${issueDate}`);
  next = replaceText(next, 'XXXXXXXXX', annex.researcherName);
  next = replaceText(next, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXX', annex.title);
  next = replaceText(next, 'XXXXXXXX', annex.researchCode);
  next = replaceText(next, 'Tipo de estudio', `Tipo de estudio: ${value(annex.data, 'studyType', 'Investigación sin riesgo')}`);
  next = replaceText(next, 'Duración del estudio (meses)', `Duración del estudio (meses): ${value(annex.data, 'durationMonths', 'No especificada')}`);
  next = replaceText(next, 'Instituciones participantes', `Instituciones participantes: ${value(annex.data, 'participatingInstitutions', 'Universidad Laica Eloy Alfaro de Manabí')}`);
  next = replaceText(next, 'Investigadores del estudio', `Investigadores del estudio: ${value(annex.data, 'studyResearchers', annex.researcherName)}`);

  const defaultRows = [
    'Declaración de responsabilidad',
    'Carta de interés de el/las máximas autoridades de el/los establecimientos',
    'Solicitud de exención con justificación para considerarlo exento',
    'Formulario para la presentación de protocolos de investigaciones',
    'Instrumentos que se emplearán para la ejecución del estudio',
  ];
  defaultRows.forEach((row, index) => {
    const document = annex.documents[index];
    const name = document?.name ?? (index === 4 && annex.documents.length > 5
      ? `${annex.documents.slice(4).map((item) => item.name).join('; ')}`
      : '—');
    const date = document ? formatDate(document.uploadedAt) : '—';
    next = fillTableRow(next, row, [name, '—', date]);
  });
  return next;
}

function applyAnnex23(xml: string, annex: GeneratedAnnexData): string {
  const hasConflict = annex.data.hasConflict === true;
  const placeDate = value(annex.data, 'placeDate', `Manta, ${formatDate('')}`);
  let next = replaceText(xml, 'Lugar y fecha', placeDate);
  next = replaceText(next, 'NOMBRE DEL MIEMBRO DEL CEISH', annex.memberName);
  next = replaceText(next, '…………..', annex.title);
  next = replaceText(next, 'NOMBRE Y FIRMA DEL MIEMBRO DEL CEISH-Uleam', annex.memberName);
  if (hasConflict) {
    next = replaceText(next, 'no poseer conflicto de interés personal o profesional', 'poseer conflicto de interés personal o profesional');
    const details = value(annex.data, 'details', 'No se proporcionó detalle adicional.');
    next = replaceText(next, 'eximiré mi participación.', `eximiré mi participación. Detalle declarado: ${details}`);
  }
  return next;
}

function applyAnnex27(xml: string, annex: GeneratedAnnexData): string {
  let next = fillTableRow(xml, 'Título de laInvestigación:', [annex.title]);
  next = fillTableRow(next, 'Código CEISH-Uleam:', [annex.researchCode]);
  next = fillTableRow(next, 'Tipo de Investigación:', [value(annex.data, 'researchType', 'Investigación sin riesgo')]);
  next = fillTableRow(next, 'Lugar a Efectuarse:', [value(annex.data, 'location')]);
  next = fillTableRow(next, 'Institución/esResponsables:', [value(annex.data, 'responsibleInstitutions')]);
  next = fillTableRow(next, 'Investigador Principal.Cédula.Título de 4to Nivel (si aplica):', [
    `${annex.researcherName} · Cédula: ${value(annex.data, 'principalInvestigatorId')} · ${value(annex.data, 'principalInvestigatorDegree', 'Sin título registrado')}`,
  ]);

  // El texto presentado en la interfaz es más breve que el texto normativo de
  // la plantilla. Se conserva la tabla original localizando cada fila por su
  // inicio institucional y usando el orden fijo de los ocho criterios sin riesgo.
  const templateIndicators = [
    'Investigaciones que no se realizan sobre seres humanos, sus datos o sus muestras biológicas.',
    'Investigaciones que utilizan datos abiertos o públicos.',
    'Análisis secundario de datos consolidados o bases de datos anonimizadas',
    'Revisiones de políticas públicas y reglamentación.',
    'Investigaciones que utilizan fuentes secundarias de literatura científica.',
    'Investigaciones que evalúen anónimamente el sabor y/o calidad de alimentos',
    'Investigaciones que evalúen anónimamente programas públicos o prácticas educativas.',
    'Investigaciones con recopilación de información de forma anónima',
  ];
  const criteria = Array.isArray(annex.data.criteria) ? annex.data.criteria : [];
  for (const [index, rawCriterion] of criteria.entries()) {
    if (!rawCriterion || typeof rawCriterion !== 'object') continue;
    const criterion = rawCriterion as Record<string, unknown>;
    const indicator = templateIndicators[index];
    if (!indicator) continue;
    const answer = value(criterion, 'answer');
    next = fillTableRow(next, indicator, [answer === 'yes' ? 'X' : '', answer === 'no' ? 'X' : '', value(criterion, 'observations')]);
  }
  next = replaceRiskConclusion(next, 'Investigación sin riesgo');
  next = replaceText(next, 'Nombres y Apellidos ', annex.memberName);
  next = replaceText(next, 'Nombres y Apellidos', annex.memberName);
  next = replaceText(next, 'Fecha: _______________________________', `Fecha: ${formatDate('')}`);
  return next;
}

function templateName(annexNumber: GeneratedAnnexData['annexNumber']): string {
  return `anexo-${annexNumber}.docx`;
}

/** Genera un .docx partiendo de la plantilla institucional y conserva su formato. */
export async function generateAnnexDocx(annex: GeneratedAnnexData): Promise<Buffer> {
  const workingDirectory = await mkdtemp(path.join(tmpdir(), 'ceish-annex-'));
  const extractedDirectory = path.join(workingDirectory, 'template');
  const outputPath = path.join(workingDirectory, `Anexo-${annex.annexNumber}-${annex.researchCode}.docx`);
  const templatePath = path.resolve(process.cwd(), 'public', 'annex-templates', templateName(annex.annexNumber));

  try {
    await cp(templatePath, path.join(workingDirectory, 'source.docx'));
    await execFile('unzip', ['-qq', 'source.docx', '-d', extractedDirectory], { cwd: workingDirectory });
    const documentXmlPath = path.join(extractedDirectory, 'word', 'document.xml');
    const source = await readFile(documentXmlPath, 'utf8');
    const transformed = annex.annexNumber === 11
      ? applyAnnex11(source, annex)
      : annex.annexNumber === 23 ? applyAnnex23(source, annex) : applyAnnex27(source, annex);
    await writeFile(documentXmlPath, transformed);
    await execFile('zip', ['-q', '-r', outputPath, '.'], { cwd: extractedDirectory });
    return readFile(outputPath);
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}
