import FiggeritPuzzle from "../components/FiggeritPuzzle";

const data = [
  {
    answer: "retinue",
    letterPositions: [
      {
        letter: "R",
        position: 7,
      },
      {
        letter: "E",
        position: 15,
      },
      {
        letter: "T",
        position: 2,
      },
      {
        letter: "I",
        position: 1,
      },
      {
        letter: "N",
        position: 10,
      },
      {
        letter: "U",
        position: 5,
      },
      {
        letter: "E",
        position: 19,
      },
    ],
    riddle: {
      clue: "a group of people following a leader",
      word: "retinue",
      _id: "67af94a2018c6e0f91df59f7",
    },
  },
  {
    answer: "Bill Watterson",
    letterPositions: [
      {
        letter: "B",
        position: 23,
      },
      {
        letter: "I",
        position: 9,
      },
      {
        letter: "L",
        position: 12,
      },
      {
        letter: "L",
        position: 24,
      },
      {
        letter: "W",
        position: 0,
      },
      {
        letter: "A",
        position: 8,
      },
      {
        letter: "T",
        position: 6,
      },
      {
        letter: "T",
        position: 2,
      },
      {
        letter: "E",
        position: 21,
      },
      {
        letter: "R",
        position: 16,
      },
      {
        letter: "S",
        position: 17,
      },
      {
        letter: "O",
        position: 4,
      },
      {
        letter: "N",
        position: 18,
      },
    ],
    riddle: {
      clue: "author of Calvin and Hobbes",
      word: "Bill Watterson",
      _id: "67aa5f30f7a63ff04cd1cd9d",
    },
  },
  {
    answer: "film noir",
    letterPositions: [
      {
        letter: "F",
        position: 11,
      },
      {
        letter: "I",
        position: 1,
      },
      {
        letter: "L",
        position: 12,
      },
      {
        letter: "M",
        position: 27,
      },
      {
        letter: "N",
        position: 10,
      },
      {
        letter: "O",
        position: 13,
      },
      {
        letter: "I",
        position: 9,
      },
      {
        letter: "R",
        position: 22,
      },
    ],
    riddle: {
      clue: "cynical movie commonly featuring a hard boiled detective and black and white",
      word: "film noir",
      _id: "67ad16ccf7a63ff04cd1ce09",
    },
  },
  {
    answer: "enervate",
    letterPositions: [
      {
        letter: "E",
        position: 15,
      },
      {
        letter: "N",
        position: 10,
      },
      {
        letter: "E",
        position: 19,
      },
      {
        letter: "R",
        position: 7,
      },
      {
        letter: "V",
        position: 20,
      },
      {
        letter: "A",
        position: 8,
      },
      {
        letter: "T",
        position: 2,
      },
      {
        letter: "E",
        position: 21,
      },
    ],
    riddle: {
      clue: "to make someone feel drained",
      word: "enervate",
      _id: "67af93e3018c6e0f91df59dd",
    },
  },
  {
    answer: "rose",
    letterPositions: [
      {
        letter: "R",
        position: 7,
      },
      {
        letter: "O",
        position: 25,
      },
      {
        letter: "S",
        position: 17,
      },
      {
        letter: "E",
        position: 15,
      },
    ],
    riddle: {
      clue: "by any other name is just as sweet",
      word: "rose",
      _id: "67ad179df7a63ff04cd1ce11",
    },
  },
  {
    answer: "Watson",
    letterPositions: [
      {
        letter: "W",
        position: 14,
      },
      {
        letter: "A",
        position: 8,
      },
      {
        letter: "T",
        position: 2,
      },
      {
        letter: "S",
        position: 17,
      },
      {
        letter: "O",
        position: 26,
      },
      {
        letter: "N",
        position: 10,
      },
    ],
    riddle: {
      clue: "Holmes' partner",
      word: "Watson",
      _id: "67abb683f7a63ff04cd1cdba",
    },
  },
  {
    answer: "blue-whale",
    letterPositions: [
      {
        letter: "B",
        position: 23,
      },
      {
        letter: "L",
        position: 12,
      },
      {
        letter: "U",
        position: 5,
      },
      {
        letter: "E",
        position: 15,
      },
      {
        letter: "W",
        position: 0,
      },
      {
        letter: "H",
        position: 3,
      },
      {
        letter: "A",
        position: 8,
      },
      {
        letter: "L",
        position: 24,
      },
      {
        letter: "E",
        position: 19,
      },
    ],
    riddle: {
      clue: "largest mammal",
      word: "blue-whale",
      _id: "67abb5a9f7a63ff04cd1cdb4",
    },
  },
];

const saying = {
  text: "without rain, flower-s never bloom!",
  _id: "67afa334018c6e0f91df6a0f",
};


const Test = () => {
    return(
        <>
        <FiggeritPuzzle data={data} saying={saying} />
        </>
    )
}

export default Test;