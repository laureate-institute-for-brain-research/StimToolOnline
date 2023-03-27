# Invitation Task
Social version of the planning task


![Thumbnail](/public/js/tasks/cooperation_task/thumbnail.png)

# OUTPUT

# Summary



# TRIAL STRUCTURE
```
[instructions]------------------------------- ->
^                                               ^  
INSTRUCT_ONSET                              TASK_ONSET
                      

                                                                   
```
# INPUT DETAILS

EACH LINE CODES: one trial
- COLUMN 1: **module** -  the module
- COLUMN 2: **trial_number** - trial number
- COLUMN 3: **start** - starting position
- COLUMN 4: **depth** - the max depth for the trial
- COLUMN 5: **OLL_ONLL** - either 'OLL' or 'ONLL' trial
- COLUMN 6: **ITI** - the jitter outcome duration time.
- COLUMN 7: **forced_choice** - either 'L', 'X', or 'R'. used in modules where there is only 1 choice.
- COLUMN 9: **path_version** - the path version. 

TRIAL ORDER IS: fixed


# OUTPUT DETAILS

```
trial_type codes:
Either "MODULE" or '[depth]_[current_path]_[building_type]

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

MODULE_ONSET (5)
response_time: 
response: 
result: 

WAITING_SELECTION_ONSET (6)
response_time: not used
response: not used
result: not used

RESPONSE (7)
response_time: time between WAITING_SELECTION_ONSET and RESPONSE
response: the response pressed. 
result: 
    module 1/2a/3: [accepted invites] | [rejected invites] | [total invites]
    module 1/2b/3: [accepted invites] | [rejected invites] | [question result either 'correct' or 'incorrect']

FIXATION_ONSET (8)
response_time: 
response: not used
result: 

OUTCOME_ONSET (9)
response_time: 
response: 
result: 

OUTCOME_RESPONSE (10)
response_time: 
response: 
result: 

POINTS_ONSET (11)
response_time: 
response: 
result: 

EXIT_BUILDING (12)
response_time: 
response: 
result: 

BREAK_ONSET (13)
response_time: 
response: 
result: 

BREAK_RESPONSE (14)
response_time: 
response: 
result: 

ANIMATION_ONSET (15)
response_time: 
response: 
result: 

TIME_UP (16)
response_time: 
response: 
result: 

PLANNING_ONSET (17)
response_time: 
response: 
result: 

```
