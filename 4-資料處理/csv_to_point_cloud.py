"""Merge yearly CWA catalog CSVs into a single point-cloud CSV.

Output columns: x (longitude, deg), y (latitude, deg), z (-depth, km),
origin_time, magnitude_ml. Sorted by origin_time.

Usage:
    uv run csv_to_point_cloud.py [-i CSV] [-o EQHistory.CSV]
"""

from __future__ import annotations

import argparse
import csv
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

HERE = Path(__file__).parent
FIELDS = ["x", "y", "z", "origin_time", "magnitude_ml"]


def to_z(depth_km: str) -> str:
    """Convert a depth string to an upward-positive z value.

    Args:
        depth_km: Focal depth in km, e.g. ``"18.7"``.

    Returns:
        Negated depth as a string preserving source precision, e.g. ``"-18.7"``.
        Zero depth yields ``"0.0"`` rather than ``"-0.0"``.

    Raises:
        ValueError: If ``depth_km`` is not a number.
    """
    try:
        z = -Decimal(depth_km)
    except InvalidOperation as e:
        raise ValueError(f"invalid depth: {depth_km!r}") from e
    # Decimal keeps the sign of zero; "-0.0" confuses some point-cloud readers
    return str(z.copy_abs() if z.is_zero() else z)


def to_point(row: dict[str, str]) -> dict[str, str]:
    """Map one catalog CSV row to a point-cloud row.

    Args:
        row: A row from ``CWA-EQ-Catalog-YYYY.csv``.

    Returns:
        A dict keyed by :data:`FIELDS`.
    """
    return {
        "x": row["longitude"],
        "y": row["latitude"],
        "z": to_z(row["depth_km"]),
        "origin_time": row["origin_time"],
        "magnitude_ml": row["magnitude_ml"],
    }


def build_point_cloud(csv_dir: Path) -> list[dict[str, str]]:
    """Read every catalog CSV in a directory into sorted point rows.

    Args:
        csv_dir: Directory containing ``CWA-EQ-Catalog-*.csv``.

    Returns:
        Point rows sorted by origin_time.

    Raises:
        FileNotFoundError: If no catalog CSV exists in ``csv_dir``.
    """
    files = sorted(csv_dir.glob("CWA-EQ-Catalog-*.csv"))
    if not files:
        raise FileNotFoundError(f"no CWA-EQ-Catalog-*.csv in {csv_dir}")
    points: list[dict[str, str]] = []
    for path in files:
        with path.open(encoding="utf-8", newline="") as f:
            points.extend(to_point(row) for row in csv.DictReader(f))
    # All timestamps share the +08:00 offset, so ISO strings sort chronologically
    points.sort(key=lambda p: p["origin_time"])
    return points


def write_points(points: list[dict[str, str]], out_path: Path) -> None:
    """Write point rows to a UTF-8 CSV with header.

    Args:
        points: Rows from :func:`build_point_cloud`.
        out_path: Destination CSV path.
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(points)


def main(argv: list[str] | None = None) -> int:
    """CLI entry point.

    Args:
        argv: Command-line arguments; defaults to ``sys.argv[1:]``.

    Returns:
        Process exit code.
    """
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("-i", "--in-dir", type=Path, default=HERE / "CSV")
    parser.add_argument("-o", "--out", type=Path, default=HERE / "EQHistory.CSV")
    args = parser.parse_args(argv)
    try:
        points = build_point_cloud(args.in_dir)
        write_points(points, args.out)
    except (OSError, KeyError, ValueError) as e:
        print(f"FAIL: {e}", file=sys.stderr)
        return 1
    print(f"OK   {args.out} ({len(points)} points)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
