"""Tests for cwa_catalog_to_csv."""

from __future__ import annotations

import csv
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cwa_catalog_to_csv import COLUMNS, CatalogError, convert, parse_catalog  # noqa: E402

SAMPLE = """<?xml version="1.0" encoding="UTF-8" ?>
<cwaopendata xmlns="urn:cwa:gov:tw:cwacommon:0.1">
  <Dataset><Catalog>
    <CatalogInfo><RecordNumber>{n}</RecordNumber></CatalogInfo>
    <EarthquakeInfo>
      <OriginTime>1990-01-01T21:47:59+08:00</OriginTime>
      <EpicenterLongitude>121.812</EpicenterLongitude>
      <EpicenterLatitude>24.317</EpicenterLatitude>
      <FocalDepth>2.0</FocalDepth>
      <LocalMagnitude> 3.3</LocalMagnitude>
      <StationNumber> 16</StationNumber>
      <PhaseNumber>15</PhaseNumber>
      <MinimumEpicenterDistance>33.00</MinimumEpicenterDistance>
      <gap unit="度">200</gap>
      <rms unit="秒">0.23</rms>
      <erh unit="公里">1.2</erh>
      <erz unit="公里">3.4</erz>
      <Quality>C</Quality>
      <ReviewStatus>N</ReviewStatus>
    </EarthquakeInfo>
    <EarthquakeInfo>
      <OriginTime>1990-01-02T06:58:12+08:00</OriginTime>
      <EpicenterLongitude>120.980</EpicenterLongitude>
      <EpicenterLatitude>23.786</EpicenterLatitude>
      <FocalDepth>18.7</FocalDepth>
      <LocalMagnitude>3.4</LocalMagnitude>
      <StationNumber>15</StationNumber>
      <PhaseNumber>14</PhaseNumber>
      <gap unit="度">90</gap>
      <Quality>B</Quality>
      <ReviewStatus>N</ReviewStatus>
    </EarthquakeInfo>
  </Catalog></Dataset>
</cwaopendata>
"""


def _write(tmp_path: Path, n: int = 2) -> Path:
    path = tmp_path / "CWA-EQ-Catalog-1990.xml"
    path.write_text(SAMPLE.format(n=n), encoding="utf-8")
    return path


def test_parse_strips_whitespace(tmp_path: Path) -> None:
    rows = parse_catalog(_write(tmp_path))
    assert rows[0]["magnitude_ml"] == "3.3"
    assert rows[0]["station_count"] == "16"
    assert rows[0]["origin_time"] == "1990-01-01T21:47:59+08:00"


def test_missing_optional_fields_are_empty(tmp_path: Path) -> None:
    row = parse_catalog(_write(tmp_path))[1]
    assert row["min_epicenter_distance_km"] == ""
    assert row["rms_s"] == "" and row["erh_km"] == "" and row["erz_km"] == ""
    assert row["gap_deg"] == "90"


def test_record_number_mismatch_raises(tmp_path: Path) -> None:
    with pytest.raises(CatalogError, match="RecordNumber"):
        parse_catalog(_write(tmp_path, n=3))


def test_unknown_field_raises(tmp_path: Path) -> None:
    path = _write(tmp_path)
    path.write_text(
        path.read_text(encoding="utf-8").replace("<Quality>C", "<Foo>1</Foo><Quality>C"),
        encoding="utf-8",
    )
    with pytest.raises(CatalogError, match="Foo"):
        parse_catalog(path)


def test_convert_writes_csv(tmp_path: Path) -> None:
    out_dir = tmp_path / "CSV"
    csv_path, count = convert(_write(tmp_path), out_dir)
    assert csv_path == out_dir / "CWA-EQ-Catalog-1990.csv"
    assert count == 2
    with csv_path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        assert reader.fieldnames == list(COLUMNS.values())
        rows = list(reader)
    assert rows[1]["quality"] == "B"
