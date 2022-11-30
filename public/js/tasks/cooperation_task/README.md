# Cooperation Task
Social version of the 3-arm bandit task


![Thumbnail](/public/js/tasks/cooperation_task/thumbnail.png)

# OUTPUT

# Summary
This task presents the subject with a series of games where they choose 1 of 3 people to ask for help. Once selected, they will be presented witha either a 'yes' resonse or a 'no' response followed by an outcome image.


# TRIAL STRUCTURE
```
[instructions]------------------------------- ->
^                                               ^  
INSTRUCT_ONSET                              TASK_ONSET
                      
                      
   [fixation] -> [ 3 choies shown] -> [outcome] ->
   ^                    ^             ^
   TRIAL_ONSET
   FIXATION_ONSET       SELECTION     OUTCOME_IMAGE_ONSET
   BLOCK_ONSET                        OUTCOME_SOUND_ONSET
                                                                   
```
# INPUT DETAILS

EACH LINE CODES: one block
- COLUMN 1: **trials_block** -  the number of trials in each block
- COLUMN 2: **game_type** - game type of this block
- COLUMN 3: **probablity_1** - the probability of choice 1 that will have a positive outcome.
- COLUMN 4: **probablity_2** - the probability of choice 2 that will have a positive outcome.
- COLUMN 5: **probablity_3** - the probability of choice 3 that will have a positive outcome.
- COLUMN 6: **face_group** - the face group number of thhe current block
- COLUMN 7: **face_1** - the path of choice 1 face
- COLUMN 8: **face_2** - the path of choice 2 face
- COLUMN 9: **face_3** - the path of choice 3 face

TRIAL ORDER IS: fixed, but outcome image order is random


# OUTPUT DETAILS

```
trial_type codes:
pleasant - positive outcome games
unpleasant - negative outcome games

INSTRUCT_ONSET (1)
response_time: not used
response: not used
result: not used

TASK_ONSET (2)
response_time: time between INSTRUCT_ONSET and TASK_ONSET
response: not used
result: not used

BLOCK_ONSET (3)
response_time: not used
response: not used
result: not used

TRIAL_ONSET (4)
response_time: not used
response: not used
result: not used

SELECTION (5)
response_time: time between TRIAL_ONSET and SELECTION
response: the key pressed. either 1,2 or 3
result: the outcome type. either 'positive', 'negative' or 'meaningless

FIXATION_ONSET (6)
response_time: not used
response: not used
result: not used

OUTCOME_IMAGE_ONSET (7)
response_time: not used
response: not used
result: file path of the outcome image

OUTCOME_SOUND_ONSET (8)
response_time: the duration of the sound file
response: not used
result: file path of the sound played

AUDIO_ONSET (9)
response_time: not used
response: the instruction slide associated with slide
result: path of the instruction audio.

```
