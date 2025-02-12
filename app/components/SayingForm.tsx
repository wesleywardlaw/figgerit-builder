'use client';

import { submitSaying } from '@/app/lib/actions';
import Form from './Form';
import { SayingFormValues, SayingSchema } from '../lib/schemas/saying';

export default function SayingForm() {

  const fields: Array<{name: keyof SayingFormValues; label:string}> = [
    { name: 'saying', label: 'Saying' },
  ];

  return (
    <Form<SayingFormValues>
      fields={fields}
      schema={SayingSchema}
      onSubmit={submitSaying}
      submitButtonText="Submit Saying"
    />
  );
}