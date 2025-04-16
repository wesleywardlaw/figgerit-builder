"use client";

import GeneratePuzzles from "../components/GeneratePuzzles";

export default function GeneratePuzzlesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Generate Figgerits Puzzles</h1>
        <GeneratePuzzles />
      </div>
    </div>
  );
} 