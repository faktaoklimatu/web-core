#!/bin/bash

# Validate command line arguments
if [ ! $# -eq 2 ]
then
    echo "Error: Incorrect number of parameters (exactly 2 parameters required)."
    echo "Usage: "$0" <source/infographic.pdf> <destination/infographic.pdf>"
    exit 1
fi

# ImageMagick install instructions
image_magick_install_instructions() {
    echo "On Ubuntu, install ImageMagick using the commands below."
    echo "  sudo apt update"
    echo "  sudo apt install imagemagick"
}

# Check for convert availability
if ! (which convert >/dev/null 2>&1)
then
    echo "Error: ImageMagick not installed."
    image_magick_install_instructions
    exit 2
fi

# Exit when any command fails
set -e

# Widths (in px) of covers we want to generate in PNG
WIDTHS=(600 1150)

# Set up file names
SRC_FILE_JPG=$1
DST_FILE_JPG=$2

# Create destination folder if necessary
mkdir -p $(dirname $DST_FILE_PDF)

resize_jpg() {
    input_jpg=$1
    width=$2
    convert \
        "$input_jpg" \
        -resize ${width}x
        "${input_jpg%.jpg}_$width.jpg" \
        >/dev/null 2>&1
}

# Resize cover into JPGs of various sizes.
for width in ${WIDTHS[@]}; do
    echo -e `basename $DST_FILE_JPG`": converting to PNG (${width}px)..."
    resize_jpg "$SRC_FILE_JPG" $width
done

# If all previous conversions pass, copy the main cover, checked by Make.
echo `basename $SRC_FILE_JPG`": copying to $DST_FILE_JPG..."
cp "$SRC_FILE_JPG" "$DST_FILE_JPG"

echo `basename $SRC_FILE_JPG`": All done."
