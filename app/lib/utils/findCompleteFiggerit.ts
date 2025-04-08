import { LetterPosition, MatchResult } from "@/types/matchresult";




export function findCompleteFiggerit(
    riddles: Array<{ clue: string; word: string; _id: string }>, 
    saying: string
): MatchResult[] | null {
    const cleanSaying = saying.toUpperCase().replace(/[^A-Z]/g, '');
    const sayingLetters = new Set(cleanSaying);
    
    console.log(`Processing saying: "${saying}" (cleaned: "${cleanSaying}")`);
    console.log(`Saying length: ${cleanSaying.length}`);
    
    const solution: MatchResult[] = [];
    let usedLetters = new Set<string>();
    let usedPositions = new Set<number>();
    const letterMap = new Map<string, number[]>();
    
    // Create a map of letters to their positions in the saying
    [...cleanSaying].forEach((letter, index) => {
        if (!letterMap.has(letter)) {
            letterMap.set(letter, []);
        }
        letterMap.get(letter)?.push(index);
    });
    
    console.log(`Letter map: ${JSON.stringify(Object.fromEntries(letterMap))}`);
    
    // Try to find a solution that uses all positions
    for (const riddle of riddles) {
        if (solution.length >= 7) break;
        
        const cleanAnswer = riddle.word.toUpperCase().replace(/[^A-Z]/g, '');
        const answerLetters = new Set(cleanAnswer);
        
        // Ensure word only contains letters from the saying
        if (![...answerLetters].every(letter => sayingLetters.has(letter))) {
            continue;
        }
        
        const letterPositions: LetterPosition[] = [];
        const tempUsed = new Set<number>();
        
        // Try to use unused positions first
        for (const letter of cleanAnswer) {
            const possiblePositions = letterMap.get(letter) || [];
            
            // First try to find an unused position
            let position = possiblePositions.find(pos => !usedPositions.has(pos) && !tempUsed.has(pos));
            
            // If no unused position is available, use any available position
            if (position === undefined) {
                position = possiblePositions.find(pos => !tempUsed.has(pos)) ?? possiblePositions[0];
            }
            
            if (position !== undefined) {
                letterPositions.push({ letter, position });
                tempUsed.add(position);
            }
        }
        
        // Add this word to our solution
        solution.push({
            answer: riddle.word,
            letterPositions,
            riddle: {
                clue: riddle.clue,
                word: riddle.word,
                _id: riddle._id
            }
        });
        
        // Track used letters and positions
        cleanAnswer.split('').forEach(letter => usedLetters.add(letter));
        letterPositions.forEach(lp => usedPositions.add(lp.position));
        
        console.log(`Added word: ${riddle.word}, Used positions: ${usedPositions.size}/${cleanSaying.length}`);
    }
    
    // Ensure all letters from the saying are used at least once AND all positions are used
    const allPositionsUsed = usedPositions.size === cleanSaying.length;
    const allLettersUsed = [...sayingLetters].every(letter => usedLetters.has(letter));
    
    console.log(`All positions used: ${allPositionsUsed} (${usedPositions.size}/${cleanSaying.length})`);
    console.log(`All letters used: ${allLettersUsed}`);
    console.log(`Solution length: ${solution.length}`);
    
    if (allLettersUsed && allPositionsUsed && solution.length === 7) {
        console.log("Found a valid solution!");
        return solution;
    }
    
    console.log("No valid solution found");
    return null;
}

