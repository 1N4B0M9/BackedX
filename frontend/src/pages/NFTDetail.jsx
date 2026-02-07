import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  Coins,
  ExternalLink,
  ArrowRightLeft,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import * as api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

export default function NFTDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wallet } = useWallet();

  const [nft, setNft] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadNFT();
  }, [id]);

  const loadNFT = async () => {
    setLoading(true);
    try {
      const { data } = await api.getNFTDetail(id);
      setNft(data.nft);
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Failed to load NFT:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!wallet) {
      navigate('/wallet');
      return;
    }
    setBuying(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.purchaseNFT(id, wallet.address, wallet.seed);
      setSuccess(`Purchase successful! TX: ${data.txHash?.slice(0, 16)}...`);
      loadNFT();
    } catch (err) {
      setError(err.response?.data?.error || 'Purchase failed');
    } finally {
      setBuying(false);
    }
  };

  const handleRedeem = async () => {
    setRedeeming(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.redeemNFT(id, wallet.address, wallet.seed);
      setSuccess(`Redeemed! ${data.redemption.amountXrp} XRP released. Burn TX: ${data.redemption.burnTxHash?.slice(0, 16)}...`);
      loadNFT();
    } catch (err) {
      setError(err.response?.data?.error || 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading NFT details..." />;
  if (!nft) {
    return (
      <div className="text-center py-16">
        <p className="text-surface-400">NFT not found</p>
        <button onClick={() => navigate('/marketplace')} className="mt-4 text-primary-400 hover:underline">
          Back to Marketplace
        </button>
      </div>
    );
  }

  const isOwner = wallet && nft.owner_address === wallet.address;
  const canBuy = wallet && nft.status === 'listed' && !isOwner;
  const canRedeem = wallet && nft.status === 'owned' && isOwner;

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-surface-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Image / Visual */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-primary-900/40 to-surface-900 flex items-center justify-center relative">
            <div className="text-center">
              <Zap className="w-20 h-20 text-primary-500/30 mx-auto mb-4" />
              <p className="text-xl font-bold text-surface-400">{nft.asset_type}</p>
              <p className="text-sm text-surface-600 mt-1">Asset-Backed NFT</p>
            </div>

            {/* Backing Badge */}
            <div className="absolute bottom-4 left-4 right-4 bg-surface-900/90 backdrop-blur rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-surface-500 uppercase tracking-wider">XRP Backing</p>
                <p className="text-xl font-bold text-green-400">{parseFloat(nft.backing_xrp).toFixed(1)} XRP</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={nft.status} />
              <StatusBadge status={nft.verification_tier || 'basic'} />
            </div>
            <h1 className="text-3xl font-bold">{nft.asset_name}</h1>
            <p className="text-surface-400 mt-2">by {nft.company_name}</p>
          </div>

          {/* Description */}
          {nft.asset_description && (
            <p className="text-surface-300 leading-relaxed">{nft.asset_description}</p>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
              <p className="text-xs text-surface-500 uppercase tracking-wider">Backing</p>
              <p className="text-lg font-bold text-green-400 mt-1">{parseFloat(nft.backing_xrp).toFixed(1)} XRP</p>
            </div>
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
              <p className="text-xs text-surface-500 uppercase tracking-wider">List Price</p>
              <p className="text-lg font-bold text-white mt-1">
                {nft.list_price_xrp ? `${parseFloat(nft.list_price_xrp).toFixed(1)} XRP` : 'N/A'}
              </p>
            </div>
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
              <p className="text-xs text-surface-500 uppercase tracking-wider">Asset Type</p>
              <p className="text-sm font-semibold mt-1 capitalize">{nft.asset_type}</p>
            </div>
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
              <p className="text-xs text-surface-500 uppercase tracking-wider">Token ID</p>
              <p className="text-xs font-mono text-surface-400 mt-1 break-all">
                {nft.token_id ? `${nft.token_id.slice(0, 12)}...${nft.token_id.slice(-8)}` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Owner */}
          {nft.owner_address && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
              <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">
                {isOwner ? 'You Own This NFT' : 'Current Owner'}
              </p>
              <code className="text-sm font-mono text-surface-300">{nft.owner_address}</code>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {canBuy && (
              <button
                onClick={handleBuy}
                disabled={buying}
                className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 disabled:from-surface-700 disabled:to-surface-700 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 glow-pulse"
              >
                {buying ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing on XRPL...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5" />
                    Buy for {parseFloat(nft.list_price_xrp).toFixed(1)} XRP
                  </>
                )}
              </button>
            )}

            {canRedeem && (
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-surface-700 disabled:to-surface-700 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3"
              >
                {redeeming ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Burning NFT & Releasing XRP...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-5 h-5" />
                    Redeem for {parseFloat(nft.backing_xrp).toFixed(1)} XRP
                  </>
                )}
              </button>
            )}

            {nft.status === 'redeemed' && (
              <div className="w-full py-4 bg-surface-800 rounded-xl text-center text-surface-500 font-semibold">
                This NFT has been redeemed
              </div>
            )}

            {!wallet && nft.status === 'listed' && (
              <button
                onClick={() => navigate('/wallet')}
                className="w-full py-4 bg-primary-600 hover:bg-primary-500 rounded-xl font-semibold transition-colors"
              >
                Connect Wallet to Purchase
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl text-sm text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-900/20 border border-green-800 rounded-xl text-sm text-green-400">
              {success}
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Transaction History</h2>
          <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left px-4 py-3 text-xs text-surface-500 uppercase tracking-wider font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-xs text-surface-500 uppercase tracking-wider font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-xs text-surface-500 uppercase tracking-wider font-medium hidden sm:table-cell">TX Hash</th>
                  <th className="text-left px-4 py-3 text-xs text-surface-500 uppercase tracking-wider font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-surface-500 uppercase tracking-wider font-medium hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-surface-800/50 hover:bg-surface-800/50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium capitalize">{tx.tx_type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {tx.amount_xrp ? `${parseFloat(tx.amount_xrp).toFixed(1)} XRP` : '-'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {tx.tx_hash ? (
                        <code className="text-xs font-mono text-surface-400">
                          {tx.tx_hash.slice(0, 12)}...
                        </code>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-500 hidden md:table-cell">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
