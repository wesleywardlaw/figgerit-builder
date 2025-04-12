'use client';

import { useState, useEffect, useRef } from 'react';
import { createFiggerits } from '../lib/actions';
import { Figgerit } from '@/types/figgert';
import FiggeritPuzzle from '../components/FiggeritPuzzle';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Utility function to chunk an array into groups of `size`
const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
};

const Generate = () => {
  const [figgerits, setFiggerits] = useState<Figgerit[]>([]);
  const [showTitlePage, setShowTitlePage] = useState<boolean>(true); // Boolean to control title page visibility
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]); // Correctly typed
  const titlePageRef = useRef<HTMLDivElement | null>(null); // Ref for title page

  const generateFiggerits = async () => {
    const result = await createFiggerits(4, 115);
    if (result.figgerits) {
      setFiggerits(result.figgerits);
    }
  };

  useEffect(() => {
    generateFiggerits();
  }, []);

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Capture the title page if it needs to be shown
    if (showTitlePage && titlePageRef.current) {
      const canvas = await html2canvas(titlePageRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png'); // Ensure PNG format

      console.log('Title Page Image Data URL:', imgData); // Log for debugging

      if (imgData) {
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add the title page to the PDF
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.addPage(); // Add a new page after the title page
      } else {
        console.error('Failed to capture title page.');
      }
    }

    // Loop through and capture the puzzle pages as HTML
    for (let i = 0; i < pageRefs.current.length; i++) {
      const page = pageRefs.current[i];
      if (!page) continue;

      const canvas = await html2canvas(page, { scale: 2 });
      const imgData = canvas.toDataURL('image/png'); // Ensure PNG format

      console.log('Puzzle Page Image Data URL:', imgData); // Log for debugging

      if (imgData) {
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (i !== 0) pdf.addPage(); // Add a new page after the first puzzle page
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        console.error('Failed to capture puzzle page.');
      }
    }

    pdf.save('figgerits.pdf');

    // After generating the PDF, hide the title page
    setShowTitlePage(false);
  };

  if (!figgerits || figgerits.length === 0) {
    return <div>Loading...</div>;
  }

  const puzzleGroups = chunkArray(figgerits, 4);
  pageRefs.current = []; // Reset refs before assigning them again

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Conditionally render the title page */}
      {showTitlePage && (
        <div
          ref={titlePageRef}
          style={{ padding: '40px', textAlign: 'center' }}
        >
          <h1 style={{ fontSize: '30px' }}>Figgerits Vol. 1</h1>
          <h3>A collection of puzzles</h3>
        </div>
      )}

      <button
        onClick={handleDownloadPDF}
        className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
      >
        Download PDF
      </button>

      {puzzleGroups.map((group, i) => (
        <div
          key={i}
          ref={(el) => {
            pageRefs.current[i] = el;
          }}
          className="mb-12 p-6 border rounded shadow bg-white"
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
    </div>
  );
};

export default Generate;
