"use client";

import { useState, useRef, useEffect } from "react";

import { getFiggeritsByVolume } from "../lib/actions";
import { Figgerit } from "@/types/figgerit";
import FiggeritGrid from "../components/FiggeritGrid";
import TitlePage from "../components/TitlePage";
import { generatePDF, type PaperSize } from "../lib/utils/generate-pdf";

// Utility function to chunk puzzles into groups
const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
};

const Generate = () => {
  const [figgerits, setFiggerits] = useState<Figgerit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [includeTitlePage, setIncludeTitlePage] = useState(false)
  const [paperSize, setPaperSize] = useState<PaperSize>("letter")
  const [isGenerating, setIsGenerating] = useState(false)
  const [volume, setVolume] = useState<string>("1");
  const answerPageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const ANSWERS_PER_PAGE = 12; 

  useEffect(() => {
    if (figgerits.length > 0) {
      const numAnswerPages = Math.ceil(figgerits.length / ANSWERS_PER_PAGE);
      answerPageRefs.current = Array(numAnswerPages).fill(null);
    }
  }, [figgerits]);

  const fetchFiggerits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getFiggeritsByVolume(parseInt(volume));

      if (result.success && result.figgerits) {
        // Basic validation to ensure we have data
        if (result.figgerits.length === 0) {
          setError("No figgerits found for this volume");
          return;
        }
        // Set the figgerits directly since they're already processed
        setFiggerits(result.figgerits);
      } else {
        setError(result.error || "Failed to retrieve figgerits");
      }
    } catch (err) {
      console.error("Error fetching figgerits:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiggerits();
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      const mappedFiggerits = figgerits.map((figgerit) => ( {
        data: figgerit.matches,
        saying: figgerit.saying
      }))
      
      const chunkedMappedFiggerits = chunkArray(mappedFiggerits, 4)
      await generatePDF(chunkedMappedFiggerits, paperSize, includeTitlePage, Number(volume))
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  } 

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Retrieve Figgerits
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="volume"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Volume Number
            </label>
            <input
              id="volume"
              type="number"
              min="1"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : null}
            {isLoading ? "Loading..." : "Retrieve Figgerits"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 text-sm text-red-800 bg-red-50 rounded-lg">
            Error: {error}
          </div>
        )}
      </div>

    {figgerits.length > 0 && (
      <>
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-start gap-4 justify-center">
          <div className="flex flex-col gap-2">
            <label htmlFor="paper-size" className="text-sm font-medium">
              Paper Size
            </label>
            <select
              id="paper-size"
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as PaperSize)}
              className="w-[180px] h-10 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="a4">A4 (210mm × 297mm)</option>
              <option value="letter">Letter (8.5&quot; × 11&quot;)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-title-page"
                checked={includeTitlePage}
                onChange={(e) => setIncludeTitlePage(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="include-title-page" className="text-sm font-medium">
                Include Title Page
              </label>
            </div>
          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating PDF..." : "Download PDF with Puzzles & Answers"}
          </button>
        </div>
      {includeTitlePage && (
          <div className="border rounded-lg p-4 mb-4 w-full max-w-md aspect-[210/297] overflow-hidden">
            <h3 className="text-lg font-bold mb-2">Title Page Preview</h3>
            <div className="w-full h-full">
              <TitlePage volumeNumber={Number(volume)} />
            </div>
          </div>
        )}
      </div>
       <div className="border rounded-lg p-4 mb-8 bg-white shadow-md">
       <h2 className="text-xl font-bold text-center mb-4">Puzzles Preview</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {figgerits.map((puzzle, index) => (
           <div key={`preview-puzzle-${index}`} className="border rounded p-2">
             <h3 className="font-bold mb-2">Puzzle #{index + 1}</h3>
             <FiggeritGrid data={puzzle.matches} saying={puzzle.saying} />
           </div>
         ))}
       </div>
     </div>
     </>
    )}
    </div>
  );
};

export default Generate;