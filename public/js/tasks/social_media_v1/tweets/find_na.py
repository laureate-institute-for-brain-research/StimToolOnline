#!/usr/bin/env/python

# Find the Tweets that have NA
# This is because some game type that require more have not been filled


import json

# Opening JSON file
tweets_ = open('/Users/jtouthang/iCloud Drive (Archive)/Documents/Documents - L00019188/StimTool_Online/public/js/tasks/social_media/tweets/tweets.json')

# returns JSON object as 
# a dictionary
data = json.load(tweets_)

# Just hard coded topics from the schedule file to get the topics that are used for 10 posts.
h6_tweets = [
    "Rock Music",
    "Pop Music",
    "Tennis",
    "Spelunking",
    "American Football",
    "Golf",
    "Coffee",
    "Tea",
    "Meditation",
    "Drawing",
    "Comedy Movies",
    "Animated Movies",
    "Jazz Music",
    "Electronic Music",
    "Film-making",
    "Scrap Booking",
    "Mythology",
    "Zoology",
    "Carpentry",
    "Pottery",
    "Fishing",
    "Surfing",
    "Yoga",
    "Singing",
    "Coding",
    "Podcasts",
    "Microbiology",
    "Astronomy",
    "Silent Films",
    "Western Movies",
    "Magic Tricks",
    "Card Games",
    "Reality TV",
    "Mystery Novels",
    "80s Movies",
    "Classic Literature",
    "Philosophy",
    "Environmentalism",
    "Modeling",
    "Blogging",
    "Hockey",
    "Hiking",
    "Farming",
    "Gardening",
    "Swimming",
    "Cliff Diving",
    "Parkour",
    "Cheerleading",
    "Snowboarding",
    "Paintball",
    "Pool",
    "Aquariums",
    "Puzzles",
    "Geology",
    "Food",
    "Anime",
    "Interior Design",
    "Thrifting",
    "Prepping",
    "Shakespeare",
    "Beach-combing",
    "Candle Making",
    "Tattooing",
    "Hairdressing",
    "Astrology",
    "Fossils",
    "Disney",
    "Dogs",
    "Beekeeping",
    "Jewelry Making",
    "Shopping",
    "Makeup",
    "Rafting",
    "Car Racing",
    "Cats",
    "Holidays",
    "Woodcarving",
    "Classical Music",
    "DJing",
    "Botany"
]


na_tweets = []
non_na_tweets = []
for key in data:
    
    if 'NA' in data[key]:
        na_tweets.append(key)
    else:
        non_na_tweets.append(key)

na_tweets.sort()

print("H6 tweets that also doesn't have enough tweets:")
print("-----------------------------------------------")
for tweet in na_tweets:

    if tweet in h6_tweets:
        
        print('- ' + tweet)

