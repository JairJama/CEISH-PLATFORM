export type QuestionnaireAnswer = string | string[];

export type QuestionnaireAnswers = Record<string, QuestionnaireAnswer>;

export type QuestionnaireQuestionType = 'text' | 'textarea' | 'date' | 'single' | 'multiple';

export interface QuestionnaireQuestion {
  id: string;
  number: number;
  label: string;
  type: QuestionnaireQuestionType;
  options?: string[];
  allowOther?: boolean;
  required?: boolean;
}

export const OTHER_OPTION = 'Otras';

export const OTHER_ANSWER_SUFFIX = '_other';

export const questionnaireQuestions: QuestionnaireQuestion[] = [
  {
    id: 'q1',
    number: 1,
    type: 'text',
    required: true,
    label: 'CÓDIGO CEISH-ULEAM (solo escriba el número con los 4 dígitos, por ejemplo: 0325)',
  },
  {
    id: 'q3',
    number: 3,
    type: 'single',
    required: true,
    label: 'PROCESO QUE SOLICITA',
    options: ['REVISIÓN', 'ENMIENDA', 'RENOVACIÓN'],
    allowOther: true,
  },
  {
    id: 'q4',
    number: 4,
    type: 'multiple',
    required: true,
    label:
      'SU PROTOCOLO GUARDA RELACIÓN DIRECTA O INDIRECTA CON ALGUNO DE LOS SIGUIENTES MIEMBROS DEL CEISH-ULEAM, DE TAL FORMA QUE EL MIEMBRO PUEDA INCURRIR EN ALGÚN CONFLICTO DE INTERÉS',
    options: [
      'OD. JUAN SIERRA',
      'DRA. ANNABELL CEDEÑO',
      'DRA. MABEL SÁNCHEZ',
      'DRA. VERÓNICA FRANCO',
      'DR. YURI MEDRANO',
      'ING. JOSÉ HUALPA',
      'ABG. HOLGER VÉLEZ',
      'SRA. YESSICA ÁLVAREZ',
      'NO APLICA',
    ],
  },
  {
    id: 'q5',
    number: 5,
    type: 'single',
    required: true,
    label:
      'DE ACUERDO CON LO LLENADO EN EL ANEXO 5, DECLARACIÓN DE TENER O NO CONFLICTOS DE INTERESES, ¿EXISTE ALGÚN CONFLICTO DE INTERÉS?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q6',
    number: 6,
    type: 'multiple',
    required: true,
    label:
      'SELECCIONE CUÁL DE LOS SIGUIENTES CONFLICTOS DE INTERÉS APLICA PARA SU PROTOCOLO. PUEDE SELECCIONAR MÁS DE UNO',
    options: [
      'Un miembro de mi familia, en primero-segundo grado de consanguinidad-afinidad, tiene algún tipo de relación o interés económico con la entidad-investigadores que financian o implementan este estudio',
      'Tengo un interés personal en la propiedad intelectual de los datos producto de este estudio',
      'Me han ofrecido algún tipo de “incentivo” para realizar el estudio, a cambio de compartir los resultados',
      'Mi relación con alguno de los investigadores del estudio pudiera generar algún tipo de conflicto dentro de la implementación del estudio',
      'Mi relación con las posibles participantes y-o comunidad que podrían ser parte de esta investigación, pudiera generar algún tipo de conflicto dentro de la implementación del estudio',
      'Tengo algún tipo de obligación sea académica, económica, moral o personal con uno o varios de los posibles participantes en este estudio',
    ],
    allowOther: true,
  },
  {
    id: 'q7',
    number: 7,
    type: 'text',
    required: true,
    label: 'DETALLE LA FORMA DE MITIGAR EL/LOS POSIBLES CONFLICTOS DE INTERÉS',
  },
  {
    id: 'q8',
    number: 8,
    type: 'date',
    required: true,
    label:
      'FECHA DE INICIO DE EJECUCIÓN DEL PROTOCOLO (no corresponde a una fecha previa a la fecha de recepción; el protocolo se ejecuta después de la aprobación del comité, aproximadamente 2 meses después de la fecha de recepción)',
  },
  {
    id: 'q9',
    number: 9,
    type: 'date',
    required: true,
    label: 'FECHA DE FIN DEL PROTOCOLO (corresponde a la fecha en la cual usted entrega su producto final)',
  },
  {
    id: 'q10',
    number: 10,
    type: 'text',
    required: true,
    label:
      'ESCRIBA LOS NOMBRES Y APELLIDOS COMPLETOS DE LOS OTROS INVESTIGADORES EN MAYÚSCULA, USE ";" PARA SEPARAR, NO USE TILDE NI CUALQUIER OTRO SÍMBOLO',
  },
  {
    id: 'q11',
    number: 11,
    type: 'single',
    required: true,
    label:
      'EL INVESTIGADOR PRINCIPAL (IP) O ALGÚN OTRO INVESTIGADOR ¿PERTENECE A LA ULEAM? DE NO SER EL CASO, SELECCIONE OTRAS Y DETALLE EL NOMBRE DE LA INSTITUCIÓN A LA QUE PERTENECE',
    options: ['ULEAM'],
    allowOther: true,
  },
  {
    id: 'q12',
    number: 12,
    type: 'single',
    required: true,
    label:
      'DADO EL CASO DE QUE EL IP U OTRO INVESTIGADOR NO PERTENEZCAN A LA ULEAM, SE LE RECUERDA QUE EL CEISH-ULEAM SOLO REVISARÁ PROYECTOS DE INSTITUCIONES EXTERNAS QUE MANTENGAN CONVENIOS EN INVESTIGACIÓN Y/O VINCULACIÓN CON LA ULEAM. ¿LA INSTITUCIÓN A LA QUE PERTENECE EL IP U OTRO INVESTIGADOR MANTIENE UN CONVENIO CON LA ULEAM?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q13',
    number: 13,
    type: 'text',
    required: true,
    label:
      'INSTITUCIÓN PARTICIPANTE PRINCIPAL (es aquella que lidera la ejecución de la investigación, no donde se realiza la investigación)',
  },
  {
    id: 'q14',
    number: 14,
    type: 'single',
    required: true,
    label:
      '¿EL PROTOCOLO INCLUYE INSTITUCIONES PARTICIPANTES ANEXAS? (son aquellas que participan de la ejecución de la investigación, no donde se realiza la investigación)',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q15',
    number: 15,
    type: 'text',
    required: true,
    label:
      'DETALLE EL NOMBRE DE LA/S INSTITUCIÓN/ES PARTICIPANTE/S ANEXAS (son aquellas que participan en la ejecución de la investigación, no donde se realiza la investigación). Si son más de una, use ";" para separar los nombres',
  },
  {
    id: 'q16',
    number: 16,
    type: 'single',
    required: true,
    label: '¿LOS SUJETOS DE ESTUDIO SON MIEMBROS DE LA COMUNIDAD UNIVERSITARIA?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q17',
    number: 17,
    type: 'single',
    required: true,
    label: '¿LOS SUJETOS DE ESTUDIO PERTENECEN A UNA INSTITUCIÓN?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q18',
    number: 18,
    type: 'text',
    required: true,
    label:
      'DETALLE EL NOMBRE DEL BARRIO/S, PARROQUIA/S, CIUDAD/ES, PROVINCIA/S, ZONA/S DE PLANIFICACIÓN, SEGÚN APLIQUE EN SU CASO PARTICULAR (ejemplo: CARRERA ODONTOLOGÍA, ULEAM, MANTA)',
  },
  {
    id: 'q19',
    number: 19,
    type: 'text',
    required: true,
    label: 'DETALLE EL NOMBRE DE LA/S INSTITUCIÓN/ES DONDE EJECUTARÁ SU ESTUDIO',
  },
  {
    id: 'q20',
    number: 20,
    type: 'single',
    required: true,
    label: 'TIPO DE FINANCIAMIENTO',
    options: ['FINANCIAMIENTO INTERNO', 'FINANCIAMIENTO EXTERNO', 'AUTOFINANCIAMIENTO'],
  },
  {
    id: 'q21',
    number: 21,
    type: 'text',
    required: true,
    label: 'MONTO DEL FINANCIAMIENTO',
  },
  {
    id: 'q22',
    number: 22,
    type: 'text',
    required: true,
    label: '¿CUÁL ES EL TÍTULO DE SU PROTOCOLO?',
  },
  {
    id: 'q23',
    number: 23,
    type: 'text',
    required: true,
    label: '¿CUÁL ES EL OBJETIVO GENERAL DE SU PROTOCOLO?',
  },
  {
    id: 'q24',
    number: 24,
    type: 'single',
    required: true,
    label: 'SU INVESTIGACIÓN ES:',
    options: [
      'PRIMARIA (USA DATOS ORIGINALES)',
      'SECUNDARIA (USA INFORMACIÓN PROVENIENTE DE LITERATURA CIENTÍFICA)',
    ],
  },
  {
    id: 'q25',
    number: 25,
    type: 'single',
    required: true,
    label: 'TIPO DE INVESTIGACIÓN SECUNDARIA',
    options: ['REVISIÓN BIBLIOGRÁFICA', 'REVISIÓN SISTEMÁTICA', 'META ANÁLISIS'],
  },
  {
    id: 'q26',
    number: 26,
    type: 'single',
    required: true,
    label: 'TIPO DE INVESTIGACIÓN PRIMARIA',
    options: [
      'OBSERVACIONAL: empírico, donde no se intervienen o modifican las variables',
      'DE INTERVENCIÓN: el investigador controla la exposición a una medida educativa, conductual, nutricional, ambiental, preventiva o terapéutica; excluye los ensayos clínicos',
      'ENSAYO CLÍNICO: el investigador controla la exposición a medicamentos, dispositivos médicos, productos biológicos, productos medicinales de origen natural y otros productos sujetos a registro y control sanitario',
    ],
  },
  {
    id: 'q27',
    number: 27,
    type: 'single',
    required: true,
    label: 'SU INVESTIGACIÓN PRIMARIA OBSERVACIONAL TIENE UN ENFOQUE',
    options: ['CUALITATIVO', 'CUANTITATIVO', 'MIXTO'],
  },
  {
    id: 'q28',
    number: 28,
    type: 'single',
    required: true,
    label:
      'SU INVESTIGACIÓN PRIMARIA OBSERVACIONAL CON ENFOQUE CUANTITATIVO CORRESPONDE CON EL SIGUIENTE DISEÑO',
    options: [
      'ESTUDIO DE COHORTE',
      'ESTUDIO DE CASOS Y CONTROLES',
      'ESTUDIOS TRANSVERSALES',
      'REPORTE DE CASO',
      'SERIES DE CASOS',
      'ESTUDIOS ECOLÓGICOS',
    ],
    allowOther: true,
  },
  {
    id: 'q29',
    number: 29,
    type: 'single',
    required: true,
    label:
      'SU INVESTIGACIÓN PRIMARIA OBSERVACIONAL CON ENFOQUE CUALITATIVO CORRESPONDE CON EL SIGUIENTE DISEÑO',
    options: [
      'ESTUDIO FENOMENOLÓGICO',
      'TEORÍA FUNDAMENTADA',
      'MÉTODO ETNOGRÁFICO',
      'ESTUDIO DE CASO CUALITATIVO',
    ],
    allowOther: true,
  },
  {
    id: 'q30',
    number: 30,
    type: 'single',
    required: true,
    label: 'SU INVESTIGACIÓN PRIMARIA DE INTERVENCIÓN CORRESPONDE CON EL SIGUIENTE DISEÑO',
    options: ['ENSAYO DE CAMPO', 'ENSAYOS COMUNITARIOS'],
    allowOther: true,
  },
  {
    id: 'q31',
    number: 31,
    type: 'single',
    required: true,
    label: 'SU INVESTIGACIÓN PRIMARIA DE ENSAYO CLÍNICO CORRESPONDE CON EL SIGUIENTE DISEÑO',
    options: [
      'ENSAYO CLÍNICO NO CONTROLADO',
      'ENSAYO CLÍNICO CONTROLADO ALEATORIZADO',
      'ENSAYO CLÍNICO CONTROLADO NO ALEATORIZADO (CUASI-EXPERIMENTAL)',
    ],
    allowOther: true,
  },
  {
    id: 'q32',
    number: 32,
    type: 'single',
    required: true,
    label:
      'CONOCIENDO QUE LA DEFINICIÓN DE PATROCINADOR/PROMOTOR ES "Individuo, empresa, institución u organización responsable del inicio, gestión y/o financiación de un ensayo clínico", ¿SU PROTOCOLO ESTÁ VINCULADO A UN PROMOTOR O PATROCINADOR?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q33',
    number: 33,
    type: 'text',
    required: true,
    label: 'DETALLE EL NOMBRE DE SU PATROCINADOR/PROMOTOR',
  },
  {
    id: 'q34',
    number: 34,
    type: 'single',
    required: true,
    label:
      'DE ACUERDO CON EL MOMENTO EN EL QUE OCURRE EL FENÓMENO Y SU REGISTRO, SU PROTOCOLO ES:',
    options: [
      'PROSPECTIVO (RECOLECTARÁ INFORMACIÓN SOBRE HECHOS PRESENTES)',
      'RETROSPECTIVO (RECOLECTA INFORMACIÓN SOBRE HECHOS PASADOS O REGISTRA DATOS RECOLECTADOS EN EL PASADO)',
      'NO APLICA',
    ],
  },
  {
    id: 'q35',
    number: 35,
    type: 'single',
    required: true,
    label:
      'DE ACUERDO CON LA RELACIÓN A LA SECUENCIA TEMPORAL DEL FENÓMENO ESTUDIADO, SU PROTOCOLO ES:',
    options: [
      'TRANSVERSAL: REALIZARÁ UNA ÚNICA MEDICIÓN EN EL TIEMPO',
      'LONGITUDINAL: REALIZARÁ VARIAS MEDICIONES EN EL TIEMPO',
      'NO APLICA',
    ],
  },
  {
    id: 'q36',
    number: 36,
    type: 'single',
    required: true,
    label: 'Seleccione una opción',
    options: ['Opción 1', 'Opción 2'],
  },
  {
    id: 'q37',
    number: 37,
    type: 'textarea',
    required: true,
    label:
      'DEFINA LA POBLACIÓN DE ESTUDIO Y SU MUESTRA (quiénes y cuántos son la población de estudio o universo, cuántos son los sujetos seleccionados o muestra y cuál es la técnica de muestreo). Ejemplo para estudios cuantitativos: "La población de estudio corresponde a niños de entre 8 a 12 años que asisten a la Unidad Educativa Julio Jaramillo, que según la institución corresponden a 235 estudiantes, de los cuales, acorde con una calculadora del tamaño muestral y considerando un intervalo de confianza del 95% y un margen de error del 5%, se definió una muestra de 147 estudiantes seleccionados por un muestreo por conveniencia". Ejemplo para estudios cualitativos: "La población de estudio está compuesta por 300 profesionales que trabajan en el área de gestión de recursos humanos en 80 empresas de la ciudad de Portoviejo. Dado el enfoque cualitativo, la muestra no busca ser representativa numéricamente, sino que se seleccionará con base en criterios específicos relacionados con la experiencia y el conocimiento profundo del fenómeno de interés. Se elegirá una muestra por conveniencia de 12 profesionales". Recuerde que esto solo es una guía de criterios mínimos',
  },
  {
    id: 'q38',
    number: 38,
    type: 'single',
    required: true,
    label:
      'CONOCIENDO QUE LA DEFINICIÓN DE GRUPOS VULNERABLES ES "Son personas que aparte de pertenecer a un grupo prioritario presentan condiciones particulares debilitantes o de riesgo y, por lo tanto, se incrementa su estado de exposición general". Si su protocolo no estudia grupos vulnerables seleccione "NO APLICA"; si incluye grupos vulnerables seleccione de la lista o, en su defecto, seleccione "Otras" y explique la condición de vulnerabilidad',
    options: [
      'Mujeres embarazadas con riesgo',
      'Personas víctimas de violencia de género',
      'Personas con discapacidad física e intelectual en abandono y con enfermedades asociadas',
      'Personas con intentos suicidas',
      'Niños menores de dos años con desnutrición aguda',
      'Personas que adolecen enfermedades catastróficas o de alta complejidad, que no tengan adecuado control de ellas o requieran cuidados paliativos',
      'Personas con riesgo genético',
      'NO APLICA',
    ],
    allowOther: true,
  },
  {
    id: 'q39',
    number: 39,
    type: 'multiple',
    required: true,
    label: 'SU POBLACIÓN INCLUYE EL SIGUIENTE GRUPO ETARIO',
    options: ['MENORES DE 12', 'ENTRE 12 Y MENORES DE 18', '18 Y MAYORES'],
  },
  {
    id: 'q40',
    number: 40,
    type: 'single',
    required: true,
    label: 'SU POBLACIÓN INCLUYE PUEBLOS Y NACIONALIDADES INDÍGENAS',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q41',
    number: 41,
    type: 'single',
    required: true,
    label: '¿USA MUESTRAS BIOLÓGICAS?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q42',
    number: 42,
    type: 'single',
    required: true,
    label: 'LA MUESTRA BIOLÓGICA QUE EMPLEARÁ EN EL ESTUDIO',
    options: [
      'ES RECOLECTADA POR EL EQUIPO DE INVESTIGACIÓN',
      'ES UNA MUESTRA BIOLÓGICA PREVIAMENTE RECOLECTADA Y ALMACENADA',
    ],
  },
  {
    id: 'q43',
    number: 43,
    type: 'single',
    required: true,
    label:
      'SI ES UNA MUESTRA BIOLÓGICA PREVIAMENTE RECOLECTADA Y ALMACENADA, ¿ESTA CUENTA CON UN CONSENTIMIENTO INFORMADO AMPLIO QUE HAYA PERMITIDO SU ALMACENAMIENTO O USO EN FUTURAS INVESTIGACIONES?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q44',
    number: 44,
    type: 'single',
    required: true,
    label: '¿LA MUESTRA BIOLÓGICA ES RECOLECTADA ÚNICAMENTE CON EL PROPÓSITO DE ESTA INVESTIGACIÓN?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q45',
    number: 45,
    type: 'single',
    required: true,
    label:
      'SI LA MUESTRA BIOLÓGICA ES RECOLECTADA POR EL EQUIPO DE INVESTIGACIÓN, ¿CUÁL ES EL PROCEDIMIENTO DE RECOLECCIÓN?',
    options: [
      'BIOPSIA INCISIONAL',
      'BIOPSIA EXCISIONAL',
      'VENOCLISIS',
      'SANGRE PERIFÉRICA',
      'ASPIRACIÓN CON AGUJA FINA (LÍQUIDO)',
      'ASPIRACIÓN CON AGUJA GRUESA (TEJIDO)',
      'FROTIS O HISOPADO',
      'RECOLECCIÓN DE SECRECIONES Y/O DESECHOS',
    ],
    allowOther: true,
  },
  {
    id: 'q46',
    number: 46,
    type: 'single',
    required: true,
    label:
      'SI LA MUESTRA BIOLÓGICA ES RECOLECTADA POR EL EQUIPO DE INVESTIGACIÓN, ¿CUÁL ES EL TIPO DE MUESTRA BIOLÓGICA RECOLECTADA?',
    options: [
      'SANGRE',
      'SANGRE PERIFÉRICA',
      'HECES',
      'ORINA',
      'LÁGRIMAS',
      'SALIVA',
      'MÉDULA ÓSEA',
      'PUS',
      'LÍQUIDO CEFALORRAQUÍDEO',
      'TEJIDO DE CUALQUIER ZONA DEL CUERPO',
    ],
    allowOther: true,
  },
  {
    id: 'q47',
    number: 47,
    type: 'single',
    required: true,
    label:
      'CON EL PROPÓSITO DEL ANÁLISIS DE LA MUESTRA BIOLÓGICA, ¿ESTA DEBE SER EXPORTADA?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q48',
    number: 48,
    type: 'single',
    required: true,
    label:
      'SI CON EL PROPÓSITO DEL ANÁLISIS DE LA MUESTRA BIOLÓGICA ESTA DEBE SER EXPORTADA, ¿EL PROTOCOLO CUENTA CON PERMISO DEL ARCSA?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q49',
    number: 49,
    type: 'single',
    required: true,
    label:
      'SI LA MUESTRA BIOLÓGICA ES RECOLECTADA POR EL EQUIPO DE INVESTIGACIÓN, ¿ESTA SERÁ ALMACENADA DE FORMA TEMPORAL O INDEFINIDA?',
    options: ['TEMPORAL', 'INDEFINIDA'],
  },
  {
    id: 'q50',
    number: 50,
    type: 'text',
    required: true,
    label:
      'SI LA MUESTRA BIOLÓGICA RECOLECTADA POR EL EQUIPO DE INVESTIGACIÓN ES ALMACENADA DE FORMA TEMPORAL, DETALLE EL TIEMPO DE ALMACENAMIENTO O MOMENTO DE ELIMINACIÓN',
  },
  {
    id: 'q51',
    number: 51,
    type: 'text',
    required: true,
    label:
      'SI LA MUESTRA BIOLÓGICA RECOLECTADA POR EL EQUIPO DE INVESTIGACIÓN ES ALMACENADA DE FORMA TEMPORAL, DETALLE LA FORMA DE ELIMINACIÓN',
  },
  {
    id: 'q52',
    number: 52,
    type: 'text',
    required: true,
    label:
      'SI LA MUESTRA BIOLÓGICA RECOLECTADA POR EL EQUIPO DE INVESTIGADORES SERÁ ALMACENADA DE FORMA INDEFINIDA, DETALLE EL NOMBRE DE LA PERSONA RESPONSABLE, SU CARGO Y LA INSTITUCIÓN A LA QUE PERTENECE',
  },
  {
    id: 'q53',
    number: 53,
    type: 'single',
    required: true,
    label: 'SU MÉTODO DE RECOLECCIÓN DE DATOS ES:',
    options: [
      'PRIMARIA (DATOS RECOLECTADOS DIRECTAMENTE DE LA FUENTE ORIGINAL)',
      'SECUNDARIA (DATOS PREVIAMENTE RECOLECTADOS)',
    ],
  },
  {
    id: 'q54',
    number: 54,
    type: 'multiple',
    required: true,
    label: 'SI EL MÉTODO DE RECOLECCIÓN ES PRIMARIO, LA INFORMACIÓN SE RECOLECTARÁ DE FORMA',
    options: [
      'AUTÓNOMA (EL PARTICIPANTE LLENARÁ EL INSTRUMENTO DE RECOLECCIÓN DE DATOS DE FORMA INDEPENDIENTE SIN RECIBIR AYUDA DEL INVESTIGADOR, DE TAL FORMA QUE SE CONSERVA LA PRIVACIDAD)',
      'ASISTIDA (EL PARTICIPANTE LLENARÁ EL INSTRUMENTO DE RECOLECCIÓN DE DATOS CON LA AYUDA DEL INVESTIGADOR, DE TAL FORMA QUE EL INVESTIGADOR CONOCERÁ LA RESPUESTA DEL PARTICIPANTE)',
      'MIXTA',
    ],
    allowOther: true,
  },
  {
    id: 'q55',
    number: 55,
    type: 'single',
    required: true,
    label:
      'SI SU MÉTODO DE RECOLECCIÓN DE DATOS ES PRIMARIO, ¿SU INSTRUMENTO DE RECOLECCIÓN DE DATOS INCLUYE LA APLICACIÓN DE UNA HISTORIA CLÍNICA?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q56',
    number: 56,
    type: 'single',
    required: true,
    label: 'SI EL MÉTODO DE RECOLECCIÓN ES SECUNDARIO, LOS DATOS SE OBTIENEN A PARTIR DE:',
    options: [
      'DATOS ABIERTOS O PÚBLICOS',
      'BASE DE DATOS ANONIMIZADAS',
      'REVISIÓN DE HISTORIAS CLÍNICAS RECOLECTADAS PREVIAMENTE, QUE CUENTEN CON UN CONSENTIMIENTO INFORMADO AMPLIO QUE PERMITA SU USO PARA FUTURAS INVESTIGACIONES Y SEAN LAS HISTORIAS CLÍNICAS ENTREGADAS ANONIMIZADAS POR LA INSTITUCIÓN CUSTODIA',
    ],
    allowOther: true,
  },
  {
    id: 'q57',
    number: 57,
    type: 'single',
    required: true,
    label:
      'CONOCIENDO QUE LOS DATOS SENSIBLES SE DEFINEN COMO "Aquellos relativos a etnia, identidad de género, identidad cultural, religión, ideología, filiación política, pasado judicial, condición migratoria, orientación sexual, salud, datos biométricos, datos genéticos y aquellos cuyo tratamiento indebido pueda dar origen a discriminación, atenten o puedan atentar contra los derechos y libertades fundamentales", ¿CONSIDERA USTED QUE LOS DATOS QUE RECOLECTARÁ A TRAVÉS DE LOS INSTRUMENTOS DE RECOLECCIÓN DE LA INFORMACIÓN PUEDEN SER CONSIDERADOS DATOS SENSIBLES?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q58',
    number: 58,
    type: 'text',
    required: true,
    label: 'DEFINA CUÁL/ES ES/SON EL/LOS DATO/S SENSIBLE/S EN SU PROTOCOLO',
  },
  {
    id: 'q59',
    number: 59,
    type: 'single',
    required: true,
    label:
      'DURANTE SU PROCESO DE RECOLECCIÓN DE DATOS, ¿USTED USA HISTORIA CLÍNICA, YA SEA POR RECOLECCIÓN DIRECTA DE LA INFORMACIÓN CON EL PARTICIPANTE O POR REVISIÓN DE REGISTROS PREVIAMENTE RECOLECTADOS Y ALMACENADOS?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q60',
    number: 60,
    type: 'single',
    required: true,
    label:
      'DURANTE SU PROCESO DE RECOLECCIÓN DE DATOS, ¿USTED REGISTRA DATOS DE SALUD QUE NO SEAN CONSIDERADOS DATOS SENSIBLES (SUSCEPTIBLES DE CAUSAR DISCRIMINACIÓN EN CASO DE SER MAL USADOS), YA SEA POR RECOLECCIÓN DIRECTA DE LA INFORMACIÓN CON EL PARTICIPANTE O POR REVISIÓN DE REGISTROS PREVIAMENTE RECOLECTADOS Y ALMACENADOS?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q61',
    number: 61,
    type: 'single',
    required: true,
    label: 'EL INSTRUMENTO DE RECOLECCIÓN DE DATOS ES',
    options: ['ANÓNIMO', 'IDENTIFICATIVO'],
  },
  {
    id: 'q62',
    number: 62,
    type: 'single',
    required: true,
    label: 'SI EL INSTRUMENTO DE RECOLECCIÓN DE DATOS ES IDENTIFICATIVO, LOS DATOS IDENTIFICATIVOS SERÁN',
    options: ['ANONIMIZADOS', 'PSEUDONIMIZADOS'],
  },
  {
    id: 'q63',
    number: 63,
    type: 'text',
    required: true,
    label: 'DETALLE POR QUÉ ES IMPORTANTE QUE LA INFORMACIÓN RECOLECTADA SEA IDENTIFICATIVA',
  },
  {
    id: 'q64',
    number: 64,
    type: 'single',
    required: true,
    label: 'EL DESTINO FINAL DE LOS DATOS RECOLECTADOS SERÁ:',
    options: [
      'ALMACENADOS TEMPORALMENTE POR EL INVESTIGADOR PRINCIPAL POR 3 MESES PARA DESPUÉS SER ELIMINADOS DE FORMA SEGURA, LO CUAL ADEMÁS CATEGORIZA SU CONSENTIMIENTO INFORMADO COMO ESPECÍFICO',
      'ALMACENADOS DE FORMA INDEFINIDA PARA SU USO EN FUTURAS INVESTIGACIONES, LO CUAL ADEMÁS CATEGORIZA SU CONSENTIMIENTO INFORMADO COMO AMPLIO',
    ],
  },
  {
    id: 'q65',
    number: 65,
    type: 'text',
    required: true,
    label:
      'SI SU PROTOCOLO CONTEMPLA ALMACENAR LOS DATOS DE FORMA INDEFINIDA PARA SU USO EN FUTURAS INVESTIGACIONES, POR FAVOR DETALLE EL NOMBRE, CARGO E INSTITUCIÓN A LA QUE PERTENECE LA PERSONA RESPONSABLE DE SU CUSTODIA Y ALMACENAMIENTO',
  },
  {
    id: 'q66',
    number: 66,
    type: 'multiple',
    required: true,
    label:
      'PARA GARANTIZAR LA AUTONOMÍA DEL PARTICIPANTE, ¿QUÉ INSTRUMENTOS EMPLEARÁ? PUEDE ESCOGER MÁS DE UNA OPCIÓN',
    options: [
      'CONSENTIMIENTO INFORMADO SUSCRITO POR EL PARTICIPANTE',
      'CONSENTIMIENTO INFORMADO SUSCRITO POR EL REPRESENTANTE LEGAL',
      'ASENTIMIENTO INFORMADO (APLICA SOLO PARA JÓVENES ENTRE 12 Y MENORES DE 18)',
      'CONSENTIMIENTO INFORMADO COMUNITARIO (APLICA SOLO PARA PUEBLOS Y NACIONALIDADES INDÍGENAS)',
    ],
    allowOther: true,
  },
  {
    id: 'q67',
    number: 67,
    type: 'single',
    required: true,
    label: '¿CONSIDERA USTED QUE LA EJECUCIÓN DE SU PROTOCOLO IMPLICA ALGÚN TIPO DE RIESGO?',
    options: ['SÍ', 'NO'],
  },
  {
    id: 'q68',
    number: 68,
    type: 'multiple',
    required: true,
    label: 'SELECCIONE CUÁL ES EL TIPO DE RIESGO',
    options: ['RIESGOS FÍSICOS', 'RIESGOS SOCIALES', 'RIESGOS PSICOLÓGICOS'],
    allowOther: true,
  },
  {
    id: 'q69',
    number: 69,
    type: 'textarea',
    required: true,
    label: 'DETALLE EL RIESGO Y LA FORMA QUE HA CONTEMPLADO PARA MITIGARLO',
  },
  {
    id: 'q70',
    number: 70,
    type: 'single',
    required: true,
    label:
      'POR FAVOR LEA DETENIDAMENTE. CON EL FIN DE CONOCER EL RIESGO DE SU PROTOCOLO, INDIQUE CUÁL DE LAS SIGUIENTES AFIRMACIONES DEFINE MEJOR A SU PROTOCOLO. RECUERDE QUE SOLO PUEDE ESCOGER UNA',
    options: [
      'Investigaciones que no se realizan sobre seres humanos, sus datos o sus muestras biológicas',
      'Investigaciones que utilizan datos abiertos o públicos',
      'Análisis secundario de datos consolidados o bases de datos anonimizadas obtenidos de registros existentes, que reposan en instituciones o establecimientos públicos o privados que cuentan con procesos estandarizados de anonimización o seudonimización de la información de acuerdo con la Ley Orgánica de Protección de Datos Personales',
      'Revisiones de políticas públicas y reglamentación',
      'Investigaciones que utilizan fuentes secundarias de literatura científica',
      'Investigaciones que evalúen anónimamente el sabor y/o calidad de alimentos, o estudios de aceptación del consumidor',
      'Investigaciones que evalúen anónimamente programas públicos o prácticas educativas',
      'Investigaciones con recopilación de información de forma anónima, como cuestionarios, entrevistas anónimas, donde no se registren datos que permitan la identificación de los participantes (datos personales), datos sensibles, población vulnerable, ni se traten aspectos sensibles de su conducta',
      'Investigaciones que se realizan con datos de salud o muestras biológicas almacenados en servicios de salud de manera tal que no se pueda determinar la identidad de los titulares (revisión de historias clínicas cuyos datos de identificación fueron anonimizados, análisis de muestras biológicas humanas anónimas o anonimizadas). Siempre y cuando el establecimiento o institución pública o privada cuente con un proceso estandarizado de anonimización o seudonimización, conforme lo determina la Ley Orgánica de Protección de Datos Personales',
      'Investigaciones con recopilación de información identificativa de seres humanos',
      'Investigaciones con uso de muestras biológicas provenientes de seres humanos anonimizadas, almacenadas en colecciones o biobancos (bancos de tumores, bancos de dientes), y que cuentan con un consentimiento informado amplio para su almacenamiento y uso en futuras investigaciones',
      'Investigaciones con medicamentos de amplio margen terapéutico y registrados por la ARCSA, respetando las indicaciones, dosis y vías de administración establecidas en las agencias reguladoras de medicamentos internacionales. Se incluyen en este grupo a los Ensayos clínicos Fase IV',
      'Investigaciones que utilizan mediciones o procedimientos aprobados en la práctica habitual (clínicos, educativos, físicos, nutricionales, odontológicos o psicológicos)',
      'Investigaciones en las cuales se utilizan intervenciones probadas y eficaces',
      'Investigaciones que incluyen interrogar, observar y medir a los participantes en un área o materia que no sea un tema sensible (datos sensibles, sujetos vulnerables o en condición de vulnerabilidad), siempre que los procedimientos se lleven a cabo de una manera anonimizada',
      'Investigaciones que utilizan información privada (historia clínica), datos personales, datos sensibles, muestras biológicas humanas identificables (recolectadas o almacenadas en colecciones o biobancos) y/o población vulnerable',
      'Estudios de farmacología clínica Fases I a III, inclusive',
      'Ensayos clínicos con medicamentos, vacunas, dispositivos médicos, innovación quirúrgica, productos biológicos y productos naturales procesados de uso medicinal que estén sujetos a registro sanitario',
      'Estudios experimentales con nuevos dispositivos, nuevos métodos diagnósticos invasivos, preventivos, de rehabilitación o nuevos procedimientos quirúrgicos',
      'Estudios psicológicos que implican la manipulación de la conducta',
      'Estudios realizados por primera vez en seres humanos',
      'Estudios con fármacos con margen de seguridad estrecho',
      'Estudios con intervención social',
      'Uso de procedimientos invasivos (amniocentesis, punción lumbar, cateterismo, entre otros) por fuera de la indicación y frecuencia de la práctica estándar',
      'Estudios que requieran el abandono o retiro de la medicación habitual',
      'Investigaciones en situación de emergencias sanitarias',
    ],
  },
];

export function questionnaireQuestionById(id: string): QuestionnaireQuestion | undefined {
  return questionnaireQuestions.find((question) => question.id === id);
}

export function isQuestionnaireAnswerEmpty(answer: QuestionnaireAnswer | undefined): boolean {
  if (answer === undefined) return true;
  if (Array.isArray(answer)) return answer.length === 0;
  return answer.trim().length === 0;
}

export function hasOtherAnswer(answers: QuestionnaireAnswers, questionId: string): boolean {
  const value = answers[questionId];
  return Array.isArray(value) ? value.includes(OTHER_OPTION) : value === OTHER_OPTION;
}

export function formatQuestionnaireAnswer(
  question: QuestionnaireQuestion,
  answers: QuestionnaireAnswers,
): string {
  const value = answers[question.id];
  const base = Array.isArray(value) ? value.join(', ') : value ?? '';
  const other = answers[`${question.id}${OTHER_ANSWER_SUFFIX}`];
  if (!question.allowOther || !hasOtherAnswer(answers, question.id)) return base;
  const otherText = typeof other === 'string' && other.trim() ? other.trim() : 'Sin detalle';
  return base.replace(OTHER_OPTION, `Otras: ${otherText}`);
}
