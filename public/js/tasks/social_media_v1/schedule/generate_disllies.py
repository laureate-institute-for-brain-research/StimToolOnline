#!/usr/bin/env python

import random

random.seed(10)

# This script will generate random games where half are dislikes and other half
# likes chat rooms.

TOTAL_GAMES = 80

TOTAL_DISLIKES = TOTAL_GAMES / 2
TOTAL_LIKES = TOTAL_GAMES - TOTAL_DISLIKES # remaining games are likes


# 0's are likes
# 1's are dislikes

dislikes = [1 for x in range(TOTAL_DISLIKES)]
likes= [ 0  for x in range(TOTAL_LIKES)]

combined = dislikes + likes
print('Total Games: ',len(combined))
print('Total Dislikes: ',len(dislikes))
print('Total Likes: ',len(likes))
#print(combined, len(combined))


random.shuffle(combined) # this is the list we should use

for idx, like_dislike in enumerate(combined):
    #print(idx,like_dislike )

    if like_dislike == 1:
        print(idx)
