"""Tests for build_terrain (offline; network fetch is not exercised)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from build_terrain import (  # noqa: E402
    GridSpec,
    bilinear,
    decode_terrarium,
    lat_to_px,
    lon_to_px,
    write_grid,
)


def test_grid_spec_size() -> None:
    spec = GridSpec()
    assert (spec.width, spec.height) == (601, 701)


def test_mercator_known_tile() -> None:
    # Tile 6/53/27 was verified manually to cover Taiwan
    assert int(lon_to_px(121.0, 6) // 256) == 53
    assert int(lat_to_px(24.0, 6) // 256) == 27
    assert float(lat_to_px(0.0, 0)) == pytest.approx(128.0)


def test_decode_terrarium() -> None:
    rgb = np.array([[[128, 0, 0], [127, 255, 0], [128, 100, 128]]], dtype=np.uint8)
    np.testing.assert_allclose(decode_terrarium(rgb), [[0.0, -1.0, 100.5]])


def test_bilinear_centres_and_midpoint() -> None:
    m = np.array([[0.0, 10.0], [20.0, 30.0]])
    # Pixel centres are at 0.5 / 1.5
    out = bilinear(m, np.array([0.5, 1.0, 1.5]), np.array([0.5, 1.5]))
    np.testing.assert_allclose(out, [[0, 5, 10], [20, 25, 30]])


def test_write_grid(tmp_path: Path) -> None:
    spec = GridSpec(west=0, east=0.02, south=0, north=0.01, step=0.01)
    grid = np.array([[1, 2, 3], [-4, -5, -6]], dtype=np.int16)
    write_grid(grid, spec, tmp_path)
    raw = np.frombuffer((tmp_path / "terrain.bin").read_bytes(), dtype="<i2")
    assert raw.tolist() == [1, 2, 3, -4, -5, -6]
    meta = json.loads((tmp_path / "terrain.json").read_text(encoding="utf-8"))
    assert (meta["width"], meta["height"], meta["min"], meta["max"]) == (3, 2, -6, 3)
