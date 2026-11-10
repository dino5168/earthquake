"""Tests for image_to_cloud pure helpers (no torch needed)."""

from __future__ import annotations

import csv
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from image_to_cloud import Placement, otsu_threshold, to_geo, write_cloud  # noqa: E402


def test_otsu_separates_two_clusters() -> None:
    rng = np.random.default_rng(0)
    values = np.concatenate([rng.normal(1, 0.1, 500), rng.normal(5, 0.1, 500)])
    t = otsu_threshold(values)
    # Any threshold inside the gap is optimal; check it splits the clusters exactly
    assert np.sum(values > t) == 500
    assert np.all(values[values > t] > 3)


def test_to_geo_orientation_and_extent() -> None:
    # 4 rows x 2 cols; right column is closer (higher disparity)
    disparity = np.array([[0.0, 1.0]] * 4)
    mask = np.ones_like(disparity, dtype=bool)
    place = Placement(lon=121, lat=23.5, depth_km=150, height_km=100, relief_km=20)
    lon, lat, depth, idx = to_geo(disparity, mask, place)

    assert idx.tolist() == list(range(8))
    # Right pixels are east of left pixels
    assert lon[1] > lon[0]
    # Lower rows are deeper; vertical span stays within height_km around the centre
    assert depth[6] > depth[0]
    assert 100 <= depth.min() and depth.max() <= 200
    # Closer pixels are further south by the full relief
    assert (lat[0] - lat[1]) * 110.57 == pytest.approx(20)


def test_to_geo_flat_disparity_does_not_divide_by_zero() -> None:
    disparity = np.full((2, 2), 3.0)
    _, lat, _, _ = to_geo(disparity, np.ones((2, 2), dtype=bool), Placement())
    assert np.all(np.isfinite(lat))


def test_write_cloud(tmp_path: Path) -> None:
    out = tmp_path / "c.csv"
    write_cloud(
        out,
        np.array([121.0]),
        np.array([23.5]),
        np.array([150.0]),
        np.array([[10, 20, 30]], dtype=np.uint8),
    )
    rows = list(csv.reader(out.open(encoding="utf-8", newline="")))
    assert rows == [["x", "y", "z", "r", "g", "b"], ["121.00000", "23.50000", "-150.000", "10", "20", "30"]]
