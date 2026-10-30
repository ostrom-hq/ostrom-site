# SPDX-License-Identifier: Apache-2.0
# Usage: python3 scripts/fonts/subset-azeret.py <full Azeret Mono variable woff2> src/fonts/azeret-mono-latin.woff2
# Rebuilds the monospace font of the site (fontTools 4.57): weights 400 to 700 and the ASCII range with the usual
# punctuation, 27 kB down to 11 kB. A character outside it (a box-drawing line in a CLI output) falls back to the
# system monospace font, glyph by glyph.
import io
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

source, target = sys.argv[1], sys.argv[2]
# The instancer needs the uncompressed font: go through an in-memory TTF.
original = TTFont(source)
original.flavor = None
raw = io.BytesIO()
original.save(raw)
raw.seek(0)
instance = io.BytesIO()
instancer.instantiateVariableFont(TTFont(raw), {"wght": (400, 700)}).save(instance)
instance.seek(0)
font = TTFont(instance)
options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["kern", "liga", "calt", "tnum", "zero"]
options.name_IDs = ["*"]
unicodes = list(range(0x20, 0x7F)) + [
    0xA0, 0xA9, 0xB7, 0xD7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x2191, 0x2193, 0x2212,
]
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=unicodes)
subsetter.subset(font)
font.flavor = "woff2"
font.save(target)
