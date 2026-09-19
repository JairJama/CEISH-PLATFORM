# Flujo de anexos durante la evaluación

## Fuente institucional verificada

Los documentos originales se revisaron desde el directorio institucional indicado en `AGENTS.md`. Su numeración y finalidad son:

| Anexo | Nombre del modelo institucional | Finalidad |
|---|---|---|
| 11 | Formato de Carta de exención | Comunicar que una investigación está exenta de evaluación por el CEISH-Uleam. |
| 12 | Check List de Evaluación de los proyectos de investigación | Registrar información general, resumen, investigadores y evaluación ética, metodológica y jurídica. |
| 13 | Formato para emisión de resoluciones | Comunicar la aprobación definitiva de estudios observacionales o de intervención. |
| 26 | Suspensión o revocatoria de aprobación | Suspender o revocar una investigación que ya tenía aprobación previa. |

Esta correspondencia debe respetarse al generar documentos. En particular, el modelo oficial del Anexo 13 no es una carta de anulación y el Anexo 11 no es la aprobación definitiva.

## Reglas confirmadas para el Anexo 12

- La evaluación se presenta como un checklist basado en las secciones y criterios del modelo oficial.
- Cada vez que el evaluador emite una decisión se genera una nueva instancia del Anexo 12.
- La instancia indica si existen observaciones y conserva el detalle de cada criterio y las observaciones generales.
- Una nueva evaluación después de recibir correcciones crea otro Anexo 12; nunca reemplaza el anterior.
- El historial debe incluir, como mínimo, número de ciclo, decisión, evaluador, fecha, datos del checklist y documento generado.
- El historial completo es visible para el evaluador actualmente asignado y para administradores.
- Todos los documentos generados deben ser descargables por esos dos roles.

## Ciclo de correcciones

1. El evaluador completa el checklist y emite un Anexo 12.
2. Si existen observaciones, se abre un plazo de 30 días para que el investigador entregue correcciones.
3. Si llegan correcciones dentro del plazo, el caso vuelve al evaluador y una nueva decisión genera otro Anexo 12.
4. El ciclo puede repetirse y todas las emisiones permanecen en el historial.
5. Después de una corrección, el evaluador puede solicitar nuevas correcciones, aprobar o cerrar el caso con observaciones.
6. Si no existen observaciones, se conserva un Anexo 12 sin observaciones y se emite el Anexo 13 de aprobación definitiva.

## Cierres y documentos emitidos

- Una aprobación genera dos registros independientes: el Anexo 12 sin observaciones y el Anexo 13 de aprobación definitiva.
- Un cierre decidido por el evaluador después de recibir correcciones genera el Anexo 12 con observaciones y cambia el caso a `cancelled`.
- El vencimiento del plazo de correcciones cambia el caso a `expired`.
- El cierre o el vencimiento previo a una aprobación no generan un número de anexo inventado. Se conserva la decisión y su Anexo 12 cuando corresponda.
- El Anexo 26 se reserva para suspender o revocar una investigación que ya fue aprobada. Ese flujo posterior a la aprobación todavía no está implementado.

## Relación con la estratificación

El Anexo 11 es una carta de exención. Al registrar una investigación se crea únicamente su borrador; se marca como emitido y se genera el DOCX cuando la estratificación concluye que la investigación es sin riesgo. No constituye la resolución definitiva de aprobación.
