import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Mapping of ageInMonths => { type => [valid details] }
 */
const VALID_DETAILS_MAP = {
  2: {
    Social: ['Begins to smile at people'],
    Language: ['Coos, makes gurgling sounds'],
    Cognitive: ['Pays attention to faces'],
    Motor: ['Can hold head up and begins to push up when lying on tummy'],
  },
  4: {
    Social: ['Smiles spontaneously, especially at people'],
    Language: ['Babbles with expression'],
    Cognitive: ['Reaches for toy with one hand'],
    Motor: ['Pushes down on legs when feet are on a hard surface'],
  },
  6: {
    Social: ['Knows familiar faces and begins to know if someone is a stranger'],
    Language: ['Responds to own name'],
    Cognitive: ['Looks around at things nearby'],
    Motor: ['Rolls over in both directions (front to back, back to front)'],
  },
  9: {
    Social: ['May be afraid of strangers'],
    Language: ['Understands "no"'],
    Cognitive: ['Watches the path of something as it falls'],
    Motor: ['Stands, holding on'],
  },
  12: {
    Social: ['Cries when mom or dad leaves'],
    Language: ['Says “mama” and “dada” and exclamations like “uh-oh!”'],
    Cognitive: ['Explores things in different ways, like shaking, banging, throwing'],
    Motor: ['Pulls up to stand, walks holding on to furniture'],
  },
  15: {
    Social: ['Shows you affection (hugs, cuddles, etc.)'],
    Language: ['Tries to say words you say'],
    Cognitive: ['Shows interest in a toy or object'],
    Motor: ['Walks without help'],
  },
  18: {
    Social: ['Plays simple pretend, such as feeding a doll'],
    Language: ['Says several single words'],
    Cognitive: ['Points to get the attention of others'],
    Motor: ['Walks up steps and runs'],
  },
  24: {
    Social: ['Shows more and more independence'],
    Language: ['Uses 2 to 4 word sentences'],
    Cognitive: ['Begins to sort shapes and colors'],
    Motor: ['Kicks a ball'],
  },
  36: {
    Social: ['Takes turns in games'],
    Language: ['Follows instructions with 2 or 3 steps'],
    Cognitive: ['Can work toys with buttons, levers, and moving parts'],
    Motor: ['Climbs well'],
  },
  48: {
    Social: [
      'Prefers to play with other children than by themselves',
      'Cooperates with other children',
      'Talks about what they like and what they are interested in'
    ],
    Language: [
      'Can say first and last name',
      'Sings a song or says a poem from memory',
      'Tells stories'
    ],
    Cognitive: [
      'Names some colors and some numbers',
      'Understands the idea of “same” and “different”',
      'Can draw a person with 2 to 4 body parts'
    ],
    Motor: [
      'Hops and stands on one foot up to 2 seconds',
      'Catches a bounced ball most of the time',
      'Pours, cuts with supervision, and mashes own food'
    ]
  },
  60: {
    Social: [
      'Wants to please friends',
      'Likes to sing, dance, and act',
      'Can tell what’s real and what’s make-believe'
    ],
    Language: [
      'Speaks very clearly',
      'Tells a simple story using full sentences',
      'Uses future tense (e.g., “Grandma will be here.”)'
    ],
    Cognitive: [
      'Can count 10 or more things',
      'Can print some letters or numbers',
      'Knows about things used every day (money, food, appliances)'
    ],
    Motor: [
      'Stands on one foot for 10 seconds or longer',
      'Hops; may be able to skip',
      'Can do a somersault'
    ]
  }

};

const DevelopmentEntrySchema = new Schema({
  type: {
    type: String,
    enum: ['Social', 'Language', 'Cognitive', 'Motor'],
    required: true,
  },
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
    if (!validDetails || !validDetails.includes(entry.detail)) {
      return next(
        new Error(
          `Invalid detail "${entry.detail}" for type "${entry.type}" at age ${this.ageInMonths} months`
        )
      );
    }
  }

  next();
});

export default mongoose.model('Growth', GrowthSchema);
