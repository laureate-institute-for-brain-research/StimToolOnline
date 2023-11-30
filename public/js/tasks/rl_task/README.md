# Reinforcement Learning Task (Memory Game)
The following was used for reference:<br/>
https://github.com/sophiebavard/online_task<br/>
https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3002201#

# OUTPUT

# Summary
This task consists of instructions, a practice, and three phases.<br/>
<ins>Instructions:</ins> Initial instructions are presented and followed by an instruction check. Failure to answer all questions 
        correctly will result in the instructions repeating.<br/>
<ins>Practice:</ins> The practice consists of two blocks of consecutive contexts (1 context is a set of 3 identicons, each of which provides a
        different average score upon selection). The average score mentioned is drawn from a Gaussian distribution with characteristics 
        pulled from the tasks config file. The first context block is 6 trials of choosing among three options. The second context
        block is 6 trials of choosing among 2 options. After making a selection, all stimuli are replaced with score displays of the points 
        associated with the stimuli, but only the selected one is highlighted. The goal is to learn which identicon within a context provides the highest
        average reward and to maximize your reward by selecting the best one on each trial. Stimuli location on the screen (left/middle/right)
        is randomized. The total practice score is the sum of points received for each selection in a trial. If a >=60% "correct" threshold is not 
        met, then the practice must be repeated.<br/>
<ins>Phase 1 (LEARNING):</ins> This phase plays out similar to the practice. Two big differences are that the two contexts should use different identicons 
        from the practice and that they are not seperated into blocks. Instead, the contexts are both interleaved and either presented in pairs or trios 
        (as described in the table below). The total Phase 1 score is the sum of points received for each selection.<br/>

| Stimuli     | Context 1 | Context 2 |
|-------------|-----------|-----------|
| L vs M vs H | 20        | 20        |
| L vs M      | 20        | 0         |
| M vs H      | 0         | 20        |
| L vs H      | 20        | 20        |

<ins>Phase 2 (TESTING):</ins>For this phase, all possible permutations (order matters) of stimuli across all contexts are presented in binary pairs (4 times each). 
        The contexts used are the same as from Phase 1. The total Phase 2 score is the sum of points received for each selection added to the total 
        score of phase 1. For scoring, ignore trials pairing similar stimuli (H1 and H2, M1 and M2, L1 and L2).<br/>
<ins>Phase 3 (EXPLICIT):</ins>For this phase, each identicon is presented individually 4 times. A slider and value display are given to allow participants to select a
        value estimate. The goal is to make an estimate of the average value that the displayed identicon provided. There is no score calculated during this phase.<br/>
<br/>

# TRIAL STRUCTURE (Practice)

```
                                                 (Free Response Time)            (2.0s)
[instructions]---------- -> [Practice]----- -> ([Stimuli Presented]---------- -> [feedback shown])x(12)
^                           ^                   ^                   ^            ^
TASK_ONSET                  BLOCK_ONSET         TRIAL_ONSET         CHOICE     FEEDBACK
INSTRUCTIONS|BLOCK_ONSET
```

# TRIAL STRUCTURE (Phase 1)

```
                             (Free Response Time)            (2.0s)
[instructions]---------- ->([Stimuli Presented]---------- -> [feedback shown])x(120)
^                           ^                   ^            ^
TASK_ONSET                  TRIAL_ONSET         CHOICE     FEEDBACK
INSTRUCTIONS|BLOCK_ONSET
```

# TRIAL STRUCTURE (Phase 2)

```
                             (Free Response Time)            (0.5s)
[instructions]---------- ->([Stimuli Presented]---------- -> [feedback shown])x(120)
^                           ^                   ^            ^
TASK_ONSET                  TRIAL_ONSET         CHOICE     FEEDBACK
INSTRUCTIONS|BLOCK_ONSET
```

# TRIAL STRUCTURE (Phase 3)

```
                            (Free Response Time)            
[instructions]---------- ->([Stimuli Presented])x(24)
^                           ^                  ^
TASK_ONSET                  TRIAL_ONSET        CHOICE
INSTRUCTIONS|BLOCK_ONSET
```

# INPUT DETAILS
```
EACH LINE CODES: one trial
trial_number - Trial index
L_mean - Gaussian Distribution mean to use for low point generation
M_mean - Gaussian Distribution mean to use for medium point generation
H_mean - Gaussian Distribution mean to use for high point generation
L_variance - Gaussian Distribution variance to use for low point generation
M_variance - Gaussian Distribution variance to use for medium point generation
H_variance - Gaussian Distribution variance to use for high point generation
mix_contexts - NOT USED
trials_per_option - NOT USED
options - Stimuli used in trial (Order and positions is shuffled in code for phase 1 schedule. Order is kept for phase 2 schedule.)

TRIAL ORDER IS: fixed
```
# CONFIG DETAILS

Image paths for stimuli.
Learning feedback display duration.
Testing feedback (highlight) display duration.

* NOTE: Replacing values should be safe. However, adding columns and values will most likely require a developer. Feel free to reach out to arobinson@laureateinstitute.org.

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

BLOCK_ONSET (3)
response_time: not used
response: not used
result: not used

TRIAL_ONSET (4)
response_time: not used
response: not used
result: For phase 1 and 2, list of [stimuli,value] pairings (position in list is position on screen). For phase 3, it is just the stimuli presented.

CHOICE (5)
response_time: time between trial onset and selection.
response: For phase 3, score estimate. For phase 1 and 2, position selected.
result: not used

FEEDBACK (6)
response_time: not used
response: Total Score.
result: Score added this trial.

FIXATION_ONSET (7) (NOT USED)
response_time: not used
response: not used
result: not used

AUDIO_ONSET (8) (NOT USED)
response_time: not used
response: not used
result: not used
```
