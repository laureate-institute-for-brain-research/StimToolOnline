#!/usr/bin/env python

# Geneate ISI durations rougly around 2 seconds.
# Just copy the output to the schedule file

import numpy as np
import math

################# CONFIGS ###############
TOTAL_TRIAL = 108
MEAN = 3000 # in ms
STD_DEVIATION = 500 #in ms
np.random.seed(0)
#########################################

# Generate Normal distribution

durations = np.random.normal(MEAN, STD_DEVIATION, size=TOTAL_TRIAL)

# Keep generating random numbers until all numbers are positive.
while( (all (x > 0 for x in durations)) == False):
    durations = np.random.normal(MEAN, STD_DEVIATION, size=TOTAL_TRIAL)


for duration in durations:
    print(int(math.floor(duration)))
