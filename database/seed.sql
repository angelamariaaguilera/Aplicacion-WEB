-- ============================================================
-- VetCare - Datos de demostración (PostgreSQL)
-- ============================================================
-- Uso:
--   psql -U postgres -d vetcare_db -f database/seed.sql
--
-- Ejecutar DESPUÉS de database/schema.sql
--
-- Credenciales demo:
--   admin@vetcare.com      / admin123    (admin)
--   recepcion@vetcare.com  / recepcion123 (receptionist)
--
-- Los password_hash son bcrypt. Para generar uno nuevo:
--   cd backend && source venv/bin/activate
--   python -c "from passlib.context import CryptContext; \
--     print(CryptContext(schemes=['bcrypt']).hash('mi_clave'))"
-- ============================================================


-- ------------------------------------------------------------
-- 1. Usuarios
-- ------------------------------------------------------------
INSERT INTO users (id, full_name, email, password_hash, role, is_active) VALUES
    (1, 'Administrador VetCare', 'admin@vetcare.com',
     '$2b$12$v46XvuOl0n2UQxEKUr4JfOSEVPuucXsycY.Hu6/a.9yx97HwXZywa', 'admin', TRUE),
    (2, 'Recepción VetCare', 'recepcion@vetcare.com',
     '$2b$12$nKbprcZ1SCG5VY.0dZfiiOtheTazxVAW4v2qNP8wp1VrufMQz3kb2', 'receptionist', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users', 'id'),
              (SELECT MAX(id) FROM users));


-- ------------------------------------------------------------
-- 2. Propietarios (3)
-- ------------------------------------------------------------
INSERT INTO owners (id, first_name, last_name, document_number, phone, email, address) VALUES
    (1, 'Carlos',   'Ramírez',  '1001234567', '+57 310 555 1122', 'carlos.ramirez@email.com',  'Calle 45 # 12-30, Bogotá'),
    (2, 'Ana',      'Ochoa',    '1007654321', '+57 320 555 3344', 'ana.ochoa@email.com',        'Avenida 8 # 100-22, Medellín'),
    (3, 'Javier',   'Salazar',  '9014567890', '+57 301 555 5566', 'javier.salazar@email.com',    'Carrera 15 # 90-14, Cali')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('owners', 'id'),
              (SELECT MAX(id) FROM owners));


-- ------------------------------------------------------------
-- 3. Veterinarios (2)
-- ------------------------------------------------------------
INSERT INTO veterinarians (id, first_name, last_name, license_number, specialty, phone, email, is_active) VALUES
    (1, 'Laura',   'Gómez',   'VET-10245', 'Medicina general',   '+57 315 444 7788', 'laura.gomez@vetcare.com',  TRUE),
    (2, 'Andrés',  'Cifuentes','VET-20871', 'Cirugía y dermatología', '+57 316 888 9900', 'andres.cifuentes@vetcare.com', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('veterinarians', 'id'),
              (SELECT MAX(id) FROM veterinarians));


-- ------------------------------------------------------------
-- 4. Servicios (5)
-- ------------------------------------------------------------
INSERT INTO services (id, name, description, price, duration_minutes, is_active) VALUES
    (1, 'Consulta general',  'Evaluación clínica completa de la mascota.',            50000.00, 30, TRUE),
    (2, 'Vacunación',        'Aplicación de vacunas según el calendario.',          65000.00, 20, TRUE),
    (3, 'Desparasitación',   'Tratamiento antiparasitario interno y externo.',       45000.00, 20, TRUE),
    (4, 'Control médico',    'Seguimiento de paciente en tratamiento.',              55000.00, 30, TRUE),
    (5, 'Curación',          'Limpieza y curación de heridas oazoo.',               85000.00, 40, TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('services', 'id'),
              (SELECT MAX(id) FROM services));


