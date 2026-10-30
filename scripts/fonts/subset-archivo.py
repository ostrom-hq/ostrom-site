# SPDX-License-Identifier: Apache-2.0
# Usage: python3 scripts/fonts/subset-archivo.py <full Archivo variable woff2> src/fonts/archivo-latin.woff2
# Rebuilds the display and text font of the site (fontTools 4.57). It keeps only what the pages use, because the font
# is on the path of the largest paint: weights 400 to 800, widths 100 % to 125 % (tokens.css), and the Latin
# characters of the texts (English, plus the French of the legal pages). The test src/fonts/fonts.test.ts checks that
# every character of the texts is in the font.
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

source, target = sys.argv[1], sys.argv[2]
font = instancer.instantiateVariableFont(TTFont(source), {"wght": (400, 800), "wdth": (100, 125)})
options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["kern", "liga", "calt", "tnum", "lnum", "case"]
options.name_IDs = ["*"]
unicodes = list(range(0x20, 0x7F)) + [
    0xA0, 0xA9, 0xAB, 0xB7, 0xBB, 0xC0, 0xC9, 0xD7, 0xE0, 0xE2, 0xE7, 0xE8, 0xE9, 0xEA, 0xEB, 0xEE, 0xEF, 0xF4,
    0xF9, 0xFB, 0xFC, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x20AC, 0x2122, 0x2191,
    0x2193, 0x2212,
]
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=unicodes)
subsetter.subset(font)
font.flavor = "woff2"
font.save(target)
