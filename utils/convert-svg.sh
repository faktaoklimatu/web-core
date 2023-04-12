#!/bin/bash

# Inkscape install instructions
inkscape_install_instructions() {
    echo "On Ubuntu, add ppa for the latest Inkscape and install it using the commands below."
    echo "  sudo add-apt-repository ppa:inkscape.dev/stable"
    echo "  sudo apt update"
    echo "  sudo apt install inkscape"
}

# Check for Inkscape availability
if ! (which inkscape >/dev/null 2>&1)
then
    echo "Error: Inkscape not installed."
    inkscape_install_instructions
    exit 2
fi

# Check Inkscape version
if ! (inkscape --version 2>/dev/null | grep '^Inkscape 1\.' >/dev/null)
then
    echo "Error: You have an old version of Inkscape (below 1.0.0)."
    inkscape_install_instructions
    exit 3
fi

convert_svg_to_png() {
    input_svg=$1
    output_svg=$2
    width=$3
    inkscape \
        --export-area-page \
        --export-background=white \
        --export-width=$width \
        --export-background-opacity=255 \
        --export-type=png \
        --export-filename="${output_svg%.svg}_$width.png" \
        "$input_svg" \
        >/dev/null 2>&1
}
