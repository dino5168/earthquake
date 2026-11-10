"""Tests for csv_to_point_cloud."""

from __future__ import annotations

import csv
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from csv_to_point_cloud import FIELDS, build_point_cloud, main, to_z  # noqa: E402

HEADER = "origin_time,longitude,latitude,depth_km,magnitude_ml,quality\n"


def _make_dir(tmp_path: Path) -> Path:
    d = tmp_path / "CSV"
    d.mkdir()
    # 1991 file written first but contains the earlier event in the 1990 file,
    # so the test also proves rows are sorted by time, not by file order.
    (d / "CWA-EQ-Catalog-1991.csv").write_text(
        HEADER + "1991-03-01T00:00:00+08:00,120.5,23.0,0.0,4.1,B\n", encoding="utf-8"
    )
    (d / "CWA-EQ-Catalog-1990.csv").write_text(
        HEADER
        + "1990-05-01T00:00:00+08:00,121.812,24.317,18.7,3.3,C\n"
        + "1990-01-01T21:47:59+08:00,120.980,23.786,2.0,3.4,A\n",
        encoding="utf-8",
    )
    return d


@pytest.mark.parametrize(
    ("depth", "expected"),
    [("18.7", "-18.7"), ("2.0", "-2.0"), ("0.0", "0.0"), ("313.2", "-313.2")],
)
def test_to_z(depth: str, expected: str) -> None:
    assert to_z(depth) == expected


def test_to_z_rejects_garbage() -> None:
    with pytest.raises(ValueError):
        to_z("abc")


def test_build_point_cloud_sorted_and_mapped(tmp_path: Path) -> None:
    points = build_point_cloud(_make_dir(tmp_path))
    assert [p["origin_time"][:10] for p in points] == [
        "1990-01-01",
        "1990-05-01",
        "1991-03-01",
    ]
    assert points[0] == {
        "x": "120.980",
        "y": "23.786",
        "z": "-2.0",
        "origin_time": "1990-01-01T21:47:59+08:00",
        "magnitude_ml": "3.4",
    }


def test_empty_dir_raises(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        build_point_cloud(tmp_path)


def test_main_writes_file(tmp_path: Path) -> None:
    out = tmp_path / "EQHistory.CSV"
    assert main(["-i", str(_make_dir(tmp_path)), "-o", str(out)]) == 0
    with out.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        assert reader.fieldnames == FIELDS
        assert len(list(reader)) == 3
