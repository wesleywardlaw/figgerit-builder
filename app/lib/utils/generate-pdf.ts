"use client"

import { jsPDF } from "jspdf"
import type { MatchResult } from "@/types/matchresult"
import html2canvas from "html2canvas"

interface Saying {
  text: string
}

export type PaperSize = "a4" | "letter"

// Improved wrapText function with better spacing control
function wrapText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  // Ensure text doesn't exceed 85 characters (from the schema)
  const truncatedText = text.length > 85 ? text.substring(0, 82) + "..." : text

  // Split the text into words
  const words = truncatedText.split(" ")
  let line = ""
  let currentY = y

  // Loop through each word
  for (let i = 0; i < words.length; i++) {
    // Test the width of the current line + the current word
    const testLine = line + words[i] + " "
    const testWidth = doc.getTextWidth(testLine)

    // If the width is greater than maxWidth, add a new line
    if (testWidth > maxWidth && i > 0) {
      doc.text(line, x, currentY)
      line = words[i] + " "
      currentY += lineHeight
    } else {
      line = testLine
    }
  }

  // Add the last line
  doc.text(line, x, currentY)

  // Return the final y position after all text is rendered
  return currentY
}

// Improved renderAnswer function with better spacing and overflow handling
function renderAnswer(
  doc: jsPDF,
  answer: string,
  letterPositions: { position: number }[],
  startX: number,
  y: number,
  maxWidth: number,
  paperSize: PaperSize = "a4",
): { endX: number; endY: number } {
  let letterPosIndex = 0
  const answerWords = answer.split(" ")
  let currentX = startX
  let currentY = y
  const lineStartX = startX
  let lineCount = 0 // Track number of lines used

  // More compact letter spacing to fit more content
  const letterSpacing = paperSize === "letter" ? 3.2 : 3.5  // Slightly reduced for A4
  const nonLetterSpacing = paperSize === "letter" ? 1.8 : 1.9  // Slightly reduced for A4
  const wordSpacing = paperSize === "letter" ? 1.8 : 1.9  // Slightly reduced for A4

  // Calculate total width needed for the answer
  let totalWidth = 0
  answerWords.forEach((word, wordIdx) => {
    // Ensure each word is at most 12 characters (from the schema)
    const processedWord = word.length > 12 ? word.substring(0, 12) : word

    processedWord.split("").forEach((char) => {
      totalWidth += isNotLetter(char) ? nonLetterSpacing : letterSpacing
    })
    if (wordIdx !== answerWords.length - 1) {
      totalWidth += wordSpacing // Space between words
    }
  })

  // Check if we need to wrap to a new line
  const needsWrapping = totalWidth > maxWidth

  for (let wordIdx = 0; wordIdx < answerWords.length; wordIdx++) {
    // Ensure each word is at most 12 characters (from the schema)
    const word = answerWords[wordIdx].length > 12 ? answerWords[wordIdx].substring(0, 12) : answerWords[wordIdx]

    const wordWidth = word.split("").reduce((width, char) => width + (isNotLetter(char) ? nonLetterSpacing : letterSpacing), 0)

    // Check if this word would exceed the max width
    if (needsWrapping && currentX - lineStartX + wordWidth > maxWidth && wordIdx > 0) {
      // Move to next line - reduced vertical spacing
      currentX = lineStartX
      currentY += paperSize === "letter" ? 5.5 : 6.0  // Reduced spacing for better space utilization
      lineCount++
    }

    const subscriptToNormalMap = {
      '₀': '0',
      '₁': '1',
      '₂': '2',
      '₃': '3',
      '₄': '4',
      '₅': '5',
      '₆': '6',
      '₇': '7',
      '₈': '8',
      '₉': '9',
    };

    function convertSubscript(char:string) {
      return subscriptToNormalMap[char as keyof typeof subscriptToNormalMap] || char;
    }

    function containsSubscript(str:string) {
      return /[\u2080-\u2089]/.test(str);
    }
    word.split("").forEach((char) => {
      if(containsSubscript(char)) {
        const convertedChar = convertSubscript(char)
        // Subscript character
        const fontSize = doc.getFontSize()
        doc.setFontSize(fontSize - 2) // Adjust font size for subscript
        doc.text(convertedChar, currentX, currentY + 1) // Adjust Y position for subscript
        currentX += nonLetterSpacing  
        doc.setFontSize(fontSize) // Reset font size
      }else if (isNotLetter(char)) {
        // Non-letter character
        doc.text(char, currentX, currentY)
        currentX += nonLetterSpacing
      } else {
        // Letter space with number - more compact
        const lineWidth = paperSize === "letter" ? 2.6 : 2.5  // Slightly reduced for A4
        doc.line(currentX, currentY, currentX + lineWidth, currentY)
        const position = letterPositions?.[letterPosIndex]?.position
        const number = position !== undefined ? position + 1 : ""
        doc.setFontSize(6)
        doc.text(number.toString(), currentX + lineWidth / 2, currentY + 2.5, { align: "center" })
        doc.setFontSize(paperSize === "letter" ? 7 : 8) // Smaller font for letter size
        letterPosIndex++
        currentX += letterSpacing
      }
    })

    if (wordIdx !== answerWords.length - 1) {
      currentX += wordSpacing // Space between words
    }
  }

  // Add minimal extra space after multi-line answers
  if (lineCount > 0) {
    currentY += paperSize === "letter" ? 1.5 : 2.0 // Minimal spacing to maximize content
  }

  return { endX: currentX, endY: currentY }
}

