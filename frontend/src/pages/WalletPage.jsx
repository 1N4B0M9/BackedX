import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useToast } from '../components/Toast';
import { Wallet, Plus, KeyRound, Copy, Check, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ExplorerLink from '../components/ExplorerLink';
import { BGPattern } from '../components/ui/bg-pattern';

export default function WalletPage() {
  const { wallet, loading, createNewWallet, loginWithSeed, refreshBalance, logout } = useWallet();
  const { toast } = useToast();
  const [seed, setSeed] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState('create');
  const navigate = useNavigate();

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleCreate = async () => {
    try {
      await createNewWallet(displayName || undefined);
      toast({ type: 'success', title: 'Wallet Created!', message: 'Funded with ~100 testnet XRP' });
    } catch (err) {
      toast({ type: 'error', title: 'Wallet Creation Failed', message: err.response?.data?.error || 'Failed to create wallet' });
    }
  };

  const handleImport = async () => {
    if (!seed.trim()) {
      toast({ type: 'error', message: 'Please enter a wallet seed' });
      return;
    }
    try {
      await loginWithSeed(seed.trim());
      toast({ type: 'success', title: 'Wallet Connected!', message: 'Successfully imported wallet' });
    } catch (err) {
      toast({ type: 'error', title: 'Connection Failed', message: err.response?.data?.error || 'Invalid seed or connection error' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black z-40 flex items-center justify-center">
        <LoadingSpinner text="Connecting to XRPL Testnet..." />
      </div>
    );
  }

  // Connected state
  if (wallet) {
    return (
      <div className="fixed inset-0 w-screen h-screen z-40">
        <div className="absolute inset-0 bg-black" aria-hidden />
        <BGPattern variant="dots" mask="none" size={28} fill="rgba(255,255,255,0.12)" />
        {/* Fade toward center: black in center (hides pattern), transparent at edges (pattern visible) */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: 'radial-gradient(circle at center, black 30%, transparent 58%)',
          }}
          aria-hidden
        />
        {/* Centered card */}
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
          <div className="w-full max-w-lg animate-fade-in">
            <div className="bg-black border border-white/10 rounded-3xl p-8 shadow-[0_0_80px_rgba(255,173,184,0.06)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Wallet Connected</h2>
                  <p className="text-xs text-white/40">XRPL Testnet</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">Address</label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <ExplorerLink type="account" value={wallet.address} truncate={false} />
                    </div>
                    <button
                      onClick={() => copyToClipboard(wallet.address)}
                      className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">Seed (keep secret!)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white/70 break-all">
                      {wallet.seed}
                    </code>
                    <button
                      onClick={() => copyToClipboard(wallet.seed)}
                      className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-400/80 mt-1">Save this seed! You need it to log back in.</p>
                </div>

                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div>
                    <p className="text-xs text-white/40">Balance</p>
                    <p className="text-2xl font-bold text-primary-300">
                      {parseFloat(wallet.balance).toFixed(2)} <span className="text-sm text-primary-400">XRP</span>
                    </p>
                  </div>
                  <button
                    onClick={refreshBalance}
                    className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate('/marketplace')}
                  className="flex-1 py-3 bg-primary-300 hover:bg-primary-200 text-black rounded-[14px] text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(255,173,184,0.2)]"
                >
                  Browse Marketplace
                </button>
                <button
                  onClick={logout}
                  className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-red-900/20 hover:border-red-800/40 rounded-[14px] text-sm font-semibold text-white/80 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not connected
  return (
    <div className="fixed inset-0 w-screen h-screen z-40">
      <div className="absolute inset-0 bg-black" aria-hidden />
      <BGPattern variant="dots" mask="none" size={28} fill="rgba(255,255,255,0.12)" />
      {/* Fade toward center: black in center, transparent at edges */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(circle at center, black 30%, transparent 58%)',
        }}
        aria-hidden
      />
      {/* Centered content */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
              Connect Wallet
            </h1>
            <p className="text-white/50 text-lg font-light">
              Create a new testnet wallet or load an existing one
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-3 rounded-[14px] text-sm font-medium transition-all ${
                mode === 'create'
                  ? 'bg-primary-300 text-black shadow-[0_4px_20px_rgba(255,173,184,0.25)]'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-1.5" />
              New Wallet
            </button>
            <button
              onClick={() => setMode('import')}
              className={`flex-1 py-3 rounded-[14px] text-sm font-medium transition-all ${
                mode === 'import'
                  ? 'bg-primary-300 text-black shadow-[0_4px_20px_rgba(255,173,184,0.25)]'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              <KeyRound className="w-4 h-4 inline mr-1.5" />
              Load Wallet
            </button>
          </div>

          {/* Card */}
          <div className="bg-black border border-white/10 rounded-3xl p-8 shadow-[0_0_80px_rgba(255,173,184,0.06)]">
            {mode === 'create' ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Display Name (optional)</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., Alice"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400/30 transition-all"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full py-3.5 bg-primary-300 hover:bg-primary-200 disabled:bg-white/10 disabled:text-white/30 text-black rounded-[14px] font-semibold transition-all hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(255,173,184,0.25)]"
                >
                  Create Testnet Wallet
                </button>
                <p className="text-xs text-white/30 text-center">
                  Creates a funded wallet on XRPL Testnet (~100 XRP)
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Wallet Seed</label>
                  <input
                    type="password"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="sEdV..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400/30 transition-all"
                  />
                </div>
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="w-full py-3.5 bg-primary-300 hover:bg-primary-200 disabled:bg-white/10 disabled:text-white/30 text-black rounded-[14px] font-semibold transition-all hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(255,173,184,0.25)]"
                >
                  Connect with Seed
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
