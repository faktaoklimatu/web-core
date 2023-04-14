#!/bin/bash

# Validate command line arguments
if [ ! $# -eq 2 ]
then
    echo "Error: Incorrect number of parameters (exactly 2 parameters required)."
    echo "Usage: "$0" <source/publication.svg> <destination/publication.svg>"
    exit 1
fi

source utils/convert-svg.sh

# Exit when any command fails
set -e

WIDTH=1200

# Set up file names
SRC_FILE_SVG=$1
DST_FILE_SVG=$2

# Create destination folders if necessary
mkdir -p $(dirname $DST_FILE_SVG)

# Convert SVG into PNG of desired $WIDTH.
echo -e `basename $SRC_FILE_SVG`": converting to PNG ($WIDTH px)..."
convert_svg_to_png "$SRC_FILE_SVG" "$DST_FILE_SVG" $WIDTH

# If all previous conversions pass, copy the file checked by Make
echo `basename $SRC_FILE_SVG`": copying to $DST_FILE_SVG..."
cp "$SRC_FILE_SVG" "$DST_FILE_SVG"

echo `basename $SRC_FILE_SVG`": All done."
