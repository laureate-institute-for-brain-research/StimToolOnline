#!/bin/bash

# Scrip that speeds up the audio to 1.5x

# Loop all mp3 and create a fast version of the audio
for f in ../media/outcome_media/sounds_fast/*/*.mp3; \
    do \
        new_f=$(echo $f | sed 's/.mp3/_fast.mp3/g'); # create new path
        ffmpeg -y -i $f -filter:a "atempo=1.5" -vn $new_f # actual speedup
        rm $f # remove old audio
        mv $new_f $f # rename back to old file
    done
