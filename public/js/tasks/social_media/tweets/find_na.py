#!/usr/bin/env/python

# Find the Tweets that have NA
# This is because some game type that require more have not been filled


import json

# Opening JSON file
tweets_ = open('/Users/jtouthang/iCloud Drive (Archive)/Documents/Documents - L00019188/StimTool_Online/public/js/tasks/social_media/tweets/tweets.json')

# returns JSON object as 
# a dictionary
data = json.load(tweets_)

na_tweets = []
non_na_tweets = []
for key in data:
    
    if 'NA' in data[key]:
        na_tweets.append(key)
    else:
        non_na_tweets.append(key)

na_tweets.sort()
print('NA TWEETS:')
for tweet in na_tweets:
    print(tweet)