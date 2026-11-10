"""Turn a single photo into a coloured 3D point cloud placed beneath Taiwan.

Pipeline: monocular depth (Depth Anything V2) → foreground mask (Otsu on
disparity) → georeference into EPSG:4326 lon/lat + depth km → CSV.

Output CSV columns: x (lon deg), y (lat deg), z (-depth km), r, g, b (0-255),
matching EQHistory.csv conventions so the viewer's geo transform aligns it.

Usage:
    uv run --no-project --with numpy --with pillow --with torch --with transformers \
        image_to_cloud.py <image> [--out CSV] [--preview PNG]
"""

from __future__ import annotations

import argparse
import csv
import math
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.typing import NDArray
from PIL import Image

HERE = Path(__file__).parent
DEFAULT_OUT = HERE.parent / "9-Project" / "viz" / "eq-3d" / "public" / "data" / "image-cloud.csv"
MODEL_ID = "depth-anything/Depth-Anything-V2-Small-hf"
KM_PER_DEG_LAT = 110.57


@dataclass(frozen=True)
class Placement:
    """Where and how large the cloud sits in the crust (EPSG:4326 anchor)."""

    lon: float = 121.0
    lat: float = 23.5
    depth_km: float = 150.0
    height_km: float = 150.0
    """Image height maps to this vertical (depth) extent."""
    relief_km: float = 30.0
    """Full disparity range of the foreground maps to this north-south thickness."""


def estimate_disparity(img: Image.Image) -> NDArray[np.float64]:
    """Run Depth Anything V2 and return disparity at the image's resolution.

    Imported lazily so the pure helpers stay testable without torch.

    Args:
        img: RGB image.

    Returns:
        ``(H, W)`` relative inverse depth; larger means closer to the camera.
    """
    import torch
    from transformers import pipeline

    pipe = pipeline("depth-estimation", model=MODEL_ID, device="cpu")
    pred = pipe(img)["predicted_depth"]
    if pred.dim() == 2:
        pred = pred[None]
    resized = torch.nn.functional.interpolate(
        pred[None], size=(img.height, img.width), mode="bicubic", align_corners=False
    )
    return resized[0, 0].detach().numpy().astype(np.float64)


def otsu_threshold(values: NDArray[np.float64], bins: int = 256) -> float:
    """Otsu's threshold maximising between-class variance.

    Args:
        values: Samples (any shape).
        bins: Histogram bins.

    Returns:
        Threshold value; samples above it form the brighter/closer class.
    """
    hist, edges = np.histogram(values.ravel(), bins=bins)
    centres = (edges[:-1] + edges[1:]) / 2
    w0 = np.cumsum(hist)
    w1 = w0[-1] - w0
    m0 = np.cumsum(hist * centres) / np.maximum(w0, 1)
    m1 = (np.sum(hist * centres) - np.cumsum(hist * centres)) / np.maximum(w1, 1)
    between = w0 * w1 * (m0 - m1) ** 2
    return float(centres[int(np.argmax(between))])


def to_geo(
    disparity: NDArray[np.float64], mask: NDArray[np.bool_], place: Placement
) -> tuple[NDArray[np.float64], NDArray[np.float64], NDArray[np.float64], NDArray[np.intp]]:
    """Georeference masked pixels.

    Image right → east, image down → deeper, closer (higher disparity) → south
    (the viewer's default camera looks north from the south).

    Args:
        disparity: ``(H, W)`` disparity map.
        mask: ``(H, W)`` foreground mask.
        place: Placement parameters.

    Returns:
        ``(lon, lat, depth_km, flat_index)`` for every masked pixel; lon/lat are
        EPSG:4326 degrees.
    """
    h, w = disparity.shape
    rows, cols = np.nonzero(mask)
    d = disparity[rows, cols]
    span = d.max() - d.min()
    dn = (d - d.min()) / span if span > 0 else np.zeros_like(d)

    width_km = place.height_km * w / h
    km_per_deg_lon = 111.32 * math.cos(math.radians(place.lat))
    lon = place.lon + ((cols + 0.5) / w - 0.5) * width_km / km_per_deg_lon
    depth = place.depth_km + ((rows + 0.5) / h - 0.5) * place.height_km
    lat = place.lat - (dn - 0.5) * place.relief_km / KM_PER_DEG_LAT
    return lon, lat, depth, rows * w + cols


def write_cloud(
    path: Path,
    lon: NDArray[np.float64],
    lat: NDArray[np.float64],
    depth: NDArray[np.float64],
    rgb: NDArray[np.uint8],
) -> None:
    """Write the point cloud CSV.

    Args:
        path: Destination file.
        lon: Longitudes (deg).
        lat: Latitudes (deg).
        depth: Depths (km, positive down).
        rgb: ``(N, 3)`` colours.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["x", "y", "z", "r", "g", "b"])
        for i in range(len(lon)):
            r, g, b = (int(c) for c in rgb[i])
            writer.writerow([f"{lon[i]:.5f}", f"{lat[i]:.5f}", f"{-depth[i]:.3f}", r, g, b])


def render_preview(
    path: Path,
    img: Image.Image,
    disparity: NDArray[np.float64],
    mask: NDArray[np.bool_],
) -> None:
    """Save a 3-panel sanity check: photo, disparity, and masked colour points.

    Args:
        path: Output PNG.
        img: Source RGB image.
        disparity: Disparity map.
        mask: Foreground mask.
    """
    dn = (disparity - disparity.min()) / max(np.ptp(disparity), 1e-9)
    depth_img = Image.fromarray((dn * 255).astype(np.uint8)).convert("RGB")
    cut = np.asarray(img).copy()
    cut[~mask] = 0
    panels = [img, depth_img, Image.fromarray(cut)]
    out = Image.new("RGB", (img.width * 3, img.height))
    for i, p in enumerate(panels):
        out.paste(p, (i * img.width, 0))
    out.save(path)


def main(argv: list[str] | None = None) -> int:
    """CLI entry point.

    Args:
        argv: Command-line arguments; defaults to ``sys.argv[1:]``.

    Returns:
        Process exit code.
    """
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("image", type=Path)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--preview", type=Path, default=None)
    args = parser.parse_args(argv)

    try:
        img = Image.open(args.image).convert("RGB")
    except OSError as e:
        print(f"FAIL: {e}", file=sys.stderr)
        return 1

    disparity = estimate_disparity(img)
    mask = disparity > otsu_threshold(disparity)
    lon, lat, depth, idx = to_geo(disparity, mask, Placement())
    rgb = np.asarray(img).reshape(-1, 3)[idx]
    write_cloud(args.out, lon, lat, depth, rgb)
    if args.preview:
        render_preview(args.preview, img, disparity, mask)
    print(
        f"OK   {args.out} ({len(lon)} points, {mask.mean():.0%} of pixels) "
        f"depth {depth.min():.0f}-{depth.max():.0f} km"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
