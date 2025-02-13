import { LetterPosition, MatchResult } from "@/types/matchresult";


export function findCompleteFiggerit(
    riddles: Array<{ clue: string; word: string; _id: string }>, 
    saying: string
): MatchResult[] | null {
    const cleanSaying = saying.toUpperCase().replace(/[^A-Z]/g, '');
    const sayingLength = cleanSaying.length;
    
    // Track which positions are still available
    const availablePositions = new Set<number>();
    for (let i = 0; i < sayingLength; i++) {
        availablePositions.add(i);
    }
    
    // Create letter map for quick lookups
    const letterMap = new Map<string, number[]>();
    [...cleanSaying].forEach((letter, index) => {
        if (!letterMap.has(letter)) {
            letterMap.set(letter, []);
        }
        letterMap.get(letter)?.push(index);
    });
    
    const solution: MatchResult[] = [];
    
    // Try each riddle as a potential part of the solution
    for (const riddle of riddles) {
        // Skip if we already have 7 words
        if (solution.length >= 7) break;
        
        const cleanAnswer = riddle.word.toUpperCase().replace(/[^A-Z]/g, '');
        
        // Quick check if word might work (has all needed letters)
        if (![...cleanAnswer].every(letter => letterMap.has(letter))) {
            continue;
        }
        
        // Try to find valid positions for this word
        const letterPositions: LetterPosition[] = [];
        const tempUsed = new Set<number>();
        let valid = true;
        
        for (const letter of cleanAnswer) {
            const possiblePositions = letterMap.get(letter) || [];
            let foundPosition = false;
            
            for (const pos of possiblePositions) {
                // Check if position is available and the letter at this position matches
                if (availablePositions.has(pos) && !tempUsed.has(pos) && cleanSaying[pos] === letter) {
                    letterPositions.push({ letter, position: pos });
                    tempUsed.add(pos);
                    foundPosition = true;
                    break;
                }
            }
            
            if (!foundPosition) {
                valid = false;
                break;
            }
        }
        
        if (valid) {
            // Add this word to our solution
            solution.push({
                answer: riddle.word,
                letterPositions: letterPositions.sort((a, b) => a.position - b.position),
                riddle: {
                    clue: riddle.clue,
                    word: riddle.word,
                    _id: riddle._id
                }
            });
            
            // Remove used positions from available pool
            letterPositions.forEach(lp => availablePositions.delete(lp.position));
        }
    }
    
    // Check if we have a complete solution
    const totalPositionsUsed = solution
        .flatMap(match => match.letterPositions)
        .length;
    console.log("solution", solution)    
    if (solution.length === 7 && totalPositionsUsed === sayingLength) {
        return solution;
    }
    
    return null;
}