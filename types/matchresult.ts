export interface LetterPosition {
    letter: string;
    position: number;
}

export interface MatchResult {
    answer: string;
    letterPositions: LetterPosition[];
    riddle: {
        clue: string;
        word: string;
        _id: string;
    };
}