"use client";

import { useForm, SubmitHandler, FieldValues, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

interface FormField<T> {
  name: Path<T>;
  label: string;
  type?: string;
}

interface FormProps<T extends FieldValues> {
  fields: FormField<T>[];
  schema: z.ZodType<T>;
  onSubmit: (data: T) => Promise<{
    errors?: Partial<Record<keyof T | "root", string[]>>;
    success?: boolean;
  }>;
  submitButtonText: string;
  isSubmitting?: boolean;
}

export default function Form<T extends FieldValues>({
  fields,
  schema,
  onSubmit,
  submitButtonText,
  isSubmitting = false,
}: FormProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    reset,
  } = useForm<T>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFormSubmit: SubmitHandler<T> = async (data) => {
    const result = await onSubmit(data);

    if (result.errors) {
      Object.entries(result.errors).forEach(([field, messages]) => {
        const message = messages?.[0];

        if (field === "root") {
          setError("root" as Path<T>, {
            type: "manual",
            message: message || "An unexpected error occurred.",
          });
        } else {
          setError(field as keyof T as Path<T>, {
            type: "manual",
            message: message || "Invalid input.",
          });
        }
      });
    } else if (result.success) {
      reset();
      setSuccessMessage("Submission successful!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const getFieldError = (name: Path<T>) => {
    return errors[name]?.message;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {successMessage && (
        <div className="p-4 mb-4 text-sm text-green-800 bg-green-50 rounded-lg">
          {successMessage}
        </div>
      )}

      {"root" in errors && (
        <div className="p-4 mb-4 text-sm text-red-800 bg-red-50 rounded-lg">
          {errors.root?.message}
        </div>
      )}

      {fields.map((field) => (
        <div key={String(field.name)} className="space-y-1">
          <label
            htmlFor={String(field.name)}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {field.label}
          </label>
          <input
            id={String(field.name)}
            type={field.type || "text"}
            {...register(field.name)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {getFieldError(field.name) && (
            <p className="text-sm text-red-500 mt-1">
              {getFieldError(field.name) as string}
            </p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
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
          submitButtonText
        )}
      </button>
    </form>
  );
}