// Improved renderSaying function with better spacing control
function renderSaying(
  doc: jsPDF,
  saying: string,
  x: number,
  y: number,
  maxWidth: number,
  paperSize: PaperSize = "a4",
): { endX: number; endY: number } {
  const words = saying.split(" ")
  let positionCounter = 1
  let currentX = x
  let currentY = y
  const startX = x

  // More compact letter spacing for sayings to fit within borders
  const letterSpacing = paperSize === "letter" ? 3.2 : 3.5  // Slightly reduced for A4
  const nonLetterSpacing = paperSize === "letter" ? 1.8 : 1.9  // Slightly reduced for A4
  const wordSpacing = paperSize === "letter" ? 1.8 : 1.9  // Slightly reduced for A4

  for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
    // Ensure each word is at most 12 characters
    const word = words[wordIdx]

    // Calculate word width
    const wordWidth = word.split("").reduce((width, char) => {
      return width + (isNotLetter(char) ? nonLetterSpacing : letterSpacing)
    }, 0)

    // Check if we need to wrap to next line - include space for word separator
    if (currentX - startX + wordWidth + (wordIdx > 0 ? wordSpacing : 0) > maxWidth && wordIdx > 0) {
      currentX = startX
      currentY += paperSize === "letter" ? 5.5 : 6.0 // Reduced line height for more content
    }

    word.split("").forEach((char) => {
      if (isNotLetter(char)) {
        // Non-letter character
        doc.text(char, currentX, currentY)
        currentX += nonLetterSpacing
      } else {
        // Letter space with number - more compact for sayings
        const lineWidth = paperSize === "letter" ? 2.6 : 2.5  // Slightly reduced for A4
        doc.line(currentX, currentY, currentX + lineWidth, currentY)
        doc.setFontSize(6)
        doc.text(positionCounter.toString(), currentX + lineWidth / 2, currentY + 2.5, { align: "center" })
        doc.setFontSize(paperSize === "letter" ? 7 : 8) // Smaller font for letter size
        positionCounter++
        currentX += letterSpacing
      }
    })

    if (wordIdx !== words.length - 1) {
      currentX += wordSpacing // Space between words
    }
  }

  return { endX: currentX, endY: currentY + (paperSize === "letter" ? 2 : 2.5) }  // Reduced spacing after saying
}

// Helper function to check if a character is not a letter
function isNotLetter(char: string): boolean {
  return !/^[a-zA-Z]$/.test(char)
}

