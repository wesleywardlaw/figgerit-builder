"use client";

import { useState, useRef } from "react";
import { getFiggeritsByVolume } from "../lib/actions";
import { Figgerit } from "@/types/figgerit";
import FiggeritPuzzle from "../components/FiggeritPuzzle";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Utility function to chunk puzzles into groups of 4
const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
};

const Generate = () => {
  const [figgerits, setFiggerits] = useState<Figgerit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTitlePage, setShowTitlePage] = useState(true);
  const [volume, setVolume] = useState<number>(1);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titlePageRef = useRef<HTMLDivElement | null>(null);
  const answersRef = useRef<HTMLDivElement | null>(null);

  // A4 aspect ratio constants for better page fitting
  const A4_WIDTH = 210; // mm
  const A4_HEIGHT = 297; // mm
  const PAGE_RATIO = A4_HEIGHT / A4_WIDTH;

  const fetchFiggerits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getFiggeritsByVolume(volume);
      
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

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    let isFirstPage = true;

    // Optimal canvas settings for better quality PDFs
    const canvasOptions = {
      scale: 3, // Higher scale for better quality
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: "#ffffff",
    };

    // Title page
    if (showTitlePage && titlePageRef.current) {
      const canvas = await html2canvas(titlePageRef.current, canvasOptions);
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Add with proper sizing to fill the page
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      isFirstPage = false;
    }

    // Puzzle pages
    for (let i = 0; i < pageRefs.current.length; i++) {
      const page = pageRefs.current[i];
      if (!page) continue;

      const canvas = await html2canvas(page, canvasOptions);
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      if (!isFirstPage) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      isFirstPage = false;
    }

    // Answers section
    if (answersRef.current) {
      const canvas = await html2canvas(answersRef.current, canvasOptions);
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(`figgerits-volume-${volume}.pdf`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Retrieve Figgerits</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-1">
              Volume Number
            </label>
            <input
              id="volume"
              type="number"
              min="1"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value) || 1)}
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
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Volume {volume} Figgerits</h2>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Download PDF
            </button>
          </div>

          {/* Controls for PDF options */}
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showTitlePage}
                onChange={() => setShowTitlePage(!showTitlePage)}
                className="form-checkbox"
              />
              <span>Include title page</span>
            </label>
          </div>

          {/* Preview area with message */}
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
            <p>Preview below. PDF will be formatted to fill A4 pages.</p>
          </div>

          {/* Title Page - styled for A4 proportions */}
          {showTitlePage && (
            <div
              ref={titlePageRef}
              className="mx-auto bg-white"
              style={{
                width: "100%",
                aspectRatio: `${A4_WIDTH}/${A4_HEIGHT}`,
                maxWidth: "800px",
                boxSizing: "border-box",
                padding: "40px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <h1 className="text-5xl font-bold mb-8">Figgerits Vol. {volume}</h1>
              <h3 className="text-2xl">A collection of puzzles</h3>
            </div>
          )}

          {/* Puzzle Pages - styled for A4 proportions */}
          {chunkArray(figgerits, 4).map((group, i) => (
            <div
              key={i}
              ref={(el) => {
                pageRefs.current[i] = el;
              }}
              className="mx-auto border rounded shadow bg-white"
              style={{
                width: "100%",
                aspectRatio: `${A4_WIDTH}/${A4_HEIGHT}`,
                maxWidth: "800px",
                boxSizing: "border-box",
              }}
            >
              <h2 className="text-xl font-bold mb-2 text-center">
                Figgerits - Page {i + 1}
              </h2>
              <div className="grid grid-cols-2 h-full pb-4">
                {group.map((figgerit, index) => {
                  // Determine border classes based on position
                  let borderClasses = "";
                  
                  if (index === 0) {
                    borderClasses = "border-r border-b";
                  } else if (index === 1) {
                    borderClasses = "border-l border-b";
                  } else if (index === 2) {
                    borderClasses = "border-r";
                  } else if (index === 3) {
                    borderClasses = "border-l border-t";
                  }

                  return (
                    <div key={index} className={`flex flex-col p-2 ${borderClasses}`}>
                      <span className="text-base font-bold mb-1 block">
                        Puzzle #{i * 4 + index + 1}
                      </span>
                      <div className="flex-grow">
                        <FiggeritPuzzle
                          data={figgerit.matches}
                          saying={figgerit.saying}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Answer Page - styled for A4 proportions */}
          <div
            ref={answersRef}
            className="mx-auto border rounded shadow bg-white"
            style={{
              width: "100%",
              aspectRatio: `${A4_WIDTH}/${A4_HEIGHT}`,
              maxWidth: "800px",
              boxSizing: "border-box",
              padding: "20px",
            }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Answers</h2>
            <div className="grid grid-cols-3 gap-y-6 gap-x-4">
              {figgerits.map((figgerit, i) => (
                <div key={i} className="break-inside-avoid">
                  <h3 className="font-semibold mb-1">Figgerit #{i + 1}</h3>
                  <div className="mb-1">
                    <span className="font-semibold">Words:</span>
                    {/* Fixed answer list with better alignment */}
                    <div className="ml-2 text-sm">
                      {figgerit.matches.map((match, j) => (
                        <div key={j} className="flex items-start">
                          <span className="mr-1 min-w-4 text-right">{j + 1}.</span>
                          <span>{match.answer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Solution:</span>{" "}
                    {figgerit.saying.text}
                  </div>
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
