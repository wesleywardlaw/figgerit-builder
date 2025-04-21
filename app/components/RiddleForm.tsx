"use client";

import { submitRiddle } from "@/app/lib/actions";
import Form from "./Form";
import { RiddleFormValues, RiddleSchema } from "../lib/schemas/riddle";
import CSVUpload from "./CSVUpload";

export default function RiddleForm() {
  const fields: Array<{ name: keyof RiddleFormValues; label: string }> = [
    { name: "clue", label: "Clue" },
    { name: "word", label: "Word" },
    { name: "category", label: "Category (optional)" },
  ];

  return (
    <div className="space-y-8">
      <div className="p-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Add a Single Riddle</h2>
        <Form<RiddleFormValues>
          fields={fields}
          schema={RiddleSchema}
          onSubmit={submitRiddle}
          submitButtonText="Submit Riddle"
        />
      </div>

      <CSVUpload type="riddle" />
    </div>
  );
}
