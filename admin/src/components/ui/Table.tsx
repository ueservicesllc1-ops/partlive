import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ headers, children }) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-800 bg-gray-950/40 backdrop-blur-md">
      <table className="w-full min-w-[800px] border-collapse text-left text-sm text-gray-400">
        <thead className="bg-gray-900/60 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-800">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60 bg-transparent">
          {children}
        </tbody>
      </table>
    </div>
  );
};
