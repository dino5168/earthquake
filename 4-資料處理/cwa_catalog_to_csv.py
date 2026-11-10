"""Convert CWA earthquake catalog XML (E-A0073-001) to CSV.

Usage:
    uv run cwa_catalog_to_csv.py CWA-EQ-Catalog-1990.xml [more.xml ...] [-o CSV]
"""

from __future__ import annotations

import argparse
import csv
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

NS = "{urn:cwa:gov:tw:cwacommon:0.1}"

# XML tag -> CSV column. Units are baked into column names because the XML
# carries them as attributes (unit="公里" etc.) that would be lost in CSV.
COLUMNS: dict[str, str] = {
    "OriginTime": "origin_time",
    "EpicenterLongitude": "longitude",
    "EpicenterLatitude": "latitude",
    "FocalDepth": "depth_km",
    "LocalMagnitude": "magnitude_ml",
    "StationNumber": "station_count",
    "PhaseNumber": "phase_count",
    "MinimumEpicenterDistance": "min_epicenter_distance_km",
    "gap": "gap_deg",
    "rms": "rms_s",
    "erh": "erh_km",
    "erz": "erz_km",
    "Quality": "quality",
    "ReviewStatus": "review_status",
}


class CatalogError(ValueError):
    """Raised when the XML does not match the expected catalog layout."""


def parse_catalog(xml_path: Path) -> list[dict[str, str]]:
    """Parse one CWA catalog XML file into rows.

    Args:
        xml_path: Path to a ``CWA-EQ-Catalog-YYYY.xml`` file.

    Returns:
        One dict per ``EarthquakeInfo``, keyed by CSV column name. Optional
        fields absent in the XML (e.g. ``erz``) become empty strings.

    Raises:
        CatalogError: If ``RecordNumber`` disagrees with the parsed row count
            or an unknown field appears.
    """
    root = ET.parse(xml_path).getroot()
    rows: list[dict[str, str]] = []
    for info in root.iter(f"{NS}EarthquakeInfo"):
        row = dict.fromkeys(COLUMNS.values(), "")
        for child in info:
            tag = child.tag.removeprefix(NS)
            if tag not in COLUMNS:
                raise CatalogError(f"{xml_path.name}: unknown field <{tag}>")
            # Source pads some numbers with spaces (e.g. "<LocalMagnitude> 3.3")
            row[COLUMNS[tag]] = (child.text or "").strip()
        rows.append(row)

    record_number = root.findtext(f".//{NS}RecordNumber")
    if record_number is not None and int(record_number) != len(rows):
        raise CatalogError(
            f"{xml_path.name}: RecordNumber={record_number} but parsed {len(rows)}"
        )
    return rows


def write_csv(rows: list[dict[str, str]], csv_path: Path) -> None:
    """Write rows to a UTF-8 CSV file with a header line.

    Args:
        rows: Rows produced by :func:`parse_catalog`.
        csv_path: Destination file; parent directories are created.
    """
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(COLUMNS.values()))
        writer.writeheader()
        writer.writerows(rows)


def convert(xml_path: Path, out_dir: Path) -> tuple[Path, int]:
    """Convert one XML catalog into ``<out_dir>/<same stem>.csv``.

    Args:
        xml_path: Source XML file.
        out_dir: Output directory.

    Returns:
        The written CSV path and its row count.
    """
    rows = parse_catalog(xml_path)
    csv_path = out_dir / f"{xml_path.stem}.csv"
    write_csv(rows, csv_path)
    return csv_path, len(rows)


def main(argv: list[str] | None = None) -> int:
    """CLI entry point.

    Args:
        argv: Command-line arguments; defaults to ``sys.argv[1:]``.

    Returns:
        Process exit code (0 on success, 1 if any file failed).
    """
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("xml", nargs="+", type=Path, help="catalog XML file(s)")
    parser.add_argument(
        "-o", "--out-dir", type=Path, default=Path(__file__).parent / "CSV"
    )
    args = parser.parse_args(argv)

    failed = 0
    for xml_path in args.xml:
        try:
            csv_path, count = convert(xml_path, args.out_dir)
        except (OSError, ET.ParseError, CatalogError) as e:
            print(f"FAIL {xml_path}: {e}", file=sys.stderr)
            failed += 1
            continue
        print(f"OK   {xml_path.name} -> {csv_path} ({count} rows)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