// Function to add a title page to the PDF
async function addTitlePage(doc: jsPDF, volumeNumber: number): Promise<void> {
  // Create a temporary div to render the title page
  const titlePageContainer = document.createElement("div")
  titlePageContainer.style.width = "210mm"
  titlePageContainer.style.height = "297mm"
  titlePageContainer.style.position = "fixed"
  titlePageContainer.style.top = "-9999px"
  titlePageContainer.style.left = "-9999px"
  document.body.appendChild(titlePageContainer)

  // Render the title page component to the temporary div
  const titlePageElement = document.createElement("div")
  titlePageElement.className =
    "relative w-full h-full flex justify-center items-center bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] overflow-hidden"

  // Create triangle background
  const triangleBackground = document.createElement("div")
  triangleBackground.className = "absolute w-full h-full flex justify-center items-center"

  for (let i = 0; i < 12; i++) {
    const triangle = document.createElement("div")
    triangle.className = "absolute w-0 h-0"
    triangle.style.borderLeft = "150px solid transparent"
    triangle.style.borderRight = "150px solid transparent"
    triangle.style.borderBottom = "260px solid"
    triangle.style.transform = `rotate(${i * 30}deg)`

    if (i % 3 === 0) {
      triangle.style.borderBottomColor = "rgba(255, 99, 71, 0.3)"
    } else if (i % 3 === 1) {
      triangle.style.borderBottomColor = "rgba(65, 105, 225, 0.3)"
    } else {
      triangle.style.borderBottomColor = "rgba(147, 112, 219, 0.3)"
    }

    triangleBackground.appendChild(triangle)
  }

  titlePageElement.appendChild(triangleBackground)

  // Create content
  const content = document.createElement("div")
  content.className = "relative z-10 text-center p-8"

  const title = document.createElement("h1")
  title.className = "text-5xl font-bold text-white m-0 flex flex-col items-center gap-4"
  title.style.textShadow = "0 2px 4px rgba(0, 0, 0, 0.5)"
  title.textContent = "Figgerits"

  const volume = document.createElement("span")
  volume.className = "text-2xl"
  volume.style.color = "#ffd700"
  volume.style.textShadow = "0 2px 4px rgba(0, 0, 0, 0.5)"
  volume.textContent = `Volume ${volumeNumber}`

  title.appendChild(volume)
  content.appendChild(title)
  titlePageElement.appendChild(content)

  titlePageContainer.appendChild(titlePageElement)

  try {
    // Convert the rendered component to canvas
    const canvas = await html2canvas(titlePageContainer, {
      scale: 2, // Higher scale for better quality
      backgroundColor: null,
    })

    // Add the canvas as an image to the PDF
    const imgData = canvas.toDataURL("image/png")
    doc.addImage(imgData, "PNG", 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight())
  } finally {
    // Clean up
    document.body.removeChild(titlePageContainer)
  }
}

