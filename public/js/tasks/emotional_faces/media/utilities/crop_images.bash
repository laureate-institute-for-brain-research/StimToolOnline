#!/usr/bin/env bash

# This script will crop the images since
# There are white text on the image dataset


#convert MC10_Ang_050_copy.jpg -gravity North -chop 0x9 MC10_Ang_050_copy.jpg

for f in ../faces/*/*/*.jpg;
do
    echo $f
    convert $f -gravity North -chop 0x9 $f
done
