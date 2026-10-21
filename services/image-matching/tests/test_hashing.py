"""Unit tests for the actual ML logic, with no network or database
involved — every image here is generated in-memory, so these run in
milliseconds and never depend on Supabase being reachable.

Deliberately not using solid-color test images: pHash looks at
low-frequency *structure* after converting to greyscale, so a flat red
square and a flat blue square reduce to an almost identical "no
structure at all" hash regardless of hue — that would make a same-image
vs. different-image test pass for the wrong reason. Striped patterns give
each test image real, distinguishable frequency content.
"""

import io

from PIL import Image

from app.hashing import compute_phash, hamming_distance


def make_stripe_image_bytes(orientation: str, stripe_width: int = 8, size: tuple[int, int] = (64, 64)) -> bytes:
    image = Image.new("L", size, 0)
    pixels = image.load()
    for y in range(size[1]):
        for x in range(size[0]):
            position = y if orientation == "horizontal" else x
            pixels[x, y] = 255 if (position // stripe_width) % 2 == 0 else 0

    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="PNG")
    return buffer.getvalue()


def test_hashing_the_same_bytes_twice_gives_the_same_hash():
    image_bytes = make_stripe_image_bytes("horizontal")
    assert compute_phash(image_bytes) == compute_phash(image_bytes)


def test_same_image_resaved_as_jpeg_is_a_close_match():
    """The real-world case this service exists for: the same picture,
    recompressed differently (exactly what happens when a photo is
    re-uploaded to a different platform or re-saved before posting)."""
    image = Image.new("L", (64, 64), 0)
    pixels = image.load()
    for y in range(64):
        for x in range(64):
            pixels[x, y] = 255 if (y // 8) % 2 == 0 else 0

    png_buffer = io.BytesIO()
    image.convert("RGB").save(png_buffer, format="PNG")

    jpeg_buffer = io.BytesIO()
    image.convert("RGB").save(jpeg_buffer, format="JPEG", quality=70)

    distance = hamming_distance(compute_phash(png_buffer.getvalue()), compute_phash(jpeg_buffer.getvalue()))
    assert distance <= 10  # MATCH_THRESHOLD's default — see app/config.py


def make_block_pattern_bytes(seed: int, size: tuple[int, int] = (64, 64), block: int = 8) -> bytes:
    """A deterministic (not random — same seed always gives the same
    bytes), but visually irregular, grid of grey blocks. Two different
    seeds land far apart under pHash; the same seed always lands on
    itself. Used instead of a simple stripe/orientation flip, which turned
    out to confuse pHash's DCT symmetry (see the comment this replaced, in
    git history) — irregular block content doesn't have that problem.
    """
    image = Image.new("L", size, 0)
    pixels = image.load()
    for y in range(size[1]):
        for x in range(size[0]):
            block_x, block_y = x // block, y // block
            pixels[x, y] = (block_x * 37 + block_y * 59 + seed * 97) % 256

    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="PNG")
    return buffer.getvalue()


def test_structurally_different_images_are_not_a_match():
    image_a = make_block_pattern_bytes(seed=1)
    image_b = make_block_pattern_bytes(seed=2)

    distance = hamming_distance(compute_phash(image_a), compute_phash(image_b))
    assert distance > 10


def test_hamming_distance_is_symmetric():
    a = compute_phash(make_block_pattern_bytes(seed=1))
    b = compute_phash(make_block_pattern_bytes(seed=2))
    assert hamming_distance(a, b) == hamming_distance(b, a)
