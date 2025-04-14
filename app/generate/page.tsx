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
  const [showTitlePage, setShowTitlePage] = useState(true);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titlePageRef = useRef<HTMLDivElement | null>(null);
  const answersRef = useRef<HTMLDivElement | null>(null); // Only one grouped answer section now

  const generateFiggerits = async () => {
    const result = await createFiggerits(4, 115, 700);
    if (result.figgerits) {
      setFiggerits(result.figgerits);
    }
  };

  useEffect(() => {
    generateFiggerits();
  }, []);

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let isFirstPage = true;

    // Title page
    if (showTitlePage && titlePageRef.current) {
      const canvas = await html2canvas(titlePageRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      isFirstPage = false;
    }

    // Puzzle pages
    for (let i = 0; i < pageRefs.current.length; i++) {
      const page = pageRefs.current[i];
      if (!page) continue;

      const canvas = await html2canvas(page, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (!isFirstPage) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    // Answers section
    if (answersRef.current) {
      const canvas = await html2canvas(answersRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save('figgerits.pdf');
    isFirstPage = true;
  };

  if (!figgerits || figgerits.length === 0) {
    return <div>Loading...</div>;
  }

  const puzzleGroups = chunkArray(figgerits, 4);
  pageRefs.current = [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-12">
        <button
        onClick={handleDownloadPDF}
        className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
      >
        Download PDF
      </button>
      {/* Title Page */}
      {showTitlePage && (
        <div
          ref={titlePageRef}
          style={{ padding: '40px', textAlign: 'center' }}
        >
          <h1 style={{ fontSize: '30px' }}>Figgerits Vol. 1</h1>
          <h3>A collection of puzzles</h3>
        </div>
      )}

    

      {/* Puzzle Pages */}
      {puzzleGroups.map((group, i) => (
        <div
          key={i}
          ref={(el) => {
            pageRefs.current[i] = el;
          }}
          className="p-6 border rounded shadow bg-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {group.map((figgerit, index) => (
              <div key={index}>
                <span className="text-lg font-bold">
                  Puzzle #{i * 4 + index + 1}
                </span>
                <FiggeritPuzzle
                  data={figgerit.matches}
                  saying={figgerit.saying}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Answer Pages - grouped in 3 columns */}
      <div ref={answersRef} className="p-6 border rounded shadow bg-white">
        <h2 className="text-2xl font-bold mb-6">Answers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {figgerits.map((figgerit, i) => (
            <div key={i} className="break-inside-avoid">
              <h3 className="font-semibold mb-2">Figgerit #{i + 1}</h3>
              <div className="text-sm mb-2">
                <span className="font-semibold">Words:</span>
                <ol className="list-decimal list-inside ml-4">
                  {figgerit.matches.map((match, j) => (
                    <li key={j}>{match.answer}</li>
                  ))}
                </ol>
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
