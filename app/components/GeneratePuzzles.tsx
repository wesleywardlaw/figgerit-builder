"use client";

import { useState } from "react";

import { createFiggerits } from "../lib/actions";

const GeneratePuzzles = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const numFiggerits = parseInt(
      formData.get("numFiggerits")?.toString() || "6"
    );
    const riddlesPerAttempt = parseInt(
      formData.get("riddlesPerAttempt")?.toString() || "2000"
    );
    const volume = parseInt(formData.get("volume")?.toString() || "1");
    const categoryInput = formData.get("category")?.toString();
    const category = categoryInput?.trim() || undefined;

    try {
      const result = await createFiggerits(
        numFiggerits,
        riddlesPerAttempt,
        volume,
        category
      );
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to generate figgerits");
      }
    } catch (_err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Generate Figgerits
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="numFiggerits"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Number of Figgerits
          </label>
          <input
            type="number"
            id="numFiggerits"
            name="numFiggerits"
            min="1"
            defaultValue="4"
            required
            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="riddlesPerAttempt"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Riddles Per Attempt
          </label>
          <input
            type="number"
            id="riddlesPerAttempt"
            name="riddlesPerAttempt"
            min="1"
            defaultValue="2000"
            required
            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="volume"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Volume
          </label>
          <input
            type="number"
            id="volume"
            name="volume"
            min="1"
            required
            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category (Optional)
          </label>
          <input
            type="text"
            id="category"
            name="category"
            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Generating..." : "Generate Figgerits"}
        </button>
      </form>

      {isLoading && (
        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md">
          <p>
            Please be patient while we generate your figgerits. This process may
            take some time...
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-md">
          <p>Figgerits generated successfully!</p>
        </div>
      )}
    </div>
  );
};

export default GeneratePuzzles;
