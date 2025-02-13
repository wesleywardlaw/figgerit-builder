'use client';

import { createFiggerits, submitRiddle } from '@/app/lib/actions';
import Form from './Form';
import { RiddleFormValues, RiddleSchema } from '../lib/schemas/riddle';
import { useEffect } from 'react';

export default function RiddleForm() {

 const generateFiggerits = async () => { 
  
  const figgerits = await createFiggerits(4, 28); 
  console.log(figgerits);
};

useEffect(() => {
  generateFiggerits();
})
  
  const fields: Array<{name: keyof RiddleFormValues; label:string}> = [
    { name: 'clue', label: 'Clue' },
    { name: 'word', label: 'Word' },
  ];

  return (
    <Form<RiddleFormValues>
      fields={fields}
      schema={RiddleSchema}
      onSubmit={submitRiddle}
      submitButtonText="Submit Riddle"
    />
  );
}