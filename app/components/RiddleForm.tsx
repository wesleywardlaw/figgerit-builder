"use client";

import { submitRiddle } from "@/app/lib/actions";
import Form from "./Form";
import { RiddleFormValues, RiddleSchema } from "../lib/schemas/riddle";

export default function RiddleForm() {
  const fields: Array<{ name: keyof RiddleFormValues; label: string }> = [
    { name: "clue", label: "Clue" },
    { name: "word", label: "Word" },
  ];

  return (
    <>
      <Form<RiddleFormValues>
        fields={fields}
        schema={RiddleSchema}
        onSubmit={submitRiddle}
        submitButtonText="Submit Riddle"
      />
    </>
  );
}
