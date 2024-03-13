# Emotional Faces Task
Social version of the Houses/Faces task from this paper:

https://www.sciencedirect.com/science/article/pii/S0960982220315864

![Thumbnail](/public/js/tasks/emotional_faces_v2/emotional_faces_v2_pic.png)

# OUTPUT

# Summary
This task presents the subject with a series of either a low tone or high tone noise followed by an image of either an angry or sad face. The noise and image occur in quick succession and the image is only shown briefly (0.15 seconds). After a combination is presented, the subject either presses the left or right arrow key to indicate whether they were shown an angry or sad face. If the subject does not respond quickly enough, then they are presented with text saying "too slow" before the series proceeds to the next combination.

# TRIAL STRUCTURE
```
[instructions]---------- -> [familiarization]----- -> ([face and choices shown]----- -> [feedback shown])x(54) ->
^                           ^                          ^                      ^         ^
TASK_ONSET                  RATE_FACES|BLOCK_ONSET     RATE_FACES|FACE_ONSET  RESPONSE  FEEDBACK
INSTRUCTIONS|BLOCK_ONSET

[practice]-------- -> ([fixation]-- -> [sound played] -> [image shown] -> [2 choices shown]----- -> [feedback shown])x(4) ->
^                     ^                ^                 ^                ^               ^         ^
PRACTICE|BLOCK_ONSET  FIXATION_ONSET   TONE_ONSET        FACE_ONSET       CHOICE_ONSET    RESPONSE  FEEDBACK

                  (3.0s or 0.5s ~ 1.5s)      (1.0s)           (150ms)            (2.5s)                (conditional 2.0s)
[trial]------ -> ([fixation]-----------> [sound played] -> [image shown] -> [2 choices shown]------ -> [feedback shown])x(336) ->
^                 ^               ^                 ^                ^               ^          ^
MAIN|BLOCK_ONSET  FIXATION_ONSET  TONE_ONSET        FACE_ONSET       CHOICE_ONSET    RESPONSE   FEEDBACK
```

# INPUT DETAILS

EACH LINE CODES: one trial
- COLUMN 1: **trial_number** - The number of the trial.
- COLUMN 2: **tone** - The tone that will be played for the trial.
- COLUMN 3: **stim_type** - The sad or angry status of the trials image.
- COLUMN 4: **intensity** - The low, medium, or high amount of anger or sadness that is represented in the image.
- COLUMN 5: **response_duration** - The amount of time allowed before a response is considered "too slow".
- COLUMN 6: **prob_hightone_sad** - Not used
- COLUMN 7: **gender** - The gender associated with the image.
- COLUMN 8: **ID** - The ID associated with the image.
- COLUMN 9: **stim_paths** - The path of the face image used in the trial.

TRIAL ORDER IS: fixed

# OUTPUT DETAILS

```
INSTRUCT_ONSET (1) (NOT USED)
response_time: not used
response: not used
result: not used

TASK_ONSET (2)
response_time: not used
response: not used
result: not used

FIXATION_ONSET (3)
response_time: not used
response: not used
result: not used

FACE_ONSET (4)
response_time: not used
response: not used
result: path to face image

TONE_ONSET (5)
response_time: not used
response: not used
result: indication of whether the tone was high or low

CHOICE_ONSET (6)
response_time: not used
response: not used
result: not used

RESPONSE (7)
response_time: time between CHOICE_ONSET and RESPONSE
response: left (angry) or right (sad) key pressed
result: whether the angry/sad determination matched the face image

BLOCK_ONSET (8)
response_time: the duration of the sound file
response: not used
result: file path of the sound played

FEEDBACK (9)
response_time: not used
response: not used
result: "too slow" when a response was not made in time

AUDIO_ONSET (10) (NOT USED)
response_time: not used
response: not used
result: not used
```
