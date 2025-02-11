'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitRiddle } from '@/app/lib/actions';
import { RiddleSchema, RiddleFormValues } from '../lib/schemas/riddle';

export default function RiddleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    reset,
  } = useForm<RiddleFormValues>({
    resolver: zodResolver(RiddleSchema),
    mode: 'onChange',
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit: SubmitHandler<RiddleFormValues> = async (data) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('clue', data.clue);
    formData.append('word', data.word);

    const result = await submitRiddle(formData);

    if (result.errors) {
        if ('clue' in result.errors || 'word' in result.errors) {
            Object.entries(result.errors).forEach(([field, message]) => {
              setError(field as keyof RiddleFormValues, {
                type: 'manual',
                message: message[0],
              });
            });
          }
    
          if ('general' in result.errors) {
            setError('root', {
              type: 'manual',
              message: result.errors.general[0],
            });
          }
    }  else {
        reset();
  
        setSuccessMessage('Riddle submitted successfully!');
  
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }

      setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {successMessage && (
        <div className="p-4 mb-4 text-sm text-green-800 bg-green-50 rounded-lg">
          {successMessage}
        </div>
      )}

{errors.root && (
        <div className="p-4 mb-4 text-sm text-red-800 bg-red-50 rounded-lg">
          {errors.root.message}
        </div>
      )}
      <div>
        <label htmlFor="clue" className="block text-sm font-medium text-gray-700">
          Clue
        </label>
        <input
          id="clue"
          {...register('clue')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.clue && <p className="text-sm text-red-500">{errors.clue.message}</p>}
      </div>
      <div>
        <label htmlFor="word" className="block text-sm font-medium text-gray-700">
          Word
        </label>
        <input
          id="word"
          {...register('word')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.word && <p className="text-sm text-red-500">{errors.word.message}</p>}
      </div>
      <button
        type="submit"
        disabled={!isValid}
        className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {isSubmitting ? (
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
          'Submit'
        )}
      </button>
    </form>
  );
}