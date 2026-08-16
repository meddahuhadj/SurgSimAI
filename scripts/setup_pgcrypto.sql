-- =============================================================================
-- scripts/setup_pgcrypto.sql — Configuration Chiffrement at-Rest & pgcrypto HDS
-- =============================================================================
-- Ce script configure l'extension pgcrypto sur PostgreSQL pour assurer la
-- conformité HDS (Hébergement de Données de Santé) et le chiffrement des
-- identifiants nominatifs des patients (nom, prénom, NIR).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Exemple de fonction utilitaire de chiffrement symétrique AES-256 avec clé HDS
CREATE OR REPLACE FUNCTION encrypt_phi(data text, secret_key text)
RETURNS bytea AS $$
BEGIN
    IF data IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN pgp_sym_encrypt(data, secret_key, 'cipher-algo=aes256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_phi(encrypted_data bytea, secret_key text)
RETURNS text AS $$
BEGIN
    IF encrypted_data IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN pgp_sym_decrypt(encrypted_data, secret_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION encrypt_phi IS 'Chiffrement AES-256 pgcrypto pour la conformité HDS.';
COMMENT ON FUNCTION decrypt_phi IS 'Déchiffrement AES-256 pgcrypto pour la conformité HDS.';
