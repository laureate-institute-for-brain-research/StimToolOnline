#!/usr/bin/env python

# Script to generate the json file from the excel sheet.
# Input: Excel file where column are categories with tweets.
# Output: json file with the subject name as the keys and the values are a
#         list of tweets.


EXCEL_FILE_PATH = ''

import pandas as pd
import json