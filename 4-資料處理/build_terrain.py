"""Build a lon/lat elevation grid (land + bathymetry) for the 3D viewer.

Downloads AWS Open Data Terrain Tiles (Terrarium PNG, EPSG:3857), stitches
them, and resamples onto a regular EPSG:4326 grid.

Output (little-endian Int16, row-major, north row first, metres):
    9-Project/viz/eq-3d/public/data/<prefix>terrain.bin + <prefix>terrain.json

Usage:
    uv run --no-project --with numpy --with pillow build_terrain.py                  # Taiwan
    uv run --no-project --with numpy --with pillow build_terrain.py --region globe   # world
"""

from __future__ import annotations

import argparse
import io
import json
import math
import sys
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
from numpy.typing import NDArray
from PIL import Image

HERE = Path(__file__).parent
TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
TILE_SIZE = 256
# Web Mercator (EPSG:3857) is undefined at the poles; tiles stop at this latitude
MAX_MERC_LAT = 85.0511


@dataclass(frozen=True)
class GridSpec:
    """Regular EPSG:4326 grid; nodes include both edges."""

    west: float = 118.0
    east: float = 124.0
    south: float = 20.0
    north: float = 27.0
    step: float = 0.01

    @property
    def width(self) -> int:
        """Number of columns (west → east)."""
        return round((self.east - self.west) / self.step) + 1

    @property
    def height(self) -> int:
        """Number of rows (north → south)."""
        return round((self.north - self.south) / self.step) + 1


@dataclass(frozen=True)
class Region:
    """A grid plus the zoom level and output file prefix used to build it."""

    spec: GridSpec
    zoom: int
    prefix: str


REGIONS: dict[str, Region] = {
    "taiwan": Region(GridSpec(), zoom=7, prefix=""),
    # 0.25° ≈ 28 km at the equator: enough for a globe texture, 1441x721 Int16 ≈ 2 MB
    "globe": Region(GridSpec(-180.0, 180.0, -90.0, 90.0, 0.25), zoom=3, prefix="globe-"),
}


def lon_to_px(lon: NDArray[np.float64] | float, zoom: int) -> NDArray[np.float64]:
    """Convert longitude (EPSG:4326) to global Web Mercator pixel x (EPSG:3857).

    Args:
        lon: Longitude in degrees.
        zoom: Tile zoom level.

    Returns:
        Global pixel x coordinate (pixel edges at integers).
    """
    return np.asarray((np.asarray(lon) + 180.0) / 360.0 * TILE_SIZE * 2**zoom)


def lat_to_px(lat: NDArray[np.float64] | float, zoom: int) -> NDArray[np.float64]:
    """Convert latitude (EPSG:4326) to global Web Mercator pixel y (EPSG:3857).

    Args:
        lat: Latitude in degrees.
        zoom: Tile zoom level.

    Returns:
        Global pixel y coordinate, increasing southward.
    """
    rad = np.radians(np.asarray(lat))
    merc = np.log(np.tan(rad) + 1.0 / np.cos(rad))
    return np.asarray((1.0 - merc / math.pi) / 2.0 * TILE_SIZE * 2**zoom)


def decode_terrarium(rgb: NDArray[np.uint8]) -> NDArray[np.float64]:
    """Decode a Terrarium RGB tile to elevation in metres.

    Args:
        rgb: ``(H, W, 3)`` uint8 array.

    Returns:
        ``(H, W)`` elevation array.
    """
    a = rgb.astype(np.float64)
    return a[..., 0] * 256.0 + a[..., 1] + a[..., 2] / 256.0 - 32768.0


