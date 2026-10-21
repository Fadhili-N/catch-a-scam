"""Perceptual image hashing — the actual ML/CV piece of this service.

A perceptual hash is a fingerprint of what an image LOOKS like, not of its
exact bytes: resize a photo, re-save it as a different quality JPEG, or
screenshot it again, and a cryptographic hash (md5, sha256...) changes
completely — but a perceptual hash barely moves. That is exactly the
property needed here: a scammer who rebrands under a new handle usually
reuses the same stolen product photo, but rarely re-uploads the identical
file byte-for-byte (TikTok/Instagram recompress everything anyway).

pHash works by shrinking the image to a small fixed size, converting to
greyscale, running a DCT (discrete cosine transform — the same frequency
technique JPEG compression itself uses) to keep only the low-frequency
("big shapes") part of the image, and recording which of those frequency
components are above or below the average as a string of bits. Two images
that look alike end up with mostly the same bits.

Comparing two hashes is then just a Hamming distance: count how many bits
differ. A handful of differing bits is normal recompression noise; a large
number means genuinely different images.
"""

import io

from PIL import Image
from imagehash import ImageHash, hex_to_hash, phash


def compute_phash(image_bytes: bytes) -> str:
    """Returns the perceptual hash of an image as a hex string, suitable
    for storing in evidence.perceptual_hash and passing to hamming_distance."""
    with Image.open(io.BytesIO(image_bytes)) as image:
        # imagehash.phash defaults to an 8x8 hash (64 bits) — enough
        # resolution to distinguish unrelated product photos while still
        # tolerating resizing, recompression, and minor crops.
        image_hash: ImageHash = phash(image)
    return str(image_hash)


def hamming_distance(hash_a: str, hash_b: str) -> int:
    """Number of differing bits between two hex-encoded perceptual hashes.
    Lower means more visually similar; 0 means pixel-pattern-identical
    after the hash's own downsampling."""
    # ImageHash's subtraction operator returns a numpy.int64 (its array
    # comparison is built on numpy internally), not a plain Python int.
    # Found by actually running this end to end, not by reading the type
    # hint: it crashed both FastAPI's JSON response encoding ("Object of
    # type int64 is not JSON serializable") and risked doing the same to
    # the database write in db.py, since neither necessarily knows how to
    # serialize a numpy scalar. The explicit int(...) is what the -> int
    # annotation above was already promising and not actually providing.
    return int(hex_to_hash(hash_a) - hex_to_hash(hash_b))
