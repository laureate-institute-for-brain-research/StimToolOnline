#!/usr/bin/bash

# Using ffmpeg to generate tones

# High Tone
# Duration - 300ms
# 660 Hz
ffmpeg -f lavfi -i "sine=frequency=660:duration=0.3" high_tone.mp3


# Low Tone
# Duration - 300ms
# Low Tone - 440 Hz
ffmpeg -f lavfi -i "sine=frequency=440:duration=0.3" low_tone.mp3