import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Mapping of ageInMonths => { type => [valid details] }
 */
const VALID_DETAILS_MAP = {
  2: {
    Social: [
      'Calms down when spoken to or picked up',
      'Looks at your face',
      'Seems happy to see you when you walk up to her',
      'Smiles when you talk to or smile at her'
    ],
    Language: [
      'Makes sounds other than crying',
      'Reacts to loud sounds'
    ],
    Cognitive: [
      'Watches you as you move',
      'Looks at a toy for several seconds'
    ],
    Motor: [
      'Holds head up when on tummy',
      'Moves both arms and both legs',
      'Opens hands briefly'
    ]
  },

  4: {
    Social: [
      'Smiles on their own to get your attention',
      'Chuckles (not yet a full laugh) when you try to make them laugh',
      'Looks at you, moves, or makes sounds to get or keep your attention'
    ],
    Language: [
      'Makes cooing sounds like “ooo” and “aah”',
      'Makes sounds back when you talk to them',
      'Turns head toward the sound of your voice'
    ],
    Cognitive: [
      'If hungry, opens mouth when sees breast or bottle',
      'Looks at their hands with interest'
    ],
    Motor: [
      'Holds head steady without support when you are holding them',
      'Holds a toy when you put it in their hand',
      'Uses arms to swing at toys',
      'Brings hands to mouth',
      'Pushes up onto elbows/forearms when on tummy'
    ]
  },

  6: {
    Social: [
      'Knows familiar people',
      'Likes to look at self in a mirror',
      'Laughs'
    ],
    Language: [
      'Takes turns making sounds with you',
      'Blows “raspberries” (sticks tongue out and blows)',
      'Makes squealing noises'
    ],
    Cognitive: [
      'Puts things in mouth to explore them',
      'Reaches to grab a toy they want',
      'Closes lips to show they don’t want more food'
    ],
    Motor: [
      'Rolls from tummy to back',
      'Pushes up with straight arms when on tummy',
      'Leans on hands to support self when sitting'
    ]
  },

  9: {
    Social: [
      'Is shy, clingy, or fearful around strangers',
      'Shows several facial expressions, like happy, sad, angry, and surprised',
      'Looks when you call their name',
      'Reacts when you leave (looks, reaches for you, or cries)',
      'Smiles or laughs when you play peek-a-boo'
    ],
    Language: [
      'Makes a lot of different sounds like “mamamama” and “bababababa”',
      'Lifts arms up to be picked up'
    ],
    Cognitive: [
      'Looks for objects when dropped out of sight (like a spoon or toy)',
      'Bangs two things together'
    ],
    Motor: [
      'Gets to a sitting position by self',
      'Moves things from one hand to the other',
      'Uses fingers to “rake” food toward self',
      'Sits without support'
    ]
  },

  12: {
    Social: [
      'Plays games with you, like pat-a-cake'
    ],
    Language: [
      'Waves “bye-bye”',
      'Calls a parent “mama” or “dada” or another special name',
      'Understands “no” (pauses briefly or stops when you say it)'
    ],
    Cognitive: [
      'Puts something in a container, like a block in a cup',
      'Looks for things they see you hide, like a toy under a blanket'
    ],
    Motor: [
      'Pulls up to stand',
      'Walks, holding on to furniture',
      'Drinks from a cup without a lid, as you hold it',
      'Picks things up between thumb and pointer finger, like small bits of food'
    ]
  },

  15: {
    Social: [
      'Copies other children while playing, like taking toys out of a container when another child does',
      'Shows you an object they like',
      'Claps when excited',
      'Hugs stuffed doll or other toy',
      'Shows you affection (hugs, cuddles, or kisses you)'
    ],
    Language: [
      'Tries to say one or two words besides “mama” or “dada,” like “ba” for ball or “da” for dog',
      'Looks at a familiar object when you name it',
      'Follows directions given with both a gesture and words, like handing you a toy when you say, “Give me the toy” and hold out your hand',
      'Points to ask for something or to get help'
    ],
    Cognitive: [
      'Tries to use things the right way, like a phone, cup, or book',
      'Stacks at least two small objects, like blocks'
    ],
    Motor: [
      'Takes a few steps on their own',
      'Uses fingers to feed self some food'
    ]
  },

  18: {
    Social: [
      'Moves away from you, but looks to make sure you are close by',
      'Points to show you something interesting',
      'Puts hands out for you to wash them',
      'Looks at a few pages in a book with you',
      'Helps you dress them by pushing arm through sleeve or lifting up foot'
    ],
    Language: [
      'Tries to say three or more words besides “mama” or “dada”',
      'Follows one-step directions without any gestures, like giving you the toy when you say, “Give it to me.”'
    ],
    Cognitive: [
      'Copies you doing chores, like sweeping with a broom',
      'Plays with toys in a simple way, like pushing a toy car'
    ],
    Motor: [
      'Walks without holding on to anyone or anything',
      'Scribbles',
      'Drinks from a cup without a lid and may spill sometimes',
      'Feeds self with fingers',
      'Tries to use a spoon',
      'Climbs on and off a couch or chair without help'
    ]
  },

  24: {
    Social: [
      'Notices when others are hurt or upset, like pausing or looking sad when someone is crying',
      'Looks at your face to see how to react in a new situation'
    ],
    Language: [
      'Points to things in a book when you ask, like “Where is the bear?”',
      'Says at least two words together, like “More milk.”',
      'Points to at least two body parts when you ask',
      'Uses more gestures than just waving and pointing, like blowing a kiss or nodding yes'
    ],
    Cognitive: [
      'Holds something in one hand while using the other hand; for example, holding a container and taking the lid off',
      'Tries to use switches, knobs, or buttons on a toy',
      'Plays with more than one toy at the same time, like putting toy food on a toy plate'
    ],
    Motor: [
      'Kicks a ball',
      'Runs',
      'Walks (not climbs) up a few stairs with or without help',
      'Eats with a spoon'
    ]
  },

  30: {
    Social: [
      'Plays next to other children and sometimes plays with them',
      'Shows you what they can do by saying, “Look at me!”',
      'Follows simple routines when told, like helping to pick up toys when you say, “It’s clean-up time.”'
    ],
    Language: [
      'Says about 50 words',
      'Says two or more words together, with one action word, like “Doggie run”',
      'Names things in a book when you point and ask, “What is this?”',
      'Says words like “I,” “me,” or “we”'
    ],
    Cognitive: [
      'Uses things to pretend, like feeding a block to a doll as if it were food',
      'Shows simple problem-solving skills, like standing on a small stool to reach something',
      'Follows two-step instructions like “Put the toy down and close the door.”',
      'Shows they know at least one color, like pointing to a red crayon when you ask, “Which one is red?”'
    ],
    Motor: [
      'Uses hands to twist things, like turning doorknobs or unscrewing lids',
      'Takes some clothes off by themselves, like loose pants or an open jacket',
      'Jumps off the ground with both feet',
      'Turns book pages, one at a time, when you read to them'
    ]
  },

  36: {
    Social: [
      'Calms down within 10 minutes after you leave her, like at a childcare drop off',
      'Notices other children and joins them to play'
    ],
    Language: [
      'Talks with you in conversation using at least two back-and-forth exchanges',
      'Asks “who,” “what,” “where,” or “why” questions, like “Where is mommy/daddy?”',
      'Says what action is happening in a picture or book when asked, like “running,” “eating,” or “playing”',
      'Says first name when asked',
      'Talks well enough for others to understand, most of the time'
    ],
    Cognitive: [
      'Draws a circle when you show him how',
      'Avoids touching hot objects, like a stove, when you warn her'
    ],
    Motor: [
      'Strings items together, like large beads or macaroni',
      'Puts on some clothes by himself, like loose pants or a jacket',
      'Uses a fork'
    ]
  },

  48: {
    Social: [
      'Pretends to be something else during play (teacher, superhero, dog)',
      'Asks to go play with children if none are around, like “Can I play with Alex?”',
      'Comforts others who are hurt or sad, like hugging a crying friend',
      'Avoids danger, like not jumping from tall heights at the playground',
      'Likes to be a “helper”',
      'Changes behavior based on where she is (place of worship, library, playground)'
    ],
    Language: [
      'Says sentences with four or more words',
      'Says some words from a song, story, or nursery rhyme',
      'Talks about at least one thing that happened during her day, like “I played soccer.”',
      'Answers simple questions like “What is a coat for?” or “What is a crayon for?”'
    ],
    Cognitive: [
      'Names a few colors of items',
      'Tells what comes next in a well-known story',
      'Draws a person with three or more body parts'
    ],
    Motor: [
      'Catches a large ball most of the time',
      'Serves herself food or pours water, with adult supervision',
      'Unbuttons some buttons',
      'Holds crayon or pencil between fingers and thumb (not a fist)'
    ]
  },
  
  60: {
    Social: [
      'Follows rules or takes turns when playing games with other children',
      'Sings, dances, or acts for you',
      'Does simple chores at home, like matching socks or clearing the table after eating'
    ],
    Language: [
      'Tells a story she heard or made up with at least two events. For example, a cat was stuck in a tree and a firefighter saved it',
      'Answers simple questions about a book or story after you read or tell it to him',
      'Keeps a conversation going with more than three back-and-forth exchanges',
      'Uses or recognizes simple rhymes (bat-cat, ball-tall)'
    ],
    Cognitive: [
      'Counts to 10',
      'Names some numbers between 1 and 5 when you point to them',
      'Uses words about time, like “yesterday,” “tomorrow,” “morning,” or “night”',
      'Pays attention for 5 to 10 minutes during activities. For example, during story time or making arts and crafts (screen time does not count)',
      'Writes some letters in her name',
      'Names some letters when you point to them'
    ],
    Motor: [
      'Buttons some buttons',
      'Hops on one foot'
    ]
  }

};

