import React from "react"
import type { MatchResult } from "@/types/matchresult"

interface Saying {
  text: string
}

interface FiggeritGridProps {
  data: MatchResult[]
  saying: Saying
}

const isNotLetter = (char: string) => {
  return !/^[a-zA-Z]$/.test(char)
}


const FiggeritGrid: React.FC<FiggeritGridProps> = ({ data, saying }) => {
  return (
    <div className="p-1 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, idx) => (
          <React.Fragment key={item.riddle._id || idx}>
            <div className="text-left pl-1 font-medium text-[10px] flex items-start">
              <span className="mr-1 flex-shrink-0">{idx + 1}.</span>
              <span className="line-clamp-2">{item.riddle.clue}</span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap gap-1">
                {(() => {
                  let letterPosIndex = 0
                  const answerWords = item.answer.split(" ")

                  return answerWords.map((word, wordIdx) => {
                    return (
                      <div key={wordIdx} className="flex whitespace-nowrap gap-1">
                        {word.split("").map((char, i) => {
                          if (isNotLetter(char)) {
                            return (
                              <div key={i} className="flex flex-col items-center w-1">
                                <div className="h-4 text-[10px] w-full text-center">{char}</div>
                              </div>
                            )
                          } else {
                            // Get the position in the solution (adding 1 for 1-based indexing)
                            const position = item.letterPositions?.[letterPosIndex]?.position
                            const number = position !== undefined ? position + 1 : ""
                            letterPosIndex++
                            return (
                              <div key={i} className="flex flex-col items-center w-3">
                                <div className="h-4 border-b-2 border-gray-800 text-sm w-full text-center" />
                                <div className="text-[10px] text-gray-600">{number.toString()}</div>
                              </div>
                            )
                          }
                        })}
                        {wordIdx !== answerWords.length - 1 && <div className="w-1" />}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Display the solution spaces at the bottom */}
      <div className="flex flex-wrap gap-1 mt-4">
        {(() => {
          // Create a map of position to letter for the solution
          const positionMap = new Map<number, string>()

          // Fill the position map from all clues
          data.forEach((item) => {
            let letterIndex = 0
            item.answer.split("").forEach((char) => {
              if (!isNotLetter(char)) {
                const position = item.letterPositions?.[letterIndex]?.position
                if (position !== undefined) {
                  positionMap.set(position, char)
                }
                letterIndex++
              }
            })
          })

          const words = saying.text.split(" ")
          let currentPosition = 0

          return words.map((word, wordIdx) => {
            // Process word to ensure it's not longer than 12 characters
            return (
              <div key={wordIdx} className="flex whitespace-nowrap gap-1">
                {word.split("").map((char, i) => {
                  if (isNotLetter(char)) {
                    return (
                      <div key={i} className="flex flex-col items-center w-1">
                        <div className="h-4 text-sm w-full text-center">{char}</div>
                      </div>
                    )
                  }

                  const position = currentPosition
                  currentPosition++

                  return (
                    <div key={i} className="flex flex-col items-center w-3">
                      <div className="h-4 border-b-2 border-gray-800 text-sm w-full text-center" />
                      <div className="text-[10px] text-gray-600">{(position + 1).toString()}</div>
                    </div>
                  )
                })}
                {wordIdx !== words.length - 1 && <div className="w-1" />}
              </div>
            )
          })
        })()}
      </div>
    </div>
  )
}

export default FiggeritGrid
