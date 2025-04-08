"use client";

import { createFiggerits, submitRiddle } from "@/app/lib/actions";
import Form from "./Form";
import { RiddleFormValues, RiddleSchema } from "../lib/schemas/riddle";
import { useEffect, useState } from "react";
import FiggeritPuzzle from "./FiggeritPuzzle";
import { Figgerit } from "@/types/figgert";

export default function RiddleForm() {
  const [figgerits, setFiggerits] = useState<Figgerit[]>([]);

  const generateFiggerits = async () => {
    const figgerits = await createFiggerits(4, 115);
    if (figgerits.figgerits) {
      setFiggerits(figgerits.figgerits);
    }
  };

  useEffect(() => {
    generateFiggerits();
  }, []);

  const fields: Array<{ name: keyof RiddleFormValues; label: string }> = [
    { name: "clue", label: "Clue" },
    { name: "word", label: "Word" },
  ];

  if (!figgerits || figgerits.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Form<RiddleFormValues>
        fields={fields}
        schema={RiddleSchema}
        onSubmit={submitRiddle}
        submitButtonText="Submit Riddle"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {figgerits.map((figgerit, index) => (
          <div key={index}>
            <span className="text-lg font-bold">Puzzle #{index + 1}</span>
            <FiggeritPuzzle
              key={index}
              data={figgerit.matches}
              saying={figgerit.saying}
            />
          </div>
        ))}
      </div>
    </>
  );
}