const DevelopmentEntrySchema = new Schema({
  type: {
    type: String,
    enum: ['Social', 'Language', 'Cognitive', 'Motor'],
    required: true,
  },
  details: [{
    detail: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    dateCompleted: {
      type: Date,
    }
  }]
}, { _id: false });

const GrowthSchema = new Schema({
  childId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  ageInMonths: {
    type: Number,
    required: true,
  },
  entries: [DevelopmentEntrySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Custom validation for entries based on ageInMonths and type
GrowthSchema.pre('validate', function (next) {
  const ageMap = VALID_DETAILS_MAP[this.ageInMonths];
  if (!ageMap) {
    return next(new Error(`No valid growth data defined for age ${this.ageInMonths} months`));
  }

  for (const entry of this.entries) {
    const validDetails = ageMap[entry.type];
    if (!validDetails) {
      return next(new Error(`Invalid type "${entry.type}" at age ${this.ageInMonths} months`));
    }

    for (const detailObj of entry.details) {
      if (!validDetails.includes(detailObj.detail)) {
        return next(
          new Error(
            `Invalid detail "${detailObj.detail}" for type "${entry.type}" at age ${this.ageInMonths} months`
          )
        );
      }
    }
  }

  next();
});

export default mongoose.model('Growth', GrowthSchema);
