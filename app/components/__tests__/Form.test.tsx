import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Form from "../Form";
import { z } from "zod";
import '@testing-library/jest-dom';

// Define the schema for form validation
const schema = z.object({
  username: z.string().min(3, "Username too short"),
  password: z.string().min(6, "Password too short"),
});

// Define the type for form fields
type FormFields = {
  username: string;
  password: string;
};

describe("Form component", () => {
  // Define fields configuration for the form
  const fields = [
    { name: "username" as keyof FormFields, label: "Username", type: "text" },
    { name: "password" as keyof FormFields, label: "Password", type: "password" },
  ];

  it("renders all fields and submit button", () => {
    render(
      <Form
        fields={fields}
        schema={schema}
        onSubmit={jest.fn()}
        submitButtonText="Submit"
      />
    );
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("shows validation errors on invalid submit", async () => {
    render(
      <Form
        fields={fields}
        schema={schema}
        onSubmit={jest.fn()}
        submitButtonText="Submit"
      />
    );
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "a" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/username too short/i)).toBeInTheDocument();
      expect(screen.getByText(/password too short/i)).toBeInTheDocument();
    });
  });

  it("calls onSubmit with valid data and shows success message", async () => {
    const onSubmit = jest.fn().mockResolvedValue({ success: true });
    render(
      <Form
        fields={fields}
        schema={schema}
        onSubmit={onSubmit}
        submitButtonText="Submit"
      />
    );
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "alice" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    // Blur fields to trigger validation
    fireEvent.blur(screen.getByLabelText(/username/i));
    fireEvent.blur(screen.getByLabelText(/password/i));
    // Wait for form to become valid and enabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submit/i })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ username: "alice", password: "password123" });
      expect(screen.getByText(/submission successful/i)).toBeInTheDocument();
    });
  });

  it("shows root error if returned from onSubmit", async () => {
    const onSubmit = jest.fn().mockResolvedValue({ errors: { root: ["Something went wrong"] } });
    render(
      <Form
        fields={fields}
        schema={schema}
        onSubmit={onSubmit}
        submitButtonText="Submit"
      />
    );
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "alice" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.blur(screen.getByLabelText(/username/i));
    fireEvent.blur(screen.getByLabelText(/password/i));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submit/i })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ username: "alice", password: "password123" });
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});