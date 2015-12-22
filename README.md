Design Document
===============

Login
-----

TBD. It's important to never require it except for saving state in a syncable way.

Misc
----

How do we organize the various screens? Do we want things bookmarkable? Does it matter whether the back button functions properly? Do we want it to? No, probably not. Not for now. Single-page operation is fine.

Brainstorm
----------

- Open app
- Choose between Free Play, Missions.

Free Play:
- Select a query from the list
- Easy, Medium, Hard.
- Never affects overall statistics. Just calculates and stores, but doesn't go into trouble spot sampling.

Missions:
- Garden path - get through all of the levels in order.
- Question: do we allow skipping ahead by testing out? Sure, we can do that and mark all associated levels as complete when the test is passed. Tests should be longer, of course, and pretty hard.

- How does the story progress?
  - What constitutes success?
    - Make sure each run samples evenly from the query. Every character tried, what, at least 3 times?
    - No character missed every time, and no more than 10% misses altogether?
    - Star system - 10% missed is the minimum, then 5%, then 0 or 1.
    - If one character is missed more than others, do we emphasize it in subsequent practice? Yes, probably, but that might mess up our statistics. We could develop the sampler by taking away from an easy character and giving it to a hard one. But does that work properly? It could. What if there is more than one hard character? How do we do this in a principled way? Do we just take the worst one each time and remove from the next available easiest one? There has to be a ceiling somewhere.
    - There also needs to be a "reset and forget what you know about me" button.

Flow and Screens
----------------

- Main screen: welcome, allow login if wanted, choose type of practice
  - Free mastery:
    - Level Picker (open)
    - Game Picker (mastery)
  - Guided mastery:
    - Level Picker (restricted)
    - Game Picker (mastery)
  - Speed drills: unlocked after mastery
    - Type Picker (pseudo text, real text)
    - Game Picker (speed)
  - Statistics
    - weak letters, fingers, hands (for mastery)
    - if mastery achieved but accuracy is poor on speed drills, suggest mastery exercises.

- Level Picker (restricted or open)
  - Show available levels, with restricted levels so indicated
  - Events:
    - onselect
    - oncancel (?)

- Game Picker (mastery or speed)
  - Show available games based on type
  - Events:
    - onselect
    - oncancel (?)

- Type Picker (pseudo or real)
  - Show types
  - Events:
    - onselect
    - oncancel (?)

- Game Screen
  - Event capture except when paused
  - Countdown starts, then triggers game mode until pause or complete.

- Pause Overlay
  - Quit from here
  - Resume from here
  - Show progress thus far

- Completion Screen
  - Show basic stats
  - Immediate retry if guided and not successful
  - Award display if successful (and unlock)
  - Next logical step if guided and successful
  - Back to level picker if not guided.


Game Concepts
-------------

- Captive game window
  - Can be started, paused, quit.
  - While running, captures all input.

- Countdown screen
  - Can be started, but must run to completion.

- Choice screens
  - Take up similar horizontal space as the game screen, but possibly a lot more vertical space.
