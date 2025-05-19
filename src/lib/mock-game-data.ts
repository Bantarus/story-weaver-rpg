
import type { GameData } from '@/context/GameContext';

export const mockGameData: GameData = {
  title: "The Mockingbird's Secret",
  startSceneId: "intro",
  scenes: {
    "intro": {
      id: "intro",
      title: "A Mysterious Note",
      text: "You find a crumpled note on your doorstep. It reads: 'The Mockingbird knows the secret of the Whispering Willow. Seek it at dusk.'\nThe wind howls, carrying a faint, melodic tune.",
      choices: [
        { text: "Investigate the Whispering Willow", nextNodeId: "willow_approach" },
        { text: "Ignore the note and go about your day", nextNodeId: "ignore_note" },
        { text: "Try to find who left the note", nextNodeId: "find_messenger" }
      ],
      visualHint: "crumpled paper old doorstep twilight",
      soundEffect: "wind howling distant tune"
    },
    "willow_approach": {
      id: "willow_approach",
      title: "The Whispering Willow",
      text: "You arrive at the ancient Whispering Willow as dusk settles. Its long branches sway, and you hear a soft, bird-like call from within its leaves. The air is thick with an old magic.",
      choices: [
        { text: "Call out to the Mockingbird", nextNodeId: "call_mockingbird" },
        { text: "Silently climb the tree", nextNodeId: "climb_willow" }
      ],
      visualHint: "ancient tree dusk mysterious glow",
      soundEffect: "leaves rustling soft bird call"
    },
    "ignore_note": {
      id: "ignore_note",
      title: "A Day Like Any Other",
      text: "You decide the note is probably a prank and go about your usual business. The day passes uneventfully, but a nagging feeling of a missed opportunity lingers.",
      choices: [],
      isEnding: true,
      endingType: "missed_opportunity",
      visualHint: "mundane town street normal day",
      soundEffect: "distant town noises"
    },
    "find_messenger": {
      id: "find_messenger",
      title: "Searching for Clues",
      text: "You look around for any sign of who might have left the note. You spot a small, colorful feather snagged on your door frame. It seems familiar...",
      choices: [
        { text: "Take the feather and head to the Willow", nextNodeId: "willow_approach_feather" },
        { text: "Dismiss it and go inside", nextNodeId: "ignore_note" }
      ],
      visualHint: "colorful feather door frame detective",
      soundEffect: "footsteps nearby"
    },
    "call_mockingbird": {
        id: "call_mockingbird",
        title: "A Melodious Response",
        text: "You call out, 'Mockingbird, I seek your wisdom!' A beautiful bird with iridescent feathers flutters down to a low branch. It chirps, 'The secret lies not in the roots, but in the highest song.' It then flies off towards the old tower.",
        choices: [
            { text: "Follow the bird to the old tower", nextNodeId: "tower_approach" },
            { text: "Search the roots of the Willow anyway", nextNodeId: "search_roots_fail" }
        ],
        visualHint: "iridescent bird ancient tree magical",
        soundEffect: "bird song clear melody"
    },
    "climb_willow": {
        id: "climb_willow",
        title: "A Perilous Ascent",
        text: "You begin to climb the gnarled branches of the Whispering Willow. It's a tricky climb. Halfway up, you find a small, intricately carved wooden bird. It feels warm to the touch.",
        choices: [
            { text: "Continue climbing higher", nextNodeId: "willow_top" },
            { text: "Take the wooden bird and climb down", nextNodeId: "wooden_bird_ending" }
        ],
        visualHint: "climbing tree gnarled branches precarious",
        soundEffect: "straining wood heavy breathing"
    },
    "willow_approach_feather": {
      id: "willow_approach_feather",
      title: "To the Willow with a Token",
      text: "Clutching the feather, you make your way to the Whispering Willow. The feather hums faintly in your hand as you get closer. The tree seems to welcome you.",
      choices: [
        { text: "Hold up the feather and speak to the tree", nextNodeId: "feather_speak_willow" },
        { text: "Silently observe the tree", nextNodeId: "willow_approach" } // Could loop back or lead to a variation
      ],
      visualHint: "glowing feather ancient tree twilight",
      soundEffect: "humming sound rustling leaves"
    },
    "tower_approach": {
        id: "tower_approach",
        title: "The Silent Tower",
        text: "You arrive at the crumbling old tower. It stands silhouetted against the fading light. The Mockingbird is nowhere to be seen, but a faint light glows from a high window.",
        choices: [
            { text: "Try to find a way into the tower", nextNodeId: "enter_tower" },
            { text: "Decide it's too dangerous and leave", nextNodeId: "tower_leave_ending" }
        ],
        visualHint: "old tower crumbling stone faint light",
        soundEffect: "distant owl hoot wind through cracks"
    },
    "search_roots_fail": {
        id: "search_roots_fail",
        title: " fruitless Search",
        text: "You spend a long time searching among the gnarled roots of the Willow, but find nothing of interest. The Mockingbird's song seems to mock you from afar.",
        choices: [],
        isEnding: true,
        endingType: "failure_to_listen",
        visualHint: "dark roots tangled empty handed",
        soundEffect: "rustling leaves distant mockingbird song"
    },
     "willow_top": {
        id: "willow_top",
        title: "The Highest Point",
        text: "You reach the very top of the Whispering Willow. The view is breathtaking. As the last ray of sun fades, you hear the Mockingbird's song clearly. It weaves a melody that fills you with ancient knowledge about the land.",
        choices: [],
        isEnding: true,
        endingType: "wisdom_gained_peaceful",
        visualHint: "treetop view sunset panoramic serene",
        soundEffect: "beautiful birdsong gentle wind"
    },
    "wooden_bird_ending": {
        id: "wooden_bird_ending",
        title: "A Curious Trinket",
        text: "You climb down with the wooden bird. It feels strangely comforting. You may not know the Willow's greatest secret, but you have a unique artifact and a story to tell.",
        choices: [],
        isEnding: true,
        endingType: "minor_discovery_content",
        visualHint: "wooden bird artifact hand curious",
        soundEffect: "soft chirping from wooden bird (illusion?)"
    },
    "feather_speak_willow": {
        id: "feather_speak_willow",
        title: "The Willow's Welcome",
        text: "Holding the feather aloft, you speak to the Willow. The tree's leaves rustle in response, and a hidden path opens at its base, glowing faintly.",
        choices: [
            { text: "Enter the hidden path", nextNodeId: "secret_path" },
            { text: "Hesitate and observe further", nextNodeId: "willow_approach" }
        ],
        visualHint: "glowing path tree base magic feather",
        soundEffect: "deep rustle magical chime"
    },
    "enter_tower": {
        id: "enter_tower",
        title: "Inside the Tower",
        text: "You find a loose stone and manage to create an opening into the tower's base. Inside, it's dusty and filled with ancient tomes. A spiral staircase leads upwards towards the light.",
        choices: [
            { text: "Ascend the staircase", nextNodeId: "tower_top_secret" },
            { text: "Search the ground floor for lore", nextNodeId: "tower_lore" }
        ],
        visualHint: "dusty tower interior ancient books spiral staircase",
        soundEffect: "echoing footsteps crumbling stone"
    },
    "tower_leave_ending": {
        id: "tower_leave_ending",
        title: "A Prudent Retreat",
        text: "The tower looks too foreboding. You decide discretion is the better part of valor and head home. The secret of the Mockingbird remains unknown to you.",
        choices: [],
        isEnding: true,
        endingType: "prudence_mystery_unsolved",
        visualHint: "dark tower distant view retreating figure",
        soundEffect: "wind howling fading footsteps"
    },
    "secret_path": {
        id: "secret_path",
        title: "The Heart of the Willow",
        text: "The path leads you to a serene grotto beneath the Willow. In the center, a pool of water glows, and the Mockingbird's song echoes, revealing the history of the forest and its guardians.",
        choices: [],
        isEnding: true,
        endingType: "true_secret_revealed_harmony",
        visualHint: "glowing grotto magical pool ancient carvings",
        soundEffect: "ethereal song water dripping"
    },
    "tower_top_secret": {
        id: "tower_top_secret",
        title: "The Mockingbird's Sanctum",
        text: "At the top of the tower, you find a sun-drenched room. The Mockingbird is there, perched on a pile of ancient scrolls. It reveals to you that the 'highest song' is the accumulated wisdom of ages, and tasks you with protecting it.",
        choices: [],
        isEnding: true,
        endingType: "guardian_chosen_epic",
        visualHint: "sunlit room ancient scrolls wise bird panoramic view",
        soundEffect: "majestic bird song rustling parchment"
    },
    "tower_lore": {
        id: "tower_lore",
        title: "Whispers of the Past",
        text: "You spend time poring over the books on the ground floor. You learn much about local history and forgotten legends, though the Mockingbird's specific secret remains elusive for now.",
        choices: [
            { text: "Continue upwards", nextNodeId: "tower_top_secret" },
            { text: "Leave with your newfound knowledge", nextNodeId: "lore_master_ending" }
        ],
        visualHint: "ancient library dusty books candlelight",
        soundEffect: "pages turning quiet contemplation"
    },
    "lore_master_ending": {
      id: "lore_master_ending",
      title: "A Scholar's Reward",
      text: "You leave the tower, your mind filled with new stories and historical insights. You may not have solved the ultimate mystery, but you've become a keeper of valuable lore.",
      choices: [],
      isEnding: true,
      endingType: "knowledge_gained_scholarly",
      visualHint: "carrying books thoughtful expression library",
      soundEffect: "satisfied sigh quill scratching on parchment"
    }
  }
};
