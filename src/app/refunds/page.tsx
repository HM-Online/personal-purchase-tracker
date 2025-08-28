import Link from 'next/link';

export default function RefundsPage() {
  return (
    <main className="container mx-auto p-4 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Refunds Dashboard</h1>
        <Link href="/" className="text-blue-400 hover:underline">
          &larr; Back to Main Dashboard
        </Link>
      </div>
      <p className="text-gray-400">
        (Kanban board with columns for Requested, Approved, and Paid will be built here...)
      </p>
    </main>
  );
}