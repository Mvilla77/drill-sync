/**
 * The 40 new drills generated for the drill database, reshaped to match the
 * site's real program/block naming exactly, so they can be assigned directly
 * to card slots. See EFC_Fencing_Drills_Database.xlsx for the full 50-drill
 * database (this pool is the 40 new ones, excluding the 10 originals already
 * live on the site).
 */
export interface PoolDrill {
  program: "Adult Class" | "Youth Class";
  block: string;
  duration: string;
  exercise: string;
  coachNotes: string;
  purpose: string;
}

export const NEW_DRILL_POOL: PoolDrill[] = [
  // Adult - Footwork Block (8)
  { program: "Adult Class", block: "Adult Footwork Block", duration: "10 min", exercise: "Advance-Retreat Ladder",
    coachNotes: "Fencers advance and retreat along a taped ladder on the strip, one step per rung. Build progressions: 1) Steady rhythm, one rung per beat. 2) Double-time on 'Go'. 3) Advance two rungs, retreat one, on coach signal. 4) Add a lunge on the final rung of any sequence.",
    purpose: "1) Builds precise step length and spacing awareness. 2) Trains the fencer to change cadence without losing balance. 3) Groundwork for controlling distance in a bout." },
  { program: "Adult Class", block: "Adult Footwork Block", duration: "10 min", exercise: "Balestra-Lunge Drill",
    coachNotes: "Fencers perform a balestra (small forward jump) immediately followed by a lunge, on the coach's signal. Progressions: 1) Balestra-lunge in place. 2) Balestra-lunge closing distance from 2m. 3) Balestra-lunge into a target held by the coach. 4) Balestra-lunge with a feint before the final extension.",
    purpose: "1) Builds explosive forward power. 2) Teaches fencers to close distance in one committed action instead of creeping forward. 3) Introduces the balestra as a legitimate distance-closing tool, not just a feint." },
  { program: "Adult Class", block: "Adult Footwork Block", duration: "8 min", exercise: "Change of Rhythm Shuffle",
    coachNotes: "Fencers shuffle forward and back in short steps at a constant tempo. On a random signal (clap, whistle, call), they must instantly double or halve their speed for three steps, then return to base tempo.",
    purpose: "1) Trains the fencer to disguise intention through consistent rhythm. 2) Sharpens reaction time to unpredictable cues. 3) Prevents the common habit of telegraphing speed changes before an attack." },
  { program: "Adult Class", block: "Adult Footwork Block", duration: "8 min", exercise: "Cross-Step Recovery Drill",
    coachNotes: "From en garde, fencers perform a lateral cross-step (crossing the back leg behind the front) then immediately recover to a square en garde stance. Progressions: 1) Cross-step right, recover. 2) Cross-step left, recover. 3) Cross-step + immediate step-lunge on coach's call.",
    purpose: "1) Builds comfort recovering balance after off-line footwork. 2) Prepares fencers for situations where they're pushed off the strip's centerline. 3) Reinforces that every off-axis movement must end back in a strong en garde." },
  { program: "Adult Class", block: "Adult Footwork Block", duration: "10 min", exercise: "Explosive Lunge from Half-Squat",
    coachNotes: "Fencers hold a deep half-squat en garde for 3 seconds, then explode into a full lunge on the coach's signal. Progressions: 1) Static hold + lunge. 2) Hold + lunge into a held target. 3) Hold + advance + lunge, combining the compression concept with forward movement.",
    purpose: "1) Converts stored leg tension directly into lunge speed. 2) Reinforces that power comes from the legs, not from leaning the torso forward. 3) Builds the specific strength pattern used in a real attacking lunge." },
  { program: "Adult Class", block: "Adult Footwork Block", duration: "8 min", exercise: "Retreat-Retreat-Lunge Combo",
    coachNotes: "Fencers perform two fast retreats followed immediately by a step-lunge counter-attack, simulating drawing an opponent forward before striking. Add a parry-riposte variation: two retreats, then a parry in place, then riposte.",
    purpose: "1) Trains the classic 'draw and strike' tempo used against an over-eager attacker. 2) Builds the habit of keeping balance through consecutive retreats before committing forward. 3) Real bout pattern fencers will use against aggressive opponents." },
  { program: "Adult Class", block: "Adult Footwork Block", duration: "7 min", exercise: "Balance Point Holds",
    coachNotes: "Fencers hold mid-lunge position (front knee bent, back leg extended, arm fully extended) for 5-10 seconds on the coach's call, focusing on a stable, low center of gravity. Progressions: 1) Hold after a slow lunge. 2) Hold after a fast lunge. 3) Hold, then recover to en garde without wobbling.",
    purpose: "1) Builds the specific leg strength and balance needed to hold a lunge under pressure (e.g., waiting for a parry). 2) Exposes and corrects wobble or overextension. 3) Improves recovery speed since a stable lunge recovers faster." },
  { program: "Adult Class", block: "Adult Footwork Block", duration: "10 min", exercise: "Footwork Mirror Chase",
    coachNotes: "Pairs face off with no blades. One fencer leads with any footwork combination (advances, retreats, half-steps); the partner must mirror the exact rhythm while maintaining distance. Switch leader every 90 seconds.",
    purpose: "1) Sharpens distance perception under changing tempo. 2) Builds peripheral awareness of an opponent's legs, not just their blade. 3) Warms up footwork variety before blade work begins." },

  // Adult - Controlled Fencing (8)
  { program: "Adult Class", block: "Adult Controlled Fencing", duration: "8 min", exercise: "Preparation & Reaction",
    coachNotes: "One fencer performs a 'preparation' (advance, blade engagement, or feint) without committing to a full attack. The partner must react appropriately — attack into the preparation, or hold distance. Coach calls out which preparation to use each round.",
    purpose: "1) Teaches fencers to read intention before full commitment. 2) Builds the skill of attacking into an opponent's preparation, a core competitive tactic. 3) Removes guesswork by having the coach control what's shown, so reactions can be isolated and corrected." },
  { program: "Adult Class", block: "Adult Controlled Fencing", duration: "10 min", exercise: "Second Intention Drill",
    coachNotes: "Fencer A makes a deliberately 'false' attack meant to draw a parry-riposte from Fencer B. Fencer A then parries B's riposte and ripostes back. Progressions: 1) Walk through slowly first. 2) Full speed. 3) Randomize whether A commits to the false attack or converts it to a real one.",
    purpose: "1) Introduces second-intention tactics — winning the exchange after the first action, not during it. 2) Builds patience and the ability to plan two moves ahead. 3) Trains the parry-riposte-parry-riposte chain fencers need at higher levels." },
  { program: "Adult Class", block: "Adult Controlled Fencing", duration: "5 min", exercise: "Blade Coverage Drill",
    coachNotes: "Fencers maintain light blade contact (opposition) while advancing and retreating, never letting the tip drift off-line. Coach calls 'Break' at random moments — the fencer must reestablish coverage within one step.",
    purpose: "1) Builds the habit of controlling the opponent's blade line rather than only chasing the target. 2) Trains recovery speed when coverage is lost. 3) Groundwork for opposition-based attacks like coulé and croisé." },
  { program: "Adult Class", block: "Adult Controlled Fencing", duration: "8 min", exercise: "Disengage Under Pressure",
    coachNotes: "Fencer A presses Fencer B's blade (a beat or pressure); B must disengage (go around the blade) and score before A recovers. Progressions: 1) Slow, cooperative pace. 2) Full speed. 3) A varies between beat and pressure to keep B reacting, not anticipating.",
    purpose: "1) Builds clean disengage technique under realistic pressure. 2) Trains the timing needed to exploit a blade take. 3) Prevents the common error of disengaging too early, before the opponent's blade has committed." },
  { program: "Adult Class", block: "Adult Controlled Fencing", duration: "8 min", exercise: "Feint-Deceive Drill",
    coachNotes: "Attacker feints to one target line, then deceives the defender's parry and lands on the opposite line. Defender must commit to a real parry attempt each time (no half-hearted parries). Progressions: 1) Single feint. 2) Double feint (feint, feint, deceive). 3) Add footwork — feint on the advance, deceive on the lunge.",
    purpose: "1) Builds the timing and blade control needed for compound attacks. 2) Forces the defender to commit fully, making the drill honest for both fencers. 3) Prepares fencers for opponents who parry reliably and need to be deceived, not overpowered." },
  { program: "Adult Class", block: "Adult Controlled Fencing", duration: "10 min", exercise: "Counter-Time",
    coachNotes: "Fencer A attacks on Fencer B's preparation (a deliberate false opening). B parries A's attack and ripostes (counter-time). Coach controls who initiates each round to isolate the skill.",
    purpose: "1) Trains recognition of and response to attacks-on-preparation, a common tactic at competitive levels. 2) Builds the parry-riposte reflex specifically against opportunistic attacks. 3) Develops tactical patience instead of purely reactive fencing." },
  { program: "Adult Class", block: "Adult Controlled Fencing", duration: "5 min", exercise: "Point Control Chase",
    coachNotes: "Defender retreats while the attacker keeps the point aimed at a single target zone (e.g., chest) throughout, adjusting only with footwork, not arm movement. Switch roles every 60 seconds.",
    purpose: "1) Isolates point control from footwork, since many fencers unconsciously wave the tip while moving. 2) Builds the discipline needed for a threatening, quiet blade. 3) Reinforces that distance, not blade movement, should do most of the work while closing." },
  { program: "Adult Class", block: "Adult Controlled Fencing", duration: "8 min", exercise: "Tempo Break Drill",
    coachNotes: "Fencers exchange slow, cooperative blade actions (engagement, disengagement) until the coach calls 'Break' — at that instant, whoever reacts first with a real attack scores. Reset and repeat with unpredictable timing.",
    purpose: "1) Trains explosive reaction to a sudden change in tempo, a core skill in real bouts. 2) Builds comfort transitioning from a slow, controlled phase to full speed instantly. 3) Removes anticipation by randomizing the break point." },

  // Adult - Open Fencing (4)
  { program: "Adult Class", block: "Adult Open Fencing", duration: "20 min", exercise: "Directive Free Fencing",
    coachNotes: "Free fencing, but each bout carries one specific mission chosen by the coach (e.g., 'win every touch with a disengage', 'never retreat first'). Rotate missions and partners every 3-4 touches.",
    purpose: "1) Applies isolated skills inside real, unscripted bout pressure. 2) Prevents free fencing from becoming purely instinctual by giving it a technical focus. 3) Builds the habit of executing a game plan under pressure." },
  { program: "Adult Class", block: "Adult Open Fencing", duration: "15 min", exercise: "Score Streak Challenge",
    coachNotes: "Fencers bout normally, but track consecutive touches scored without being touched back. Coach calls out the current streak to build competitive pressure. Reset streak count on any touch received.",
    purpose: "1) Builds composure under mounting pressure. 2) Rewards consistency, not just single flashy touches. 3) Simulates the mental pressure of a real close bout." },
  { program: "Adult Class", block: "Adult Open Fencing", duration: "15 min", exercise: "Limited Actions Bout",
    coachNotes: "Free fencing, but each fencer may only use actions from a short coach-assigned list (e.g., only direct attacks and parry-4/riposte). Anything outside the list doesn't count even if it lands.",
    purpose: "1) Forces mastery of a small toolkit under real pressure instead of falling back on habits. 2) Highlights which actions a fencer can and can't execute reliably when it matters. 3) Useful for fencers overusing one dominant action." },
  { program: "Adult Class", block: "Adult Open Fencing", duration: "25 min", exercise: "Round Robin Bouts",
    coachNotes: "Short 3-touch bouts against every partner in the group, rotating every few minutes. Coach observes and notes one specific correction per fencer to address next session.",
    purpose: "1) Builds competition stamina and quick adaptation to different opponents' styles. 2) Gives the coach broad diagnostic information across the whole group in one session. 3) Keeps energy and engagement high through frequent partner changes." },

  // Youth - Footwork Block (8)
  { program: "Youth Class", block: "Youth Footwork Block", duration: "6 min", exercise: "Statue Freeze Footwork",
    coachNotes: "Fencers move (advance/retreat) while music plays or the coach counts; when it stops, everyone must freeze instantly in perfect en garde, like a statue. Coach checks form on each freeze and gives one quick correction per fencer.",
    purpose: "1) Makes correct en garde posture into a fun, repeatable habit. 2) Trains fencers to stop cleanly and under control, not stumble to a stop. 3) Keeps attention high through a game format at an age where pure drilling loses focus fast." },
  { program: "Youth Class", block: "Youth Footwork Block", duration: "6 min", exercise: "Red Light, Green Light En Garde",
    coachNotes: "Classic red light/green light, but fencers must advance in proper en garde footwork on 'green' and freeze on 'red'. Coach adds 'yellow' for retreat.",
    purpose: "1) Builds reactive footwork through a game the kids already understand. 2) Reinforces advance/retreat as instinctive responses to a signal. 3) Keeps the drill low-stress and high-fun, appropriate for this age group." },
  { program: "Youth Class", block: "Youth Footwork Block", duration: "6 min", exercise: "Balloon Balance Steps",
    coachNotes: "Each fencer holds a balloon against their chest with their off-hand (or balances it on their head) while performing slow advances and retreats. Dropping the balloon means restarting that step.",
    purpose: "1) Builds postural control and a stable upper body during footwork, without lecturing about posture directly. 2) Makes stillness of the torso fun and self-correcting — the balloon is the feedback. 3) Low-pressure format that keeps younger fencers engaged." },
  { program: "Youth Class", block: "Youth Footwork Block", duration: "7 min", exercise: "Copy Cat Footwork",
    coachNotes: "Coach performs a short footwork sequence (2-3 steps); fencers copy it exactly right after. Sequences get slightly longer or add a small step variation each round.",
    purpose: "1) Builds footwork vocabulary through imitation, which is easier for this age than verbal instruction. 2) Trains short-term sequencing and listening skills alongside footwork. 3) Naturally increases difficulty at a pace the group can follow." },
  { program: "Youth Class", block: "Youth Footwork Block", duration: "6 min", exercise: "Animal Walks Warm-Up",
    coachNotes: "Fun warm-up where fencers move across the strip as different animals (crab walk, bunny hops, duck walk) before transitioning into normal en garde footwork.",
    purpose: "1) Warms up the whole body in a way that keeps young fencers engaged and moving. 2) Builds general coordination and leg strength that transfers into footwork. 3) Creates a fun start to class that makes the more technical drills easier to introduce after." },
  { program: "Youth Class", block: "Youth Footwork Block", duration: "7 min", exercise: "Slow-Motion Lunge Practice",
    coachNotes: "Fencers perform lunges in exaggerated slow motion, like a movie in slow-mo, focusing on one body part at a time (front knee, back leg, arm). Coach narrates each part as they move.",
    purpose: "1) Slowing the action down makes correct form achievable and visible at this age. 2) Breaks a complex movement into manageable pieces. 3) The 'slow-mo movie' framing keeps it playful instead of feeling like a correction drill." },
  { program: "Youth Class", block: "Youth Footwork Block", duration: "6 min", exercise: "Numbers Game Footwork",
    coachNotes: "Coach calls out a number (1, 2, or 3); fencers must perform that many advances (or retreats on a second signal) as fast as possible without losing en garde form.",
    purpose: "1) Combines footwork practice with a simple listening/counting task appropriate for the age group. 2) Builds quick, controlled bursts of movement rather than sloppy speed. 3) Easy to run as a group and simple to understand." },
  { program: "Youth Class", block: "Youth Footwork Block", duration: "7 min", exercise: "Mirror Partner Steps",
    coachNotes: "Partners face each other; one leads with simple footwork (advance, retreat, small side-step), the other mirrors like a reflection. Switch roles halfway through.",
    purpose: "1) Introduces working with a partner and reading another person's movement, a precursor to real fencing distance. 2) Keeps footwork practice social and engaging. 3) Builds early distance awareness without any blade involved yet." },

  // Youth - Controlled Fencing (7)
  { program: "Youth Class", block: "Youth Controlled Fencing", duration: "6 min", exercise: "Tag the Target (No Blade)",
    coachNotes: "No weapons. Fencers try to lightly tag a designated target zone (e.g., shoulder) on their partner using only footwork to close distance, while the partner retreats and tries not to get tagged.",
    purpose: "1) Introduces the core idea of closing distance to score, without weapon complexity. 2) Keeps the drill safe and simple for younger fencers. 3) Builds the same distance-management skills used later with a blade." },
  { program: "Youth Class", block: "Youth Controlled Fencing", duration: "6 min", exercise: "Simon Says Distance",
    coachNotes: "Simon Says format, but commands are fencing-specific: 'Simon says advance', 'Simon says retreat', 'Simon says close the distance'. Fencers must only move on valid 'Simon says' commands, keeping proper distance from their partner throughout.",
    purpose: "1) Builds careful listening alongside footwork discipline. 2) Reinforces distance awareness in a low-pressure, game-based way. 3) Naturally weeds out impulsive movement, which is a common issue at this age." },
  { program: "Youth Class", block: "Youth Controlled Fencing", duration: "6 min", exercise: "Balloon Pop Touch",
    coachNotes: "Each fencer has a balloon taped to their chest as the 'target.' Partners try to pop the opponent's balloon first using a simple lunge, while managing distance with footwork only (no blade contact rules needed).",
    purpose: "1) Makes the abstract idea of a 'target' concrete and visual for younger fencers. 2) The pop gives instant, satisfying feedback on a successful touch. 3) Keeps the drill fun while practicing real distance and timing skills." },
  { program: "Youth Class", block: "Youth Controlled Fencing", duration: "7 min", exercise: "Traffic Light Bout",
    coachNotes: "Mini bouts where the coach controls tempo like a traffic light: 'Green' means bout freely, 'Yellow' means slow motion only, 'Red' means freeze. Random color calls throughout.",
    purpose: "1) Builds control over one's own speed and impulses during a live exchange. 2) Keeps young fencers from just flailing at full speed the whole time. 3) Fun format that still teaches real bout awareness." },
  { program: "Youth Class", block: "Youth Controlled Fencing", duration: "6 min", exercise: "One-Two Touch Game",
    coachNotes: "Simplified bout: fencers may only attempt exactly one action each turn (either attack or defend), then reset to starting distance. Coach calls 'Go' for each turn.",
    purpose: "1) Breaks fencing down into single decisions, which is easier to process at this age than continuous free exchange. 2) Removes the chaos of constant back-and-forth so each attempt can be coached individually. 3) Builds the habit of a clean reset between actions." },
  { program: "Youth Class", block: "Youth Controlled Fencing", duration: "6 min", exercise: "Shadow Fencing Pairs",
    coachNotes: "Partners face off and 'fence' without touching — attacks and defenses are mimed with control, like a slow-motion shadow boxing match, focusing on distance and timing rather than contact.",
    purpose: "1) Introduces bout rhythm and pacing without any risk or intensity. 2) Great for shy or nervous young fencers not yet ready for contact bouts. 3) Builds timing sense that transfers directly into real fencing later." },
  { program: "Youth Class", block: "Youth Controlled Fencing", duration: "6 min", exercise: "Color Call Reaction",
    coachNotes: "Coach holds up colored cards or calls out colors; each color has an assigned action (e.g., red = retreat, blue = advance, green = lunge). Fencers react as fast as possible.",
    purpose: "1) Builds fast, reliable reaction to an external signal, a core fencing skill. 2) Fun, game-like format holds attention well at this age. 3) Easy to run for a whole group at once." },

  // Youth - Open Fencing (5)
  { program: "Youth Class", block: "Youth Open Fencing", duration: "8 min", exercise: "Mission Mini-Bouts",
    coachNotes: "Short, coach-supervised bouts where each fencer gets one simple mission for the round (e.g., 'only score with your feet moving forward'). Coach gives a thumbs up after each touch that met the mission.",
    purpose: "1) Gives structure and purpose to free bouting at an age where total freedom can be overwhelming. 2) Builds a sense of accomplishment tied to something specific, not just winning or losing. 3) Keeps the coach actively involved and encouraging throughout." },
  { program: "Youth Class", block: "Youth Open Fencing", duration: "8 min", exercise: "Point Collector Game",
    coachNotes: "Fencers bout in short rounds, collecting one small token or sticker for every clean touch scored the 'right' way (as defined by the coach that day). Most tokens at the end gets a shout-out.",
    purpose: "1) Turns free fencing into a rewarding, visible-progress game. 2) Reinforces whatever specific skill the coach highlights that session. 3) Builds positive associations with bouting at an age where confidence matters most." },
  { program: "Youth Class", block: "Youth Open Fencing", duration: "10 min", exercise: "Coach's Choice Bout",
    coachNotes: "Free bouting, but the coach occasionally calls out a fun modifier mid-bout (e.g., 'only backward touches count for the next 10 seconds', 'hop on one foot'). Keeps energy high and unpredictable.",
    purpose: "1) Keeps free fencing playful and prevents it from becoming repetitive at this age. 2) Builds adaptability — reacting to sudden new rules mid-action. 3) High fun factor keeps kids excited to fence again next class." },
  { program: "Youth Class", block: "Youth Open Fencing", duration: "10 min", exercise: "Team Relay Touches",
    coachNotes: "Fencers split into two teams; each fencer takes a short turn bouting, then tags in the next teammate after one touch is scored, relay-style. Team with the most total touches wins.",
    purpose: "1) Builds a sense of team spirit alongside individual skill. 2) Keeps engagement high since every fencer gets short, low-pressure turns. 3) Naturally limits each turn's length, keeping focus sharp." },
  { program: "Youth Class", block: "Youth Open Fencing", duration: "8 min", exercise: "Celebration Bout",
    coachNotes: "A fun, low-stakes closer bout to end class: every touch (from either fencer) gets a small celebration cheer from the group. No real winner is tracked — just positive energy.",
    purpose: "1) Ends the session on a high, positive note, which builds long-term enjoyment of the sport. 2) Removes pressure entirely so even nervous fencers finish class feeling good. 3) Reinforces a supportive team culture in the room." },
];
