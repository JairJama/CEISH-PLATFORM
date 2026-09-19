# Flujo de anexos durante la evaluación

## Fuente institucional verificada

Los documentos originales se revisaron desde el directorio institucional indicado en `AGENTS.md`. Su numeración y finalidad son:

| Anexo | Nombre del modelo institucional | Finalidad |
|---|---|---|
| 11 | Resolución de aprobación | Comunicar la aprobación de la investigación. |
| 12 | Check List de Evaluación de los proyectos de investigación | Registrar información general, resumen, investigadores y evaluación ética, metodológica y jurídica. |
| 13 | Resolución de cierre | Comunicar que la investigación no fue aprobada y el caso queda cerrado. |
| 26 | Suspensión o revocatoria de aprobación | Suspender o revocar una investigación que ya tenía aprobación previa. |

La regla funcional confirmada para esta plataforma es: el Anexo 11 se emite al aprobar y el Anexo 13 al negar o cerrar el caso.

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
6. Si no existen observaciones, se conserva un Anexo 12 sin observaciones y se emite el Anexo 11 de aprobación.

## Cierres y documentos emitidos

- Una aprobación genera dos registros independientes: el Anexo 12 sin observaciones y el Anexo 11 de aprobación.
- Un cierre decidido por el evaluador después de recibir correcciones genera el Anexo 12 con observaciones, el Anexo 13 de cierre y cambia el caso a `cancelled`.
- El vencimiento del plazo de correcciones cambia el caso a `expired`.
- El cierre o el vencimiento previo a una aprobación no generan un número de anexo inventado. Se conserva la decisión y su Anexo 12 cuando corresponda.
- El Anexo 26 se reserva para suspender o revocar una investigación que ya fue aprobada. Ese flujo posterior a la aprobación todavía no está implementado.

## Relación con la estratificación

Al registrar una investigación se crea un borrador del Anexo 11 con los datos disponibles. La estratificación sin riesgo no lo emite: se completa y genera únicamente cuando el evaluador aprueba la investigación durante la calificación.
