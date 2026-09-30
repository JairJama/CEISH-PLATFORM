-- Cuentas demo adicionales para probar la selección aleatoria y el consenso.
-- La contraseña de todas es: demo123
INSERT INTO users (id, name, email, password, role_id)
SELECT members.id::uuid, members.name, members.email, members.password, roles.id
  FROM (VALUES
    ('b0000000-0000-0000-0000-000000000003', 'Miembro CEISH 01', 'miembro01@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd'),
    ('b0000000-0000-0000-0000-000000000004', 'Miembro CEISH 02', 'miembro02@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd'),
    ('b0000000-0000-0000-0000-000000000005', 'Miembro CEISH 03', 'miembro03@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd'),
    ('b0000000-0000-0000-0000-000000000006', 'Miembro CEISH 04', 'miembro04@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd'),
    ('b0000000-0000-0000-0000-000000000007', 'Miembro CEISH 05', 'miembro05@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd'),
    ('b0000000-0000-0000-0000-000000000008', 'Miembro CEISH 06', 'miembro06@ceish.edu', 'scrypt$ceish-demo-salt$004b4334e2bed3392d1bde96cc8e586ce71017f4d2e41f6881ebd61330157250233389a55c5a3d120e024b589df757924ae011001fe61d34b1f46259a9db27cd')
  ) AS members(id, name, email, password)
  CROSS JOIN roles
 WHERE roles.name = 'teacher'
ON CONFLICT (id) DO NOTHING;
