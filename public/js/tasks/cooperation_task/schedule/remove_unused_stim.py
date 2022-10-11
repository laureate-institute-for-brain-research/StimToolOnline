#!/usr/bin/env python

# Remove unused stim in the face_paths

import pandas as pd


def main():
    outcome_media = pd.read_csv('/Users/jtouthang/iCloud Drive (Archive)/Documents/Documents - L00019188/StimTool_Online/public/js/tasks/cooperation_task/outcome_media.csv')
    imate_path = outcome_media['image_path'].tolist()
    sound_path = outcome_media['sound_path'].tolist()
    print('image_path:')
    print(len([*set(imate_path)]))
    print('sound_path:')
    print(len([*set(sound_path)]))

if __name__ == '__main__':
    main()
