import { ExternalLink } from 'lucide-react';

const EXPLORER_BASE = 'https://testnet.xrpl.org';

const typeConfig = {
  tx: { path: 'transactions', label: 'View Transaction' },
  nft: { path: 'nft', label: 'View NFT' },
  account: { path: 'accounts', label: 'View Account' },
};

export default function ExplorerLink({ type = 'tx', value, truncate = true, className = '' }) {
  if (!value) return <span className="text-surface-500">-</span>;

  const config = typeConfig[type];
  if (!config) return null;

  const url = `${EXPLORER_BASE}/${config.path}/${value}`;

  const displayValue = truncate
    ? `${value.slice(0, 8)}...${value.slice(-6)}`
    : value;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={config.label}
      className={`inline-flex items-center gap-1.5 font-mono text-xs text-primary-400 hover:text-primary-300 transition-colors group ${className}`}
    >
      <span className="break-all">{displayValue}</span>
      <ExternalLink className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
