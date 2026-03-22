'use client';

import SeriesForm from '@/components/admin/SeriesForm';

export default function NewSeriesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Create New Series</h1>
        <p className="text-gray-500 text-sm mt-0.5">Fill in the details to create a new series.</p>
      </div>
      <SeriesForm />
    </div>
  );
}
