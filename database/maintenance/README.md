# Limpieza operativa de la base de datos

`restore-demo-accounts.sql` restaura, sin eliminar datos operativos, las once cuentas demo: un administrador, siete miembros CEISH y tres investigadores. Todas usan la contraseña `demo123`.

`clean-to-ceish-members.sql` primero repone de forma idempotente esas once cuentas y después elimina todos los datos operativos. Los identifica por correo, no por UUID, para funcionar también con una base existente donde la migración haya creado UUIDs distintos:

- `miembro@ceish.edu`
- `miembro01@ceish.edu` a `miembro06@ceish.edu`

También se conservan los roles estructurales y las once cuentas demo. Se eliminan las demás cuentas, solicitudes de registro, investigaciones, asignaciones, evaluaciones, anexos y ciclos de calificación.

No modifica `database/schema.sql` ni las migraciones. La validación inicial cancela la operación si no existen los siete correos previstos.

## Ejecución

Para recuperar solo las cuentas demo en una base existente:

```bash
docker compose exec -T postgres psql \
  -v ON_ERROR_STOP=1 \
  -U "${DATABASE_USER:-ceish_user}" \
  -d "${DATABASE_NAME:-ceish_db}" \
  < database/maintenance/restore-demo-accounts.sql
```

Para ejecutar la limpieza completa:

Con PostgreSQL de Docker iniciado, desde la raíz del repositorio:

```bash
docker compose exec -T postgres psql \
  -v ON_ERROR_STOP=1 \
  -U "${DATABASE_USER:-ceish_user}" \
  -d "${DATABASE_NAME:-ceish_db}" \
  < database/maintenance/clean-to-ceish-members.sql
```

La operación es permanente. Genera un respaldo antes de ejecutarla en una base con datos que necesiten conservarse.

Los objetos ya almacenados en MinIO no se eliminan con este SQL; al no quedar referencias en PostgreSQL, deben borrarse por separado si también se requiere recuperar ese espacio.
