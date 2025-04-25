"use client";

import { useState, useRef, useEffect } from "react";
import { getFiggeritsByVolume } from "../lib/actions";
import { Figgerit } from "@/types/figgerit";
import FiggeritPuzzle from "../components/FiggeritPuzzle";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import TitlePage from "../components/TitlePage";

// Paper sizes in mm
const PAPER_SIZES = {
  a4: {
    name: "A4",
    width: 210,
    height: 297,
  },
  letter: {
    name: 'US Letter (8.5" x 11")',
    width: 215.9,
    height: 279.4,
  },
} as const;

// Define our paper size type
type PaperSizeKey = keyof typeof PAPER_SIZES;

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
  const [showTitlePage, setShowTitlePage] = useState(true);
  const [volume, setVolume] = useState<number>(1);
  const [paperSize, setPaperSize] = useState<PaperSizeKey>("letter"); // Default to letter
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titlePageRef = useRef<HTMLDivElement | null>(null);
  const answerPageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const ANSWERS_PER_PAGE = 12; // This gives a good balance of readability and space efficiency

  // Check if we're on the client side and determine viewport width
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowMobileWarning(mobile);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Get current paper dimensions based on selection
  const currentPaper = PAPER_SIZES[paperSize];

  // Initialize refs for answer pages whenever figgerits changes
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
    if (isGeneratingPDF) return; // Prevent multiple simultaneous generations

    // Store original state before modifying it
    const mobileState = isMobile;

    try {
      setIsLoading(true);
      setIsGeneratingPDF(true);

      // Force consistent layout during PDF generation
      setIsMobile(false); // Temporarily override mobile detection for consistent layout

      // Wait for state update and re-render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use selected paper size for PDF
      const pdf = new jsPDF("p", "mm", paperSize);
      let isFirstPage = true;

      // Enhanced canvas options for better capture
      const canvasOptions = {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowWidth: 1200, // Force desktop-width rendering
        windowHeight: 1600, // Ensure enough height
        //Crucial for capturing all content
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onclone: (clonedDoc: any) => {
          // Force all elements to be visible in the clone
          const elements = clonedDoc.querySelectorAll(".grid");
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
          elements.forEach((el: any) => {
            if (el instanceof HTMLElement) {
              el.style.display = "grid";
              el.style.gridTemplateColumns = "repeat(2, 1fr)"; // Force 2-column layout
              el.style.height = "auto"; // Let height expand as needed
              el.style.overflow = "visible";
            }
          });
        },
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

      // Answer pages - now handling multiple answer pages
      for (let i = 0; i < answerPageRefs.current.length; i++) {
        const page = answerPageRefs.current[i];
        if (!page) continue;

        const canvas = await html2canvas(page, canvasOptions);
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`figgerits-volume-${volume}-${paperSize}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Please try again.");
    } finally {
      // Restore original mobile state
      setIsMobile(mobileState);
      setIsGeneratingPDF(false);
      setIsLoading(false);
    }
  };

  // Function to toggle mobile preview
  const toggleMobilePreview = () => {
    setShowMobileWarning(!showMobileWarning);
  };

  // Calculate chunked answers for pagination
  const answersChunks = chunkArray(figgerits, ANSWERS_PER_PAGE);

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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Volume {volume} Figgerits</h2>
            <button
              onClick={handleDownloadPDF}
              disabled={isLoading || isGeneratingPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isGeneratingPDF ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Generating...
                </>
              ) : (
                "Download PDF"
              )}
            </button>
          </div>

          {/* Controls for PDF options */}
          <div className="mb-4 flex flex-wrap gap-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showTitlePage}
                onChange={() => setShowTitlePage(!showTitlePage)}
                className="form-checkbox"
              />
              <span>Include title page</span>
            </label>

            <div>
              <label
                htmlFor="paperSize"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Paper Size
              </label>
              <select
                id="paperSize"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSizeKey)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="letter">US Letter (8.5&quot; x 11&quot;)</option>
                <option value="a4">A4 (210mm x 297mm)</option>
              </select>
            </div>
          </div>

          {/* Mobile warning with toggle option */}
          {isMobile && (
            <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">Mobile View</p>
                <button
                  onClick={toggleMobilePreview}
                  className="text-sm text-blue-700 underline"
                >
                  {showMobileWarning ? "Show Previews" : "Hide Previews"}
                </button>
              </div>
              {showMobileWarning && (
                <p>
                  The preview may not display optimally on mobile devices. You
                  can still generate the PDF or toggle the preview visibility.
                </p>
              )}
            </div>
          )}

          {/* Preview message for desktop */}
          {!isMobile && (
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
              <p>
                Preview below. PDF will be formatted to fill {currentPaper.name}{" "}
                pages.
              </p>
            </div>
          )}

          {/* PDF Generation Loading Overlay */}
          {isGeneratingPDF && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
                <svg
                  className="animate-spin h-10 w-10 text-blue-600 mb-4"
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
                <p className="text-lg font-medium">Generating PDF...</p>
                <p className="text-sm text-gray-500 mt-2">
                  This may take a moment
                </p>
              </div>
            </div>
          )}

          {/* Preview content - use height/overflow for hiding instead of display:none */}
          <div
            className={`transition-opacity duration-200 ${
              isMobile && showMobileWarning && !isGeneratingPDF
                ? "opacity-0 h-0 overflow-hidden"
                : "opacity-100"
            }`}
          >
            {/* Title Page - styled for current paper proportions */}
            {showTitlePage && (
              <div
                ref={titlePageRef}
                className="mx-auto border rounded shadow bg-white overflow-hidden pdf-page"
                style={{
                  width: "100%",
                  aspectRatio: `${currentPaper.width}/${currentPaper.height}`,
                  maxWidth: "800px",
                  boxSizing: "border-box",
                }}
              >
                <TitlePage volumeNumber={volume} />
              </div>
            )}

            {/* Puzzle Pages - styled for current paper proportions */}
            {chunkArray(figgerits, 4).map((group, i) => (
              <div
                key={i}
                ref={(el) => {
                  pageRefs.current[i] = el;
                }}
                className="mx-auto border rounded shadow bg-white mb-8 pdf-page"
                style={{
                  width: "100%",
                  aspectRatio: `${currentPaper.width}/${currentPaper.height}`,
                  maxWidth: "800px",
                  boxSizing: "border-box",
                  // Ensure consistent height with min-height property
                  minHeight: isMobile ? "auto" : undefined,
                }}
              >
                <h2 className="text-xl font-bold mb-2 text-center">
                  Figgerits - Page {i + 1}
                </h2>
                <div
                  className="grid pdf-content"
                  style={{
                    // Critical: ensure grid-template-columns is explicit
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                    height: "calc(100% - 40px)", // Subtract header height
                  }}
                >
                  {group.map((figgerit, index) => {
                    // Determine border classes based on position and device type
                    let borderClasses = "";

                    if (!isMobile) {
                      // Desktop border styling
                      if (index === 0) {
                        borderClasses = "border-r border-b";
                      } else if (index === 1) {
                        borderClasses = "border-l border-b";
                      } else if (index === 2) {
                        borderClasses = "border-r";
                      } else if (index === 3) {
                        borderClasses = "border-l border-t";
                      }
                    } else {
                      // Mobile border styling
                      borderClasses =
                        index < group.length - 1 ? "border-b" : "";
                    }

                    return (
                      <div
                        key={index}
                        className={`flex flex-col p-2 ${borderClasses} pdf-puzzle`}
                      >
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

            {/* Answer Pages - now paginated with multiple pages if needed */}
            {answersChunks.map((chunk, pageIndex) => (
              <div
                key={`answer-page-${pageIndex}`}
                ref={(el) => {
                  answerPageRefs.current[pageIndex] = el;
                }}
                className="mx-auto border rounded shadow bg-white mb-8 pdf-page"
                style={{
                  width: "100%",
                  aspectRatio: `${currentPaper.width}/${currentPaper.height}`,
                  maxWidth: "800px",
                  boxSizing: "border-box",
                  padding: "20px",
                }}
              >
                <h2 className="text-2xl font-bold mb-6 text-center">
                  Answers {answersChunks.length > 1 ? `- Page ${pageIndex + 1}` : ""}
                </h2>
                <div
                  className="pdf-content"
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                    gap: "1.5rem 1rem",
                  }}
                >
                  {chunk.map((figgerit, i) => {
                    // Calculate the actual figgerit number
                    const figgeritNumber = pageIndex * ANSWERS_PER_PAGE + i + 1;
                    
                    return (
                      <div key={i} className="break-inside-avoid pdf-answer">
                        <h3 className="font-semibold mb-1">
                          Figgerit #{figgeritNumber}
                        </h3>
                        <div className="mb-1">
                          <span className="font-semibold">Words:</span>
                          {/* Fixed answer list with better alignment */}
                          <div className="ml-2 text-sm">
                            {figgerit.matches.map((match, j) => (
                              <div key={j} className="flex items-start">
                                <span className="mr-1 min-w-4 text-right">
                                  {j + 1}.
                                </span>
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
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Generate;