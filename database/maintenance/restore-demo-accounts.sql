-- Restaura las cuentas demo sin eliminar datos operativos existentes.
-- Todas las cuentas usan la contraseña: demo123
BEGIN;

INSERT INTO users (id, name, email, password, role_id)
SELECT accounts.id::uuid, accounts.name, accounts.email, accounts.password, roles.id
  FROM (VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Admin Demo', 'admin@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'admin'),
    ('b0000000-0000-0000-0000-000000000002', 'Miembro CEISH Demo', 'miembro@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'teacher'),
    ('b0000000-0000-0000-0000-000000000003', 'Miembro CEISH 01', 'miembro01@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'teacher'),
    ('b0000000-0000-0000-0000-000000000004', 'Miembro CEISH 02', 'miembro02@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'teacher'),
    ('b0000000-0000-0000-0000-000000000005', 'Miembro CEISH 03', 'miembro03@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'teacher'),
    ('b0000000-0000-0000-0000-000000000006', 'Miembro CEISH 04', 'miembro04@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'teacher'),
    ('b0000000-0000-0000-0000-000000000007', 'Miembro CEISH 05', 'miembro05@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'teacher'),
    ('b0000000-0000-0000-0000-000000000008', 'Miembro CEISH 06', 'miembro06@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'teacher'),
    ('c0000000-0000-0000-0000-000000000001', 'Juan Pérez', 'juan@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'student'),
    ('c0000000-0000-0000-0000-000000000002', 'María López', 'maria@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'student'),
    ('c0000000-0000-0000-0000-000000000003', 'Carlos Ruiz', 'carlos@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd', 'student')
  ) AS accounts(id, name, email, password, role_name)
  JOIN roles ON roles.name = accounts.role_name
ON CONFLICT (email) DO UPDATE
  SET name = EXCLUDED.name,
      password = EXCLUDED.password,
      role_id = EXCLUDED.role_id,
      auth_session_version = 0;

INSERT INTO researcher_profiles (user_id, researcher_type, affiliation)
SELECT users.id, 'internal', ''
  FROM users
 WHERE users.email IN ('juan@ceish.edu', 'maria@ceish.edu', 'carlos@ceish.edu')
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

SELECT roles.name AS rol, count(*) AS cuentas
  FROM users
  JOIN roles ON roles.id = users.role_id
 WHERE users.email IN (
   'admin@ceish.edu',
   'miembro@ceish.edu', 'miembro01@ceish.edu', 'miembro02@ceish.edu',
   'miembro03@ceish.edu', 'miembro04@ceish.edu', 'miembro05@ceish.edu',
   'miembro06@ceish.edu',
   'juan@ceish.edu', 'maria@ceish.edu', 'carlos@ceish.edu'
 )
 GROUP BY roles.name
 ORDER BY roles.name;