// Updated generatePDF function with improved puzzle dimensions and spacing
export const generatePDF = async (
  puzzleSets: {
    data: MatchResult[]
    saying: Saying
  }[][],
  paperSize: PaperSize = "a4",
  includeTitlePage = false,
  volumeNumber = 1,
) => {
  // Create a new jsPDF instance with the selected paper size
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: paperSize,
  })

  // Add title page if requested
  if (includeTitlePage) {
    await addTitlePage(doc, volumeNumber)
    doc.addPage()
  }

  // Get page dimensions
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Maximize usable area with reduced margins
  const margin = paperSize === "letter" ? 10 : 8  // Reduced margins for both sizes
  const usableWidth = pageWidth - 2 * margin
  const usableHeight = pageHeight - 2 * margin - 12 // 12mm for header (reduced from 15)

  // Calculate puzzle dimensions - maximize space utilization
  const horizontalGap = paperSize === "letter" ? 4 : 3  // Reduced horizontal gap
  const puzzleWidth = (usableWidth - horizontalGap) / 2
  const puzzleHeight = paperSize === "letter" ? (usableHeight - 12) / 2 : (usableHeight - 8) / 2  // Reduced vertical gap
  const clueWidth = puzzleWidth * 0.43 // 43% of puzzle width for clues

  // Set font - smaller for Letter
  doc.setFont("helvetica")
  const baseFontSize = paperSize === "letter" ? 7 : 8

  // Process each page of puzzles
  puzzleSets.forEach((puzzles, pageIndex) => {
    // Add a new page for each page after the first
    if (pageIndex > 0) {
      doc.addPage()
    }

    // Add page title - reduced font size and position to maximize space
    doc.setFontSize(paperSize === "letter" ? 14 : 16)
    doc.text(`Figgerits - Page ${pageIndex + 1}`, pageWidth / 2, margin + 4, { align: "center" })

    // Define puzzle positions (2x2 grid) - maximized page usage
    const verticalGap = paperSize === "letter" ? 10 : 6  // Reduced vertical gap
    const positions = [
      { x: margin, y: margin + 12 }, // top-left (reduced Y position)
      { x: margin + puzzleWidth + horizontalGap, y: margin + 12 }, // top-right
      { x: margin, y: margin + 12 + puzzleHeight + verticalGap }, // bottom-left
      { x: margin + puzzleWidth + horizontalGap, y: margin + 12 + puzzleHeight + verticalGap }, // bottom-right
    ]

    // Process each puzzle (up to 4 per page)
    puzzles.slice(0, 4).forEach((puzzle, puzzleIndex) => {
      const { x, y } = positions[puzzleIndex]
      const answerX = x + clueWidth + 2 // X position for answer spaces
      const answerWidth = puzzleWidth - clueWidth - 4 // Width available for answers

      // Calculate the global puzzle number (across all pages)
      const globalPuzzleNumber = pageIndex * 4 + puzzleIndex + 1

      // Add puzzle title
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`Puzzle #${globalPuzzleNumber}`, x, y)

      // Draw puzzle border with improved placement
      doc.setDrawColor(200, 200, 200)
      doc.rect(x - 1, y - 6, puzzleWidth + 2, puzzleHeight)  // Slightly smaller border padding

      // Add clues and answer spaces - ensure exactly 7 clues
      doc.setFontSize(baseFontSize)
      doc.setFont("helvetica", "normal")

      // Ensure we have exactly 7 clues
      const cluesData = puzzle.data.slice(0, 7)

      let currentY = y + 6 // Starting Y position for first clue - moved up even more
      
      // Reserve space for saying at bottom with adequate writing space
      // Increased space between last clue and saying to give users more writing room
      const maxClueY = y + puzzleHeight - (paperSize === "letter" ? 20 : 22)

      // More efficient spacing between clues based on total number and available space
      const availableHeight = maxClueY - currentY
      // Minimum space needed per clue (reduced to maximize space)
      const minClueSpace = paperSize === "letter" ? 6.0 : 7.5
      // Calculate space allowed per clue
      const clueSpacing = Math.max(minClueSpace, availableHeight / cluesData.length - 1.0)

      cluesData.forEach((item, clueIndex) => {
        // Check if we're running out of vertical space
        if (currentY > maxClueY) {
          console.warn(`Puzzle ${puzzleIndex + 1} on page ${pageIndex + 1} is running out of vertical space.`)
          return // Skip this clue
        }

        // Add clue number
        doc.text(`${clueIndex + 1}.`, x, currentY)

        // Add clue text with wrapping (respecting 85 char limit)
        const clueText = item.riddle.clue.length > 85 ? item.riddle.clue.substring(0, 82) + "..." : item.riddle.clue
        const wrappedY = wrapText(doc, clueText, x + 5, currentY, clueWidth - 5, paperSize === "letter" ? 3.5 : 4)

        // Add answer spaces with overflow handling
        const { endY } = renderAnswer(doc, item.answer, item.letterPositions, answerX, currentY, answerWidth, paperSize)

        // Update Y position for next clue - use the maximum of wrapped text Y or answer Y
        // More compact spacing between clues to fit more content
        currentY = Math.max(wrappedY, endY) + (paperSize === "letter" ? 1 : 1.2) + 
                  (clueIndex < cluesData.length - 1 ? clueSpacing / 2 : 0);
      })

      // Add saying spaces at the bottom of each puzzle
      // Position saying with more space from the last clue to give users writing room
      // Added additional space between last clue and saying
      const sayingY = Math.min(
        currentY + (paperSize === "letter" ? 7 : 8), // Increased space for writing
        y + puzzleHeight - (paperSize === "letter" ? 9 : 10)
      )
      doc.text("Saying:", x, sayingY)

      // Render the saying with improved wrapping
      renderSaying(doc, puzzle.saying.text, x + 15, sayingY, puzzleWidth - 16, paperSize)  // Slightly reduced right padding
    })
  })

  // Generate answer pages
  generateAnswerPages(doc, puzzleSets, margin, pageWidth, pageHeight, paperSize)

  // Save the PDF with paper size in the filename
  doc.save(`figgerits-puzzles-${paperSize}.pdf`)
}

