import { Link } from 'react-router-dom';
import { Shield, ShieldCheck, ShieldAlert, Zap } from 'lucide-react';

const tierConfig = {
  unverified: { icon: ShieldAlert, color: 'text-surface-500', bg: 'bg-surface-700', label: 'Unverified' },
  basic: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-900/30', label: 'Basic' },
  verified: { icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-900/30', label: 'Verified' },
  premium: { icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-900/30', label: 'Premium' },
};

export default function NFTCard({ nft, showBuy = false }) {
  const tier = tierConfig[nft.verification_tier] || tierConfig.unverified;
  const TierIcon = tier.icon;

  return (
    <Link
      to={`/nft/${nft.id}`}
      className="group block bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden hover:border-primary-600/50 transition-all hover:shadow-lg hover:shadow-primary-600/10"
    >
      {/* Image */}
      <div className="aspect-square bg-gradient-to-br from-primary-900/50 to-surface-800 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Zap className="w-12 h-12 text-primary-500/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-surface-400">{nft.asset_type || 'Electronics'}</p>
          </div>
        </div>

        {/* Verification Badge */}
        <div className={`absolute top-3 right-3 flex items-center gap-1 ${tier.bg} px-2 py-1 rounded-full`}>
          <TierIcon className={`w-3 h-3 ${tier.color}`} />
          <span className={`text-[10px] font-medium ${tier.color}`}>{tier.label}</span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[10px] font-medium px-2 py-1 rounded-full ${
              nft.status === 'listed'
                ? 'bg-green-900/40 text-green-400'
                : nft.status === 'owned'
                ? 'bg-blue-900/40 text-blue-400'
                : 'bg-surface-700 text-surface-400'
            }`}
          >
            {nft.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
          {nft.asset_name}
        </h3>
        <p className="text-xs text-surface-500 mt-1 truncate">
          by {nft.company_name || 'Unknown'}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-surface-500 uppercase tracking-wider">Backing</p>
            <p className="text-sm font-bold text-green-400">
              {parseFloat(nft.backing_xrp).toFixed(1)} XRP
            </p>
          </div>
          {nft.list_price_xrp && (
            <div className="text-right">
              <p className="text-[10px] text-surface-500 uppercase tracking-wider">Price</p>
              <p className="text-sm font-bold text-white">
                {parseFloat(nft.list_price_xrp).toFixed(1)} XRP
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
