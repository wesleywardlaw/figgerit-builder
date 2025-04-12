import React from "react";
import { MatchResult } from "@/types/matchresult"; // Assuming this import exists

interface Saying {
  text: string;
}

interface FiggeritPuzzleProps {
  data: MatchResult[];
  saying: Saying;
}

const FiggeritPuzzle: React.FC<FiggeritPuzzleProps> = ({ data, saying }) => {
  return (
    <div className="p-4 space-y-6">
      {/* Clues and answer blocks */}
      <div className="grid grid-cols-2 gap-8">
        {data.map((item, idx) => (
          <React.Fragment key={item.riddle._id}>
            {/* Left: Clue */}
            <div className="text-right pr-4 font-medium text-lg flex items-center justify-end">
              {idx + 1}. {item.riddle.clue}
            </div>

            {/* Right: Answer blanks and positions */}
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  let letterPosIndex = 0;
                  return item.answer.split("").map((char, i) => {
                    if (char === " ") {
                      return <div key={i} className="w-3" />;
                    } else {
                      const number =
                        item.letterPositions?.[letterPosIndex]?.position + 1;
                      letterPosIndex++;
                      return (
                        <div key={i} className="flex flex-col items-center w-6">
                          <div className="h-8 border-b-2 border-gray-800 text-xl w-full text-center" />
                          <div className="text-sm text-gray-600">{number}</div>
                        </div>
                      );
                    }
                  });
                })()}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Saying layout */}
      <div className="mt-10">
        <div className="flex flex-wrap gap-2">
          {(() => {
            let positionCounter = 1;
            const words = saying.text.split(" ");
            return words.map((word, wordIdx) => (
              <div key={wordIdx} className="flex gap-1">
                {word.split("").map((char, i) => {
                  const pos = positionCounter++;
                  return (
                    <div key={i} className="flex flex-col items-center w-6">
                      <div className="h-8 border-b-2 border-gray-800 text-xl w-full text-center" />
                      <div className="text-sm text-gray-600">{pos}</div>
                    </div>
                  );
                })}
                {/* Spacer after word (except last) */}
                {wordIdx !== words.length - 1 && <div className="w-3" />}
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

export default FiggeritPuzzle;