def fetch_tile(z: int, x: int, y: int, cache_dir: Path) -> NDArray[np.float64]:
    """Return one decoded tile, downloading it into ``cache_dir`` if needed.

    Args:
        z: Zoom level.
        x: Tile column.
        y: Tile row.
        cache_dir: Directory holding cached PNG tiles.

    Returns:
        ``(256, 256)`` elevation array in metres.

    Raises:
        urllib.error.URLError: On network failure.
    """
    path = cache_dir / f"{z}_{x}_{y}.png"
    if not path.exists():
        cache_dir.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(
            TILE_URL.format(z=z, x=x, y=y), headers={"User-Agent": "eq-3d-builder"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            path.write_bytes(resp.read())
    with Image.open(io.BytesIO(path.read_bytes())) as img:
        return decode_terrarium(np.asarray(img.convert("RGB")))


def bilinear(
    mosaic: NDArray[np.float64], px: NDArray[np.float64], py: NDArray[np.float64]
) -> NDArray[np.float64]:
    """Sample a mosaic on a separable grid of pixel coordinates.

    Mercator x depends only on lon and y only on lat, so a lon/lat grid maps to
    a separable pixel grid and 1-D index vectors are enough.

    Args:
        mosaic: ``(H, W)`` source array.
        px: Column coordinates (pixel edges at integers), length W'.
        py: Row coordinates, length H'.

    Returns:
        ``(H', W')`` sampled array.
    """
    # Pixel i covers [i, i+1); its centre is i + 0.5
    cx = np.clip(px - 0.5, 0, mosaic.shape[1] - 1)
    cy = np.clip(py - 0.5, 0, mosaic.shape[0] - 1)
    x0 = np.minimum(np.floor(cx).astype(int), mosaic.shape[1] - 2)
    y0 = np.minimum(np.floor(cy).astype(int), mosaic.shape[0] - 2)
    fx = (cx - x0)[None, :]
    fy = (cy - y0)[:, None]
    top = mosaic[np.ix_(y0, x0)] * (1 - fx) + mosaic[np.ix_(y0, x0 + 1)] * fx
    bot = mosaic[np.ix_(y0 + 1, x0)] * (1 - fx) + mosaic[np.ix_(y0 + 1, x0 + 1)] * fx
    return np.asarray(top * (1 - fy) + bot * fy)


def build_grid(spec: GridSpec, zoom: int, cache_dir: Path) -> NDArray[np.int16]:
    """Download, stitch and resample tiles onto ``spec``.

    Args:
        spec: Target EPSG:4326 grid.
        zoom: Terrarium zoom level.
        cache_dir: Tile cache directory.

    Returns:
        ``(spec.height, spec.width)`` Int16 elevations, north row first.
    """
    lons = np.linspace(spec.west, spec.east, spec.width)
    lats = np.linspace(spec.north, spec.south, spec.height)
    # Polar rows repeat the last Mercator row; lon 180 would index one tile past the world edge
    world_px = TILE_SIZE * 2**zoom
    px = np.minimum(lon_to_px(lons, zoom), world_px - 1e-6)
    py = lat_to_px(np.clip(lats, -MAX_MERC_LAT, MAX_MERC_LAT), zoom)
    tx0, tx1 = int(px.min() // TILE_SIZE), int(px.max() // TILE_SIZE)
    ty0, ty1 = int(py.min() // TILE_SIZE), int(py.max() // TILE_SIZE)

    mosaic = np.vstack(
        [
            np.hstack([fetch_tile(zoom, tx, ty, cache_dir) for tx in range(tx0, tx1 + 1)])
            for ty in range(ty0, ty1 + 1)
        ]
    )
    grid = bilinear(mosaic, px - tx0 * TILE_SIZE, py - ty0 * TILE_SIZE)
    return np.round(grid).astype(np.int16)


def write_grid(grid: NDArray[np.int16], spec: GridSpec, out_dir: Path, prefix: str = "") -> None:
    """Write ``<prefix>terrain.bin`` and ``<prefix>terrain.json`` metadata.

    Args:
        grid: Elevation grid from :func:`build_grid`.
        spec: Grid specification.
        out_dir: Output directory.
        prefix: File name prefix, e.g. ``"globe-"``.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / f"{prefix}terrain.bin").write_bytes(grid.astype("<i2").tobytes())
    meta = {
        **asdict(spec),
        "width": spec.width,
        "height": spec.height,
        "crs": "EPSG:4326",
        "unit": "m",
        "order": "row-major, north row first",
        "min": int(grid.min()),
        "max": int(grid.max()),
        "source": "AWS Open Data Terrain Tiles (Terrarium); SRTM, GMTED, ETOPO1 et al.",
    }
    (out_dir / f"{prefix}terrain.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    """CLI entry point.

    Args:
        argv: Command-line arguments; defaults to ``sys.argv[1:]``.

    Returns:
        Process exit code.
    """
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--region", choices=sorted(REGIONS), default="taiwan")
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=HERE.parent / "9-Project" / "viz" / "eq-3d" / "public" / "data",
    )
    parser.add_argument("--cache-dir", type=Path, default=HERE / ".cache" / "terrarium")
    args = parser.parse_args(argv)

    region = REGIONS[args.region]
    spec = region.spec
    try:
        grid = build_grid(spec, region.zoom, args.cache_dir)
    except (urllib.error.URLError, OSError) as e:
        print(f"FAIL: {e}", file=sys.stderr)
        return 1
    write_grid(grid, spec, args.out_dir, region.prefix)
    print(f"OK   {args.out_dir / (region.prefix + 'terrain.bin')} {spec.width}x{spec.height} "
          f"elev {grid.min()}..{grid.max()} m")
    return 0


if __name__ == "__main__":
    sys.exit(main())
