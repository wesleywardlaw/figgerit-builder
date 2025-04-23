"use client";

import { useState } from "react";
import Papa from "papaparse";

import { RiddleFormValues, RiddleSchema } from "../lib/schemas/riddle";
import { SayingFormValues, SayingSchema } from "../lib/schemas/saying";
import { submitRiddle, submitSaying } from "../lib/actions";

interface CSVUploadProps {
  type: "riddle" | "saying";
}

interface UploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export default function CSVUpload({ type }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const processCSV = async () => {
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;

        const { data, errors } = Papa.parse<string[]>(text, {
          skipEmptyLines: true,
        });

        if (errors.length) {
          throw new Error(`CSV parsing error: ${errors[0].message}`);
        }

        const rows = data.slice(1);
        const results: UploadResult = {
          success: 0,
          failed: 0,
          errors: [],
        };

        for (let i = 0; i < rows.length; i++) {
          const columns = rows[i];

          try {
            if (type === "riddle") {
              if (columns.length < 2) {
                throw new Error(
                  "Riddle must have at least clue and word columns"
                );
              }

              const riddleData: RiddleFormValues = {
                clue: columns[0].trim(),
                word: columns[1].trim(),
                category: columns[2]?.trim() || undefined,
              };

              const validationResult = RiddleSchema.safeParse(riddleData);
              if (!validationResult.success) {
                throw new Error(validationResult.error.errors[0].message);
              }

              const submitResult = await submitRiddle(riddleData);
              if (submitResult.success) {
                results.success++;
              } else {
                throw new Error(
                  Object.values(submitResult.errors || {})[0]?.[0] ||
                    "Unknown error"
                );
              }
            } else {
              if (columns.length < 1) {
                throw new Error("Saying must have at least the saying column");
              }

              const sayingData: SayingFormValues = {
                saying: columns[0].trim(),
                category: columns[1]?.trim() || undefined,
              };

              const validationResult = SayingSchema.safeParse(sayingData);
              if (!validationResult.success) {
                throw new Error(validationResult.error.errors[0].message);
              }

              const submitResult = await submitSaying(sayingData);
              if (submitResult.success) {
                results.success++;
              } else {
                throw new Error(
                  Object.values(submitResult.errors || {})[0]?.[0] ||
                    "Unknown error"
                );
              }
            }
          } catch (error) {
            results.failed++;
            results.errors.push({
              row: i + 2,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        setResult(results);
      } catch (error) {
        setResult({
          success: 0,
          failed: 0,
          errors: [
            {
              row: 0,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to process CSV file",
            },
          ],
        });
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="mt-8 p-6 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Upload {type === "riddle" ? "Riddles" : "Sayings"} via CSV
      </h2>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          {type === "riddle"
            ? "CSV format: clue,word,category(optional)"
            : "CSV format: saying,category(optional)"}
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Include a header row. Example:{" "}
          {type === "riddle" ? "clue,word,category" : "saying,category"}
        </p>

        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
          <button
            onClick={processCSV}
            disabled={!file || isUploading}
            className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isUploading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-4">
          <div className="p-4 rounded-lg bg-gray-50">
            <h3 className="font-medium">Upload Results</h3>
            <p className="text-sm text-gray-600">
              Successfully uploaded:{" "}
              <span className="font-medium text-green-600">
                {result.success}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Failed:{" "}
              <span className="font-medium text-red-600">{result.failed}</span>
            </p>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium">Errors</h3>
              <div className="mt-2 max-h-60 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Row
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.errors.map((error, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {error.row}
                        </td>
                        <td className="px-4 py-2 text-sm text-red-600">
                          {error.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
