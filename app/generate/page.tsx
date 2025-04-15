'use client';

import { useState, useEffect, useRef } from 'react';
import { createFiggerits } from '../lib/actions';
import { Figgerit } from '@/types/figgerit';
import FiggeritPuzzle from '../components/FiggeritPuzzle';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Utility function to chunk puzzles into groups of 4
const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
};

const Generate = () => {
  const [figgerits, setFiggerits] = useState<Figgerit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTitlePage, setShowTitlePage] = useState(true);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titlePageRef = useRef<HTMLDivElement | null>(null);
  const answersRef = useRef<HTMLDivElement | null>(null);

  // A4 aspect ratio constants for better page fitting
  const A4_WIDTH = 210;  // mm
  const A4_HEIGHT = 297; // mm
  const PAGE_RATIO = A4_HEIGHT / A4_WIDTH;

  const generateFiggerits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await createFiggerits(4, 115, 1002);
      if (result.success && result.figgerits) {
        console.log(result);
        setFiggerits(result.figgerits);
      } else {
        setError(result.error || 'Failed to generate figgerits');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateFiggerits();
  }, []);

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let isFirstPage = true;

    // Optimal canvas settings for better quality PDFs
    const canvasOptions = {
      scale: 3, // Higher scale for better quality
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff'
    };

    // Title page
    if (showTitlePage && titlePageRef.current) {
      const canvas = await html2canvas(titlePageRef.current, canvasOptions);
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Add with proper sizing to fill the page
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      isFirstPage = false;
    }

    // Puzzle pages
    for (let i = 0; i < pageRefs.current.length; i++) {
      const page = pageRefs.current[i];
      if (!page) continue;

      const canvas = await html2canvas(page, canvasOptions);
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      if (!isFirstPage) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      isFirstPage = false;
    }

    // Answers section
    if (answersRef.current) {
      const canvas = await html2canvas(answersRef.current, canvasOptions);
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save('figgerits.pdf');
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={generateFiggerits}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!figgerits || figgerits.length === 0) {
    return <div className="p-6">No figgerits generated</div>;
  }

  const puzzleGroups = chunkArray(figgerits, 4);
  pageRefs.current = [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      <button
        onClick={handleDownloadPDF}
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
      >
        Download PDF
      </button>
      
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
            width: '100%',
            aspectRatio: `${A4_WIDTH}/${A4_HEIGHT}`,
            maxWidth: '800px',
            boxSizing: 'border-box',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <h1 className="text-5xl font-bold mb-8">Figgerits Vol. 1</h1>
          <h3 className="text-2xl">A collection of puzzles</h3>
        </div>
      )}

      {/* Puzzle Pages - styled for A4 proportions */}
      {puzzleGroups.map((group, i) => (
        <div
          key={i}
          ref={(el) => {
            pageRefs.current[i] = el;
          }}
          className="mx-auto border rounded shadow bg-white"
          style={{
            width: '100%',
            aspectRatio: `${A4_WIDTH}/${A4_HEIGHT}`,
            maxWidth: '800px',
            boxSizing: 'border-box',
            padding: '15px'
          }}
        >
          <h2 className="text-xl font-bold mb-2 text-center">Figgerits - Page {i+1}</h2>
          <div className="grid grid-cols-2 gap-4 h-full pb-4">
            {group.map((figgerit, index) => (
              <div key={index} className="border rounded p-3 flex flex-col">
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
            ))}
          </div>
        </div>
      ))}

      {/* Answer Page - styled for A4 proportions */}
      <div 
        ref={answersRef} 
        className="mx-auto border rounded shadow bg-white"
        style={{
          width: '100%',
          aspectRatio: `${A4_WIDTH}/${A4_HEIGHT}`,
          maxWidth: '800px',
          boxSizing: 'border-box',
          padding: '20px'
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
                      <span className="mr-1 min-w-4 text-right">{j+1}.</span>
                      <span>{match.answer}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-sm">
                <span className="font-semibold">Solution:</span> {figgerit.saying.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Generate;