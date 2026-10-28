-- ============================================================
-- VetCare - Esquema de base de datos (PostgreSQL)
-- ============================================================
-- Uso:
--   psql -U postgres -d vetcare_db -f database/schema.sql
--
-- El script es idempotente regarding tablas: si las tablas ya
-- existen, las elimina y las vuelve a crear (DROP ... CASCADE).
-- ============================================================


-- ------------------------------------------------------------
-- 0. Función auxiliar: mantener updated_at siempre actualizado
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS set_updated_at();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------
-- 1. users  (administradores y recepcionistas)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS veterinarians CASCADE;
DROP TABLE IF EXISTS owners CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(30) NOT NULL DEFAULT 'admin',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
    CONSTRAINT users_role_check   CHECK (role IN ('admin', 'receptionist'))
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- 2. owners  (propietarios / tutores)
-- ------------------------------------------------------------
CREATE TABLE owners (
    id              SERIAL PRIMARY KEY,
    first_name      VARCHAR(80)  NOT NULL,
    last_name       VARCHAR(80)  NOT NULL,
    document_number VARCHAR(30) UNIQUE,
    phone           VARCHAR(30)  NOT NULL,
    email           VARCHAR(150),
    address         VARCHAR(200),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT owners_email_lowercase CHECK (email IS NULL OR email = lower(email))
);

CREATE TRIGGER trg_owners_updated_at
    BEFORE UPDATE ON owners
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_owners_last_name ON owners (last_name);


-- ------------------------------------------------------------
-- 3. veterinarians
-- ------------------------------------------------------------
CREATE TABLE veterinarians (
    id             SERIAL PRIMARY KEY,
    first_name     VARCHAR(80)  NOT NULL,
    last_name      VARCHAR(80)  NOT NULL,
    license_number VARCHAR(50)  UNIQUE NOT NULL,
    specialty      VARCHAR(100),
    phone          VARCHAR(30),
    email          VARCHAR(150) UNIQUE,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vets_email_lowercase CHECK (email IS NULL OR email = lower(email))
);

CREATE TRIGGER trg_veterinarians_updated_at
    BEFORE UPDATE ON veterinarians
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_vets_active ON veterinarians (is_active);


-- ------------------------------------------------------------
-- 4. services
-- ------------------------------------------------------------
CREATE TABLE services (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(100) UNIQUE NOT NULL,
    description      TEXT,
    price            NUMERIC(12,2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT services_price_check      CHECK (price >= 0),
    CONSTRAINT services_duration_check   CHECK (duration_minutes > 0)
);

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_services_active ON services (is_active);


-- ------------------------------------------------------------
-- 5. pets
-- ------------------------------------------------------------
CREATE TABLE pets (
    id         SERIAL PRIMARY KEY,
    owner_id   INTEGER NOT NULL,
    name       VARCHAR(80) NOT NULL,
    species    VARCHAR(50) NOT NULL,
    breed      VARCHAR(80),
    sex        VARCHAR(10),
    birth_date DATE,
    weight     NUMERIC(6,2),
    color      VARCHAR(50),
    notes      TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pets_owner_id_fk    FOREIGN KEY (owner_id) REFERENCES owners (id) ON DELETE RESTRICT,
    CONSTRAINT pets_sex_check       CHECK (sex IS NULL OR sex IN ('male', 'female')),
    CONSTRAINT pets_weight_check    CHECK (weight IS NULL OR weight > 0)
);

CREATE TRIGGER trg_pets_updated_at
    BEFORE UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_pets_owner_id ON pets (owner_id);
CREATE INDEX idx_pets_name     ON pets (name);


-- ------------------------------------------------------------
-- 6. appointments
-- ------------------------------------------------------------
CREATE TABLE appointments (
    id               SERIAL PRIMARY KEY,
    pet_id           INTEGER NOT NULL,
    veterinarian_id INTEGER NOT NULL,
    service_id       INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status           VARCHAR(30) NOT NULL DEFAULT 'scheduled',
    reason           TEXT,
    notes            TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT appointments_pet_fk           FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE,
    CONSTRAINT appointments_veterinarian_fk  FOREIGN KEY (veterinarian_id) REFERENCES veterinarians (id) ON DELETE RESTRICT,
    CONSTRAINT appointments_service_fk       FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT,
    CONSTRAINT appointments_status_check      CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'))
);

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_appointments_pet_id           ON appointments (pet_id);
CREATE INDEX idx_appointments_veterinarian_id  ON appointments (veterinarian_id);
CREATE INDEX idx_appointments_date             ON appointments (appointment_date);
CREATE INDEX idx_appointments_status           ON appointments (status);

-- Regla de negocio 7: un veterinario no puede tener dos citas
-- activas en la misma fecha y hora.
CREATE UNIQUE INDEX uq_appointments_vet_slot
    ON appointments (veterinarian_id, appointment_date, appointment_time)
    WHERE status <> 'cancelled';


-- ------------------------------------------------------------
-- 7. medical_records
-- ------------------------------------------------------------
CREATE TABLE medical_records (
    id                SERIAL PRIMARY KEY,
    pet_id            INTEGER NOT NULL,
    veterinarian_id   INTEGER NOT NULL,
    appointment_id    INTEGER,
    consultation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    symptoms          TEXT,
    diagnosis         TEXT,
    treatment         TEXT,
    observations       TEXT,
    weight            NUMERIC(6,2),
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medical_records_pet_fk          FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE,
    CONSTRAINT medical_records_vet_fk          FOREIGN KEY (veterinarian_id) REFERENCES veterinarians (id) ON DELETE RESTRICT,
    CONSTRAINT medical_records_appointment_fk  FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL,
    CONSTRAINT medical_records_weight_check    CHECK (weight IS NULL OR weight > 0)
);

CREATE TRIGGER trg_medical_records_updated_at
    BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_medical_records_pet_id ON medical_records (pet_id);
CREATE INDEX idx_medical_records_date    ON medical_records (consultation_date DESC);