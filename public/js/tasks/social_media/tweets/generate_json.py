#!/usr/bin/env python

# Script to generate the json file from the excel sheet.
# Input: Excel file where column are categories with tweets.
# Output: json file with the subject name as the keys and the values are a
#         list of tweets.


EXCEL_FILE_PATH = ''

import pandas as pd
import json



def main():
    """
    """

    # Read excel file
    tweets_df = pd.read_csv('/Users/jtouthang/iCloud Drive (Archive)/Documents/Documents - L00019188/StimTool_Online/public/js/tasks/social_media/tweets/Horizon Social Media Tweets_updated_07_26_2022.csv', index_col=0)
    #print(tweets_df)

    # NA are 'NA"
    tweets_df.fillna('NA', inplace=True)

    tweets_json = {}

    # Iteraver of each columns
    for col in tweets_df.columns:
       # print(col)

        #if col == 'Topic': continue

        # Add to dictionary if not already
        if not col in tweets_json:
            only_tweets_df = tweets_df.head(10)
             # Add all the tweets to the list
            tweets_json[col] = list(only_tweets_df[col])
    
    # Write to file
    with open("/Users/jtouthang/iCloud Drive (Archive)/Documents/Documents - L00019188/StimTool_Online/public/js/tasks/social_media/tweets/tweets.json", "w") as outfile:
        json.dump(tweets_json,outfile,  indent=4) 

if __name__ == '__main__':
    main()