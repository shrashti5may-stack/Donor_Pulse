-- DonorPulse Database Schema (PostgreSQL + PostGIS Extension)
-- Enable PostGIS for geospatial proximity queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enum Types
DO $$ BEGIN
    CREATE TYPE blood_group_enum AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('DONOR', 'PATIENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'FULFILLED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table (Registered Donors & Patients)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    blood_group blood_group_enum NOT NULL,
    role user_role_enum NOT NULL,
    -- PostGIS geography Point (Longitude, Latitude) in WGS 84 (SRID 4326)
    coordinates GEOMETRY(Point, 4326) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    last_donation_date TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for 25km radius proximity matching
CREATE INDEX IF NOT EXISTS idx_users_coordinates_gist ON users USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_users_matching ON users (role, is_available, blood_group);

-- 2. Donation Requests Table
CREATE TABLE IF NOT EXISTS donation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_group_needed blood_group_enum NOT NULL,
    units_needed INTEGER NOT NULL CHECK (units_needed >= 1),
    hospital_name VARCHAR(255) NOT NULL,
    hospital_address TEXT NOT NULL,
    coordinates GEOMETRY(Point, 4326) NOT NULL,
    prescription_document_url TEXT DEFAULT NULL,
    doctor_reg_number VARCHAR(100) DEFAULT NULL,
    status request_status_enum NOT NULL DEFAULT 'PENDING',
    accepted_donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    matched_donors_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Authenticity verification: must provide doctor reg number or prescription document URL
    CONSTRAINT chk_medical_proof CHECK (
        (prescription_document_url IS NOT NULL AND LENGTH(TRIM(prescription_document_url)) > 0) OR
        (doctor_reg_number IS NOT NULL AND LENGTH(TRIM(doctor_reg_number)) > 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_donation_requests_coordinates_gist ON donation_requests USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_active_patient_requests ON donation_requests (patient_id, status);

-- Example PostGIS Query for Step 3 Medical Compatibility & 25km Proximity:
-- SELECT id, name, phone, blood_group, ST_Distance(coordinates, ST_SetSRID(ST_MakePoint(:reqLng, :reqLat), 4326)::geography) / 1000 AS distance_km
-- FROM users
-- WHERE role = 'DONOR'
--   AND is_available = TRUE
--   AND blood_group = ANY(:compatibleGroups)
--   AND (last_donation_date IS NULL OR last_donation_date <= NOW() - INTERVAL '90 days')
--   AND ST_DWithin(coordinates::geography, ST_SetSRID(ST_MakePoint(:reqLng, :reqLat), 4326)::geography, 25000)
-- ORDER BY distance_km ASC;
