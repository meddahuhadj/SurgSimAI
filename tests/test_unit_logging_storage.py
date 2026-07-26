# -*- coding: utf-8 -*-
"""Tests unitaires isolés pour backend/logging_config.py et backend/storage_cleanup.py."""

import sys
import os
import json
import time
import logging
from pathlib import Path
from datetime import UTC, datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


class TestLoggingConfig:
    def test_json_formatter_produces_valid_json(self):
        from logging_config import JSONFormatter
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="test.py",
            lineno=1, msg="hello %s", args=("world",), exc_info=None,
        )
        output = formatter.format(record)
        parsed = json.loads(output)
        assert parsed["level"] == "INFO"
        assert parsed["message"] == "hello world"
        assert parsed["logger"] == "test"
        assert "timestamp" in parsed

    def test_correlation_id_included_when_set(self):
        from logging_config import JSONFormatter, correlation_id_var
        token = correlation_id_var.set("abc12345")
        try:
            formatter = JSONFormatter()
            record = logging.LogRecord(
                name="test", level=logging.INFO, pathname="test.py",
                lineno=1, msg="msg", args=(), exc_info=None,
            )
            output = formatter.format(record)
            parsed = json.loads(output)
            assert parsed["correlation_id"] == "abc12345"
        finally:
            correlation_id_var.reset(token)

    def test_correlation_id_absent_by_default(self):
        from logging_config import JSONFormatter, correlation_id_var
        token = correlation_id_var.set(None)
        try:
            formatter = JSONFormatter()
            record = logging.LogRecord(
                name="test", level=logging.INFO, pathname="test.py",
                lineno=1, msg="msg", args=(), exc_info=None,
            )
            output = formatter.format(record)
            parsed = json.loads(output)
            assert "correlation_id" not in parsed
        finally:
            correlation_id_var.reset(token)

    def test_generate_correlation_id_length(self):
        from logging_config import generate_correlation_id
        cid = generate_correlation_id()
        assert len(cid) == 8
        assert all(c in "0123456789abcdef" for c in cid)

    def test_get_logger_returns_standard_logger(self):
        from logging_config import get_logger
        logger = get_logger("test.module")
        assert isinstance(logger, logging.Logger)
        assert logger.name == "test.module"

    def test_exception_included_when_present(self):
        from logging_config import JSONFormatter
        try:
            raise ValueError("boom")
        except ValueError:
            import sys
            exc_info = sys.exc_info()
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="test", level=logging.ERROR, pathname="test.py",
            lineno=1, msg="error occurred", args=(), exc_info=exc_info,
        )
        output = formatter.format(record)
        parsed = json.loads(output)
        assert "exception" in parsed
        assert "ValueError" in parsed["exception"]


class TestStorageCleanup:
    def test_get_storage_usage_empty_dir(self, tmp_path):
        import storage_cleanup
        original = storage_cleanup.DICOM_STORAGE_DIR
        try:
            storage_cleanup.DICOM_STORAGE_DIR = tmp_path / "empty"
            usage = storage_cleanup.get_storage_usage()
            assert usage["total_bytes"] == 0
            assert usage["total_files"] == 0
            assert usage["total_dirs"] == 0
        finally:
            storage_cleanup.DICOM_STORAGE_DIR = original

    def test_get_storage_usage_counts_files(self, tmp_path):
        import storage_cleanup
        original = storage_cleanup.DICOM_STORAGE_DIR
        try:
            d = tmp_path / "dicom"
            d.mkdir()
            series = d / "series1"
            series.mkdir()
            (series / "file1.dcm").write_bytes(b"\x00" * 1000)
            (series / "file2.dcm").write_bytes(b"\x00" * 500)
            storage_cleanup.DICOM_STORAGE_DIR = d
            usage = storage_cleanup.get_storage_usage()
            assert usage["total_files"] == 2
            assert usage["total_bytes"] == 1500
            assert usage["total_dirs"] == 1
        finally:
            storage_cleanup.DICOM_STORAGE_DIR = original

    def test_cleanup_expired_removes_old_dirs(self, tmp_path):
        import storage_cleanup
        original = storage_cleanup.DICOM_STORAGE_DIR
        original_ttl = storage_cleanup.TTL_SECONDS
        try:
            d = tmp_path / "dicom"
            d.mkdir()
            old_series = d / "old"
            old_series.mkdir()
            (old_series / "file.dcm").write_bytes(b"\x00" * 100)
            import os
            os.utime(old_series, (time.time() - 200000, time.time() - 200000))
            storage_cleanup.DICOM_STORAGE_DIR = d
            storage_cleanup.TTL_SECONDS = 100000
            removed, freed = storage_cleanup.cleanup_expired()
            assert removed == 1
            assert freed == 100
            assert not old_series.exists()
        finally:
            storage_cleanup.DICOM_STORAGE_DIR = original
            storage_cleanup.TTL_SECONDS = original_ttl

    def test_cleanup_expired_keeps_recent_dirs(self, tmp_path):
        import storage_cleanup
        original = storage_cleanup.DICOM_STORAGE_DIR
        try:
            d = tmp_path / "dicom"
            d.mkdir()
            recent = d / "recent"
            recent.mkdir()
            (recent / "file.dcm").write_bytes(b"\x00" * 100)
            storage_cleanup.DICOM_STORAGE_DIR = d
            removed, freed = storage_cleanup.cleanup_expired()
            assert removed == 0
            assert freed == 0
            assert recent.exists()
        finally:
            storage_cleanup.DICOM_STORAGE_DIR = original

    def test_run_cleanup_returns_all_keys(self, tmp_path):
        import storage_cleanup
        original = storage_cleanup.DICOM_STORAGE_DIR
        try:
            d = tmp_path / "dicom"
            d.mkdir()
            storage_cleanup.DICOM_STORAGE_DIR = d
            result = storage_cleanup.run_cleanup()
            assert "expired_removed" in result
            assert "quota_removed" in result
            assert "remaining_bytes" in result
            assert "remaining_dirs" in result
        finally:
            storage_cleanup.DICOM_STORAGE_DIR = original
