# Figgerit Builder

Figgerit Builder is a web application for creating and managing Figgerit puzzles. This app allows you to add riddles and sayings, generate puzzles, and preview or download puzzle volumes.

## Getting Started

To run the application locally, follow these steps:

1. Install dependencies:

   ```bash
   pnpm install
   ```

   > **Note:** If you prefer to use `npm` or `yarn`, you will need to delete the `pnpm-lock.yaml` file before installing dependencies.

2. Start the development server:

   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to access the app.

## Features

### Add Data

Navigate to the **Add Data** section by clicking on the "Add Data" link on the homepage or visiting `/build`.

- Add riddles and sayings to be used in generating your Figgerit puzzles.
- Optionally associate riddles and sayings with a category.
- Supports uploading data via CSV files.

### Generate Puzzles

Navigate to the **Generate Puzzles** section by clicking on the "Generate Puzzles" link on the homepage or visiting `/generatepuzzles`.

- Generate Figgerit puzzles from the riddles and sayings you have added.
- Choose the number of puzzles to generate and the amount of data to pull per attempt.
- Associate puzzles with a specific volume.
- Optionally filter riddles and sayings by category.

### View Volumes

Navigate to the **View Volumes** section by clicking on the "View Volumes" link on the homepage or visiting `/view`.

- Preview puzzle volumes.
- Download puzzle volumes as a PDF.
