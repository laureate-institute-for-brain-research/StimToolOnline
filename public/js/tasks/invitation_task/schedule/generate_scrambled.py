#!/usr/bin/env python

# Geneareate scrambled images

#cmd = pycasso 159.gif 159_scramble scramble -n 30 30 -f png

import glob, os

import subprocess, pipes

media_path = "/Users/jtouthang/iCloud Drive (Archive)/Documents/Documents - L00019188/StimTool_Online/public/js/tasks/cooperation_task/media/outcome_media"
TILE_WIDTH = '20'
TILE_HEIGHT = '20'


def main():
    list_path = media_path + '/images/*/*.gif'

    for image_path in glob.glob(list_path):
        filename = os.path.basename(image_path).replace('.gif','')
        output_path = os.path.join(os.path.dirname(image_path), image_path.replace('.gif', '_scramble'))
        # print(image_path, filename)
        cmd = "pycasso %s %s scramble -n %s %s -f gif" % (
            pipes.quote(image_path), pipes.quote(output_path), TILE_WIDTH, TILE_HEIGHT)
        print(output_path)
        os.system(cmd)


if __name__ == '__main__':
    main()