// Updated generateAnswerPages function with better layout for both paper sizes
function generateAnswerPages(
  doc: jsPDF,
  puzzleSets: {
    data: MatchResult[]
    saying: Saying
  }[][],
  margin: number,
  pageWidth: number,
  pageHeight: number,
  paperSize: PaperSize = "a4",
) {
  // Add a new page for answers
  doc.addPage()

  // Add answer page title
  doc.setFontSize(16)
  doc.text("Figgerits - Answers", pageWidth / 2, margin + 5, { align: "center" })

  // Set up for answers layout with two columns
  const columnWidth = (pageWidth - 2 * margin - 8) / 2 // 8mm gap between columns (reduced from 10)
  const leftColumnX = margin
  const rightColumnX = margin + columnWidth + 8

  // Track current position
  let currentColumn = 0 // 0 = left, 1 = right
  let currentY = margin + 18  // Moved up slightly
  const startY = currentY
  const maxY = pageHeight - margin // Maximum Y position before needing a new page

  // Adjust puzzle height estimate based on paper size
  const puzzleHeight = paperSize === "letter" ? 34 : 40

  // Flatten all puzzles into a single array
  const allPuzzles = puzzleSets.flatMap((puzzles, pageIndex) =>
    puzzles.slice(0, 4).map((puzzle, puzzleIndex) => ({
      puzzle,
      globalPuzzleNumber: pageIndex * 4 + puzzleIndex + 1,
    })),
  )

  // Process each puzzle for answers
  allPuzzles.forEach(({ puzzle, globalPuzzleNumber }) => {
    // Check if we need to move to the right column or a new page
    if (currentY + puzzleHeight > maxY) {
      if (currentColumn === 0) {
        // Move to right column
        currentColumn = 1
        currentY = startY
      } else {
        // Move to a new page
        doc.addPage()
        doc.setFontSize(16)
        doc.text("Figgerits - Answers (continued)", pageWidth / 2, margin + 5, { align: "center" })
        currentColumn = 0
        currentY = startY
      }
    }

    // Determine X position based on current column
    const x = currentColumn === 0 ? leftColumnX : rightColumnX

    // Add puzzle number
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`Figgerit #${globalPuzzleNumber}`, x, currentY)
    currentY += paperSize === "letter" ? 5 : 6

    // Add answers for each clue
    doc.setFontSize(paperSize === "letter" ? 9 : 10)
    doc.setFont("helvetica", "normal")

    // Ensure we have exactly 7 clues
    const cluesData = puzzle.data.slice(0, 7)

    function normalizeSubscriptDigits(str: string): string {
      const map: Record<string, string> = {
        '₀': '0',
        '₁': '1',
        '₂': '2',
        '₃': '3',
        '₄': '4',
        '₅': '5',
        '₆': '6',
        '₇': '7',
        '₈': '8',
        '₉': '9',
      };
      return str.replace(/[\u2080-\u2089]/g, char => map[char]);
    }

    cluesData.forEach((item, clueIndex) => {
      // Wrap long answers if needed
      const answerText = `${clueIndex + 1}. ${normalizeSubscriptDigits(item.answer)}`
      if (doc.getTextWidth(answerText) > columnWidth) {
        const wrappedY = wrapText(doc, answerText, x, currentY, columnWidth, paperSize === "letter" ? 3.5 : 4)
        currentY = wrappedY + (paperSize === "letter" ? 1.5 : 2)
      } else {
        doc.text(answerText, x, currentY)
        currentY += paperSize === "letter" ? 3.5 : 4
      }
    })

    // Add the solution (saying) with reduced spacing
    doc.setFontSize(paperSize === "letter" ? 9 : 10)
    doc.setFont("helvetica", "bold")
    const solutionLabel = "Solution:"
    doc.text(solutionLabel, x, currentY)

    // Calculate position for solution text (right after the label)
    const solutionX = x + doc.getTextWidth(solutionLabel) + 2

    // Add the solution text
    doc.setFont("helvetica", "normal")

    // Check if solution needs wrapping
    if (doc.getTextWidth(puzzle.saying.text) > columnWidth - doc.getTextWidth(solutionLabel) - 2) {
      // Move to next line for solution text if it's too long
      currentY += paperSize === "letter" ? 4 : 5
      const wrappedY = wrapText(doc, puzzle.saying.text, x, currentY, columnWidth, paperSize === "letter" ? 3.5 : 4)
      currentY = wrappedY + (paperSize === "letter" ? 6 : 7) // Add space after solution (reduced slightly)
    } else {
      // Solution fits on same line
      doc.text(puzzle.saying.text, solutionX, currentY)
      currentY += paperSize === "letter" ? 6 : 7 // Add space after solution (reduced slightly)
    }
  })
}