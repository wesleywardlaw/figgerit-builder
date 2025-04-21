"use client";

import { submitSaying } from "@/app/lib/actions";
import Form from "./Form";
import { SayingFormValues, SayingSchema } from "../lib/schemas/saying";
import CSVUpload from "./CSVUpload";

export default function SayingForm() {
  const fields: Array<{ name: keyof SayingFormValues; label: string }> = [
    { name: "saying", label: "Saying" },
    { name: "category", label: "Category (optional)" },
  ];

  return (
    <div className="space-y-8">
      <div className="p-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Add a Single Saying</h2>
        <Form<SayingFormValues>
          fields={fields}
          schema={SayingSchema}
          onSubmit={submitSaying}
          submitButtonText="Submit Saying"
        />
      </div>
      <CSVUpload type="saying" />
    </div>
  );
}
