export default function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
    confirmed: 'bg-green-900/30 text-green-400 border-green-800',
    completed: 'bg-green-900/30 text-green-400 border-green-800',
    failed: 'bg-red-900/30 text-red-400 border-red-800',
    minted: 'bg-purple-900/30 text-purple-400 border-purple-800',
    listed: 'bg-blue-900/30 text-blue-400 border-blue-800',
    owned: 'bg-indigo-900/30 text-indigo-400 border-indigo-800',
    redeemed: 'bg-surface-800 text-surface-400 border-surface-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
}
