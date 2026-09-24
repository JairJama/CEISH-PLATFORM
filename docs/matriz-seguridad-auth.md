# Matriz reproducible de autenticación y autorización

Esta matriz cubre las rutas de acceso, el rol actual y la relación del usuario con los recursos. Ejecuta las llamadas contra el NestJS levantado con una base de prueba; usa cuentas y datos seed o registros desechables. No uses datos reales de investigación.

## Preparación

1. Inicia PostgreSQL, MinIO, NestJS y el frontend siguiendo el README.
2. Usa una ventana privada por rol para no mezclar cookies. Las contraseñas demo están documentadas en `database/seed.sql` y el README.
3. Ejecuta las acciones desde las vistas correspondientes o con un cliente HTTP que conserve cookies. La cookie `ceish_session` es HttpOnly; no copies su valor al frontend.
4. Comprueba el código HTTP, el mensaje y que ninguna respuesta incluya datos de otro rol/usuario.

## Casos reproducibles

| Caso | Preparación y acción | Resultado esperado |
| --- | --- | --- |
| Login correcto | Credenciales válidas de investigador, evaluador o admin | `200`, cookie HttpOnly y usuario/rol normalizados |
| Login incorrecto | Correo inexistente o contraseña incorrecta | `401`; no se emite una nueva cookie |
| Solicitud pendiente/rechazada | Registrar correo sin aprobación y probar login antes/después de rechazar | Acceso denegado con mensaje de estado; no se crea sesión |
| Registro inválido | Enviar nombre/correo/contraseña vacíos, email inválido, contraseña corta, tipo desconocido, afiliación externa vacía o campo extra | `400`; ninguna solicitud nueva |
| Registro duplicado | Reenviar el mismo correo | `409`; una sola solicitud permanece |
| Restaurar/caducar sesión | Usar la app con sesión activa y esperar 8 horas o presentar una cookie firmada caducada | `/api/auth/session` devuelve `401`; rutas protegidas también deniegan |
| Cerrar sesión | Conservar una copia de prueba de la cookie, usar “Cerrar sesión” e intentar `/api/auth/session` desde el mismo navegador y con la copia anterior | La cookie queda eliminada; el navegador y cualquier copia anterior reciben `401` |
| Ruta sin sesión | Abrir `/api/users` y `/api/submissions` sin cookie | `401`; sin datos |
| Acceso por rol | Como investigador intentar revisar una solicitud; como evaluador intentar aprobar/rechazarla | `403`; el estado no cambia |
| Listado de perfiles | Consultar usuarios como admin, evaluador e investigador | Admin obtiene el listado autorizado; evaluador solo sus estudiantes asignados; investigador no obtiene el directorio |
| Perfil ajeno | Como investigador solicitar `/api/users/{id-de-otro}` | `403`; su propio perfil responde `200` |
| Asignación | Como admin asignar miembro CEISH e investigador válidos; repetir el par o usar IDs con roles equivocados | Creación válida; repetición idempotente; combinación inválida `400` |
| Entrega ajena | Como investigador intentar consultar/subir/cambiar la entrega de otra persona; como evaluador usar una entrega no asignada | `403`; el contenido no se filtra ni se modifica |
| Archivo ajeno | Solicitar URL de documento, corrección o anexo fuera de la propia asignación | `403` (o `404` para ID inexistente); nunca una URL firmada |
| Aprobación repetida | Revisar una solicitud como admin y volver a enviar la misma decisión | La segunda transición responde `409`; no crea otra cuenta/perfil |

## Automatización incluida

`backend/src/common/auth/session.util.spec.ts` verifica firma y atributos de cookie, rechazo de firmas manipuladas/caducadas/roles desconocidos, hashing scrypt y secreto de producción. `backend/src/common/guards/auth.guard.spec.ts` confirma que se usa el rol actual de la BD y que logout revoca una cookie anterior. Ejecuta `cd backend && npm test -- --runInBand`. Los casos de recursos y permisos requieren la matriz de arriba porque dependen de filas y asignaciones de base de datos.
