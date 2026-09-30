# Guía breve del sistema visual

La interfaz prioriza lectura de expedientes, decisiones trazables y acciones claras. Las vistas de investigador, evaluador y administrador comparten los mismos tokens y patrones; el rol cambia las acciones disponibles, no el lenguaje visual.

## Fundamentos

| Uso | Token o criterio |
| --- | --- |
| Acción principal / navegación activa | `--c-primary` (`#0B6B63`), hover `--c-primary-hover` |
| Fondo de trabajo | `--c-bg` (`#F1F5F9`) |
| Tarjeta o formulario | `--c-surface` (`#FFFFFF`); superficies suaves `--c-surface-2` |
| Texto principal / secundario | `--c-text` / `--c-text-2` |
| Texto auxiliar | `--c-text-muted`; no usar como texto normal de bajo contraste |
| Éxito, alerta y error | `--c-success-*`, badges warning, `--c-danger-*` |
| Ritmo de espaciado | `--space-1` a `--space-8`: 4, 8, 12, 16, 24 y 32 px |
| Bordes | `--r-sm` a `--r-xl`; controles compactos y tarjetas con radio consistente |
| Tipografía | Inter si está disponible; sistema del dispositivo como alternativa |

Usa `frontend/src/index.css` para tokens globales y `frontend/src/shared/components/common/colors.ts` para valores utilizados por componentes React. Evita introducir colores hexadecimales nuevos en una vista cuando exista un token semántico equivalente.

## Jerarquía y componentes

- **Página:** título de 20 px, subtítulo breve, encabezado separado del área de trabajo y cuerpo con espacio constante.
- **Tarjetas:** superficie blanca, borde suave y radio `--r-lg`/`--r-xl`. Reserva la elevación para formularios o tareas en primer plano.
- **Acciones:** un botón principal por grupo de acciones; usa variantes outline/danger para acciones secundarias o destructivas. Las etiquetas describen el resultado, por ejemplo “Aprobar solicitud”.
- **Campos:** etiqueta persistente, requerido explícito, foco visible y error junto al campo. Conserva el texto ingresado cuando la validación falle.
- **Badges:** representan estado actual con palabra además del color. No expresan permisos ni son el único indicador de una decisión.
- **Tablas y listas:** alinear la misma información de igual forma, conservar encabezados y presentar una alternativa desplazable en pantallas pequeñas.
- **Modales:** título que explica la decisión, contexto suficiente, botón de cancelar y foco perceptible. Las acciones irreversibles se identifican claramente.

## Estados de interfaz

Cada pantalla con datos debe resolver estos estados:

1. **Carga:** mostrar un indicador y un mensaje corto, conservar el espacio del contenido cuando sea posible y deshabilitar solo la acción que está procesando.
2. **Vacío:** explicar qué falta y, si corresponde, cómo iniciar el flujo. Evitar mostrar una tabla vacía sin contexto.
3. **Error:** explicar qué ocurrió en lenguaje directo y ofrecer una acción para reintentar cuando sea seguro. Mantener el error con `role="alert"`.
4. **Éxito:** confirmar la acción con `role="status"` y actualizar el elemento en pantalla.
5. **Deshabilitado:** conservar legibilidad y comunicar por qué una acción no está disponible cuando la causa no resulte obvia.

## Accesibilidad y responsive

- El foco de teclado usa `:focus-visible`; no lo elimines sin ofrecer una alternativa clara.
- Los botones deben tener texto o nombre accesible. No dependas solo de iconos, color ni posición.
- Mantén `prefers-reduced-motion`; las transiciones no deben ser necesarias para entender el estado.
- Soporta desde 320 px. A menos de 760 px, el menú lateral pasa a una fila desplazable; encabezados, paneles y acciones deben caber sin recortar el contenido.
- Conserva contraste legible, etiquetas asociadas a sus campos y mensajes de error anunciables por lector de pantalla.

## Revisión por rol

Antes de cerrar un cambio visual, recorrer `/estudiante`, `/evaluador/estratificacion`, `/evaluador/calificacion`, `/evaluador/revision/:submissionId`, `/admin`, `/admin/asignaciones` y `/admin/solicitudes`. Revisar en cada flujo la carga, vacío, error y éxito que aplique; revisar también navegación por teclado y ancho móvil. Las modificaciones de estilo no deben alterar contratos de API ni lógica de negocio.
