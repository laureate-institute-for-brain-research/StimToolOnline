#!/usr/bin/env python

# Geneareate scrambled images

#cmd = pycasso 159.gif 159_scramble scramble -n 30 30 -f png

import glob, os

import subprocess, pipes

media_path = "/Users/jtouthang/iCloud Drive (Archive)/Documents/Documents - L00019188/StimTool_Online/public/js/tasks/cooperation_task/media/outcome_media"
TILE_WIDTH = '20'
TILE_HEIGHT = '20'

def scramble_single_image(image_path):
    """
    Scrambe a single image.
    """
    filename = os.path.basename(image_path).replace('.jpg','')
    output_path = os.path.join(os.path.dirname(image_path), image_path.replace('.jpg', '_scramble'))
    # print(image_path, filename)
    cmd = "pycasso %s %s scramble -n %s %s -f jpg" % (
        pipes.quote(image_path), pipes.quote(output_path), TILE_WIDTH, TILE_HEIGHT)
    print(output_path)
    os.system(cmd)

def main():
    list_path = media_path + '/images/PI_earth/*.jpg'

    for image_path in glob.glob(list_path):
        scramble_single_image(image_path)


if __name__ == '__main__':
    #main()

    test_path = '/Users/jtouthang/iCloud Drive (Archive)/Documents/Documents - L00019188/StimTool_Online/public/js/tasks/cooperation_task/media/outcome_media/images/PI_earth/277.jpg'
    scramble_single_image(test_path)