-- ------------------------------------------------------------
-- 5. Mascotas (4)
-- ------------------------------------------------------------
INSERT INTO pets (id, owner_id, name, species, breed, sex, birth_date, weight, color, notes) VALUES
    (1, 1, 'Mango',   'Perro',  'Golden Retriever', 'male',   '2021-03-15', 32.50, 'Dorado',   'Alergia estacional leve.'),
    (2, 1, 'Luna',    'Gato',   'Siamés',           'female', '2023-07-02',  4.20, 'Crema',    NULL),
    (3, 2, 'Simón',   'Perro',  'French Bulldog',   'male',   '2022-11-20', 12.80, 'Blanco',   'Problemas respiratorios leves.'),
    (4, 3, 'Nina',    'Gato',   'Doméstico',        'female', '2024-01-09',  3.60, 'Atigrado', NULL)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('pets', 'id'),
              (SELECT MAX(id) FROM pets));


-- ------------------------------------------------------------
-- 6. Citas
--    Fechas relativas a CURRENT_DATE para que el demo siempre
--    tenga citas "hoy" y "próximas".
-- ------------------------------------------------------------
INSERT INTO appointments (id, pet_id, veterinarian_id, service_id, appointment_date, appointment_time, status, reason, notes) VALUES
    (1, 1, 1, 1, CURRENT_DATE,                        '09:00', 'completed', 'Control de rutina anual',      NULL),
    (2, 2, 1, 2, CURRENT_DATE,                        '11:30', 'completed', 'Vacuna anual',                 'Vacuna triple aplicada.'),
    (3, 3, 2, 1, CURRENT_DATE,                        '15:00', 'confirmed', 'Dificultad para respirar',     'Traer radiografía previa.'),
    (4, 4, 1, 3, CURRENT_DATE + INTERVAL '1 day',     '10:00', 'scheduled', 'Desparasitación rutinaria',    NULL),
    (5, 1, 2, 5, CURRENT_DATE + INTERVAL '2 days',    '14:00', 'scheduled', 'Curación de herida en la pata', 'Vendaje previo.'),
    (6, 3, 1, 4, CURRENT_DATE + INTERVAL '3 days',    '09:30', 'scheduled', 'Control post-operatorio',      NULL),
    (7, 2, 2, 1, CURRENT_DATE + INTERVAL '5 days',    '16:00', 'cancelled', 'Chequeo general',              'El propietario reprogramó.'),
    (8, 4, 1, 2, CURRENT_DATE + INTERVAL '7 days',    '08:30', 'scheduled', 'Refuerzo de vacuna',           NULL),
    (9, 1, 1, 1, CURRENT_DATE - INTERVAL '14 days',   '10:30', 'completed', 'Consulta de seguimiento',      'Peso estable.')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('appointments', 'id'),
              (SELECT MAX(id) FROM appointments));


-- ------------------------------------------------------------
-- 7. Historias clínicas
-- ------------------------------------------------------------
INSERT INTO medical_records (id, pet_id, veterinarian_id, appointment_id, consultation_date, symptoms, diagnosis, treatment, observations, weight) VALUES
    (1, 1, 1, 1, CURRENT_DATE - INTERVAL '14 days',
     'Sin síntomas relevantes. Peso estable.',
     'ControlPreventivo',
     'Desparasitación interna y profilaxis antipulgas.',
     'Se recomienda repetir control en 6 meses.',
     32.50),

    (2, 1, 1, 9, CURRENT_DATE - INTERVAL '14 days' + INTERVAL '1 hour',
     'Picazón occasional en orejas.',
     'Otitis externa leve',
     'Limpieza de oídos y drops(Unas 10 gotas, 1 vez al día por 7 días).',
     'Sin signos de infección grave.',
     32.10),

    (3, 2, 1, 2, CURRENT_DATE,
     'Sin síntomas. Historia de vacunación al día.',
     'Rutina',
     'Vacuna triple y antirrábica aplicadas.',
     'Próxima dosis en 12 meses.',
     4.20),

    (4, 3, 2, 3, CURRENT_DATE,
     'Tos húmeda y dificultad respiratoria leve.',
     'Síndrome respiratorio superior',
     'Antitusivo y observação durante 5 días.',
     'Control en dos semanas. Considerar radiografía de tórax.',
     12.80),

    (5, 4, 1, NULL, CURRENT_DATE - INTERVAL '3 days',
     'Escarabajeo constante en el oído derecho.',
     'Otitis por ácaros',
     'Limpieza y tratamiento tópico.',
     'Mascota tolera bien el manejo.',
     3.60)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('medical_records', 'id'),
              (SELECT MAX(id) FROM medical_records));