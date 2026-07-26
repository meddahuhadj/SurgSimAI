# -*- coding: utf-8 -*-
"""Tests unitaires isolés pour backend/security.py (JWT, bcrypt, 2FA TOTP)."""

import sys
import os
import hashlib
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import security


class TestPasswordHashing:
    def test_hash_and_verify(self):
        hashed = security.hash_password("s3cretP@ss")
        assert hashed != "s3cretP@ss"
        assert security.verify_password("s3cretP@ss", hashed) is True

    def test_wrong_password_fails(self):
        hashed = security.hash_password("correct")
        assert security.verify_password("wrong", hashed) is False

    def test_different_hashes_for_same_password(self):
        h1 = security.hash_password("same_password")
        h2 = security.hash_password("same_password")
        assert h1 != h2
        assert security.verify_password("same_password", h1) is True
        assert security.verify_password("same_password", h2) is True


class TestJWT:
    def test_create_and_decode_token(self):
        token = security.create_token("dr.hadj", scope="full")
        decoded = security.decode_token(token)
        assert decoded["sub"] == "dr.hadj"
        assert decoded["scope"] == "full"
        assert "exp" in decoded

    def test_pre_auth_token_has_correct_scope(self):
        token = security.create_pre_auth_token("dr.benali")
        decoded = security.decode_token(token)
        assert decoded["sub"] == "dr.benali"
        assert decoded["scope"] == "2fa_pending"

    def test_decode_with_invalid_token_raises(self):
        import pytest
        from jose import JWTError
        with pytest.raises(JWTError):
            security.decode_token("not-a-real-token")

    def test_extra_payload_included(self):
        token = security.create_token("user1", extra={"role": "admin"})
        decoded = security.decode_token(token)
        assert decoded["role"] == "admin"


class TestTOTP:
    def test_generate_secret_is_base32(self):
        secret = security.generate_totp_secret()
        assert len(secret) == 32
        import base64
        base64.b32decode(secret)

    def test_totp_uri_contains_username(self):
        uri = security.totp_uri("dr.hadj", security.generate_totp_secret())
        assert "dr.hadj" in uri
        assert "otpauth" in uri

    def test_verify_totp_valid_code(self):
        secret = security.generate_totp_secret()
        import pyotp
        code = pyotp.TOTP(secret).now()
        assert security.verify_totp(secret, code) is True

    def test_verify_totp_invalid_code(self):
        secret = security.generate_totp_secret()
        assert security.verify_totp(secret, "000000") is False

    def test_verify_totp_empty_returns_false(self):
        assert security.verify_totp("", "") is False
        assert security.verify_totp("SECRET", "") is False

    def test_totp_qr_png_is_base64(self):
        uri = security.totp_uri("test", security.generate_totp_secret())
        qr = security.totp_qr_png_base64(uri)
        import base64
        decoded = base64.b64decode(qr)
        assert decoded[:4] == b'\x89PNG'


class TestRecoveryCodes:
    def test_generate_default_8_codes(self):
        codes = security.generate_recovery_codes()
        assert len(codes) == 8
        assert all(len(c) == 8 for c in codes)

    def test_generate_custom_count(self):
        codes = security.generate_recovery_codes(3)
        assert len(codes) == 3

    def test_hash_and_verify_recovery_code(self):
        codes = security.generate_recovery_codes(4)
        hashed = [security.hash_recovery_code(c) for c in codes]
        assert security.verify_recovery_code(hashed, codes[0]) is True
        assert security.verify_recovery_code(hashed, "invalid") is False

    def test_recovery_code_case_insensitive(self):
        code = "AbC12345"
        h1 = security.hash_recovery_code(code)
        h2 = security.hash_recovery_code(code.upper())
        assert h1 == h2

    def test_verify_empty_list_returns_false(self):
        assert security.verify_recovery_code([], "code") is False
        assert security.verify_recovery_code(None, "code") is False

    def test_hash_is_deterministic(self):
        h1 = security.hash_recovery_code("test123")
        h2 = hashlib.sha256("test123".strip().lower().encode()).hexdigest()
        assert h1 == h2
