import React from "react";

import { MatchResult } from "@/types/matchresult";

interface Saying {
  text: string;
}

interface FiggeritPuzzleProps {
  data: MatchResult[];
  saying: Saying;
}

const isNotLetter = (char: string) => {
  return !/^[a-zA-Z]$/.test(char);
};

const FiggeritPuzzle: React.FC<FiggeritPuzzleProps> = ({ data, saying }) => {
  return (
    <div className="p-1 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, idx) => (
          <React.Fragment key={item.riddle._id}>
            <div className="text-left pl-1 font-medium text-[10px] flex items-center">
              {idx + 1}. {item.riddle.clue}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap gap-1">
                {(() => {
                  let letterPosIndex = 0;
                  const answerWords = item.answer.split(" ");

                  return answerWords.map((word, wordIdx) => (
                    <div key={wordIdx} className="flex whitespace-nowrap gap-1">
                      {word.split("").map((char, i) => {
                        if (isNotLetter(char)) {
                          return (
                            <div
                              key={i}
                              className="flex flex-col items-center w-1"
                            >
                              <div className="h-4 text-[10px] w-full text-center">
                                {char}
                              </div>
                            </div>
                          );
                        } else {
                          const number =
                            item.letterPositions?.[letterPosIndex]?.position +
                            1;
                          letterPosIndex++;
                          return (
                            <div
                              key={i}
                              className="flex flex-col items-center w-3"
                            >
                              <div className="h-4 border-b-2 border-gray-800 text-sm w-full text-center" />
                              <div className="text-[10px] text-gray-600">
                                {number}
                              </div>
                            </div>
                          );
                        }
                      })}
                      {wordIdx !== answerWords.length - 1 && (
                        <div className="w-1" />
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {(() => {
          let positionCounter = 1;
          const words = saying.text.split(" ");
          return words.map((word, wordIdx) => (
            <div key={wordIdx} className="flex whitespace-nowrap gap-1">
              {word.split("").map((char, i) => {
                if (isNotLetter(char)) {
                  return (
                    <div key={i} className="flex flex-col items-center w-1">
                      <div className="h-4 text-sm w-full text-center">
                        {char}
                      </div>
                    </div>
                  );
                }
                const pos = positionCounter++;
                return (
                  <div key={i} className="flex flex-col items-center w-3">
                    <div className="h-4 border-b-2 border-gray-800 text-sm w-full text-center" />
                    <div className="text-[10px] text-gray-600">{pos}</div>
                  </div>
                );
              })}
              {wordIdx !== words.length - 1 && <div className="w-1" />}
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

export default FiggeritPuzzle;
