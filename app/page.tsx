import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen py-10 px-6 md:px-20">
      <section className="mb-12 bg-gray-800 shadow-xl rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">
          <Link href="/build">Add Data</Link>
        </h2>
        <p className="text-white mb-2">
          Add riddles and sayings to be used in generating your Figgerit puzzles.
          Optionally associate riddles and sayings with a category. Supports
          uploading via CSV files.
        </p>
      </section>

      <section className="mb-12 bg-gray-800 shadow-xl rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">
          <Link href="/generatepuzzles">Generate Puzzles</Link>
        </h2>
        <p className="text-white mb-2">
          Generate figgerit puzzles from the riddles and sayings you have added.
          You can choose the number of puzzles to generate, how much data to
          pull per attempt (less riddles is less data to pull but reduces the
          probability of successful figgerit generation). Choose a volume to
          associate puzzles with. Optionally only use riddles and saying from a
          specific category.
        </p>
      </section>

      <section className="mb-12 bg-gray-800 shadow-xl rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">
          <Link href="/view">View Volumes</Link>
        </h2>
        <p className="text-white mb-2">
          Preview puzzle volumes and download them as a PDF.
        </p>
      </section>
    </div>
  );
}
