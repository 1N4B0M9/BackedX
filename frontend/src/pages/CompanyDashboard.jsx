import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Coins,
  Package,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import * as api from '../services/api';
import NFTCard from '../components/NFTCard';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

export default function CompanyDashboard() {
  const { wallet, company, setCompany } = useWallet();
  const navigate = useNavigate();

  // Registration form
  const [regName, setRegName] = useState('');
  const [regDesc, setRegDesc] = useState('');

  // Minting form
  const [mintForm, setMintForm] = useState({
    assetName: '',
    assetDescription: '',
    assetType: 'electronics',
    backingXrp: '50',
    listPriceXrp: '60',
    quantity: '1',
  });

  // State
  const [companyData, setCompanyData] = useState(null);
  const [companyNFTs, setCompanyNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (company?.id) loadCompanyData();
  }, [company?.id]);

  const loadCompanyData = async () => {
    if (!company?.id) return;
    try {
      const [compRes, nftRes] = await Promise.all([
        api.getCompany(company.id),
        api.getCompanyNFTs(company.id),
      ]);
      setCompanyData(compRes.data.company);
      setCompanyNFTs(nftRes.data.nfts);
    } catch (err) {
      console.error('Failed to load company data:', err);
    }
  };

  const handleRegister = async () => {
    if (!wallet) {
      navigate('/wallet');
      return;
    }
    if (!regName.trim()) {
      setError('Company name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.registerCompany(regName.trim(), regDesc.trim());
      setCompany(data.company);
      setCompanyData(data.company);
      setSuccess('Company registered successfully! Wallet funded with testnet XRP.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    setMinting(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.mintNFTs(company.id, {
        assetName: mintForm.assetName || `${companyData?.name || 'Company'} Phone`,
        assetDescription: mintForm.assetDescription || 'Premium electronics asset-backed NFT',
        assetType: mintForm.assetType,
        backingXrp: parseFloat(mintForm.backingXrp),
        listPriceXrp: parseFloat(mintForm.listPriceXrp),
        quantity: parseInt(mintForm.quantity),
      });
      setSuccess(data.message);
      loadCompanyData();
    } catch (err) {
      setError(err.response?.data?.error || 'Minting failed');
    } finally {
      setMinting(false);
    }
  };

  if (!wallet) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Building2 className="w-16 h-16 text-surface-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Company Dashboard</h2>
        <p className="text-surface-400 mb-6">Connect a wallet to register your company and start minting NFTs</p>
        <button
          onClick={() => navigate('/wallet')}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-500 rounded-xl font-semibold transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Not yet registered
  if (!company) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Register Company</h1>
          <p className="text-surface-400 mt-2">Set up your company to start minting asset-backed NFTs</p>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name *</label>
            <input
              type="text"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="e.g., TechCorp"
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={regDesc}
              onChange={(e) => setRegDesc(e.target.value)}
              placeholder="What does your company do?"
              rows={3}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Registering on XRPL...
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                Register & Create Wallet
              </>
            )}
          </button>

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
    );
  }

  // Registered company dashboard
  return (
    <div className="animate-fade-in space-y-8">
      {/* Company Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary-400" />
            {companyData?.name || company.name}
          </h1>
          <p className="text-surface-400 mt-1">{companyData?.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={companyData?.verification_tier || 'basic'} />
          <button
            onClick={loadCompanyData}
            className="p-2 bg-surface-800 rounded-lg hover:bg-surface-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Wallet Balance', value: `${parseFloat(companyData?.live_xrp_balance || 0).toFixed(1)} XRP`, icon: Coins, color: 'text-blue-400' },
          { label: 'Escrow Locked', value: `${parseFloat(companyData?.escrow_balance || 0).toFixed(1)} XRP`, icon: ShieldCheck, color: 'text-green-400' },
          { label: 'NFTs Minted', value: companyNFTs.length, icon: Package, color: 'text-purple-400' },
          { label: 'Listed', value: companyNFTs.filter(n => n.status === 'listed').length, icon: ChevronRight, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-surface-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Mint Form */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Plus className="w-5 h-5 text-primary-400" />
          Mint New NFTs
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Asset Name</label>
            <input
              type="text"
              value={mintForm.assetName}
              onChange={(e) => setMintForm({ ...mintForm, assetName: e.target.value })}
              placeholder="e.g., iPhone 15 Pro"
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Asset Type</label>
            <select
              value={mintForm.assetType}
              onChange={(e) => setMintForm({ ...mintForm, assetType: e.target.value })}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="electronics">Electronics</option>
              <option value="phones">Phones</option>
              <option value="laptops">Laptops</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={mintForm.assetDescription}
              onChange={(e) => setMintForm({ ...mintForm, assetDescription: e.target.value })}
              placeholder="Describe the asset..."
              rows={2}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Backing (XRP per NFT)</label>
            <input
              type="number"
              value={mintForm.backingXrp}
              onChange={(e) => setMintForm({ ...mintForm, backingXrp: e.target.value })}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">List Price (XRP)</label>
            <input
              type="number"
              value={mintForm.listPriceXrp}
              onChange={(e) => setMintForm({ ...mintForm, listPriceXrp: e.target.value })}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              max="20"
              value={mintForm.quantity}
              onChange={(e) => setMintForm({ ...mintForm, quantity: e.target.value })}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-end">
            <div className="bg-surface-800 rounded-xl p-4 w-full text-center">
              <p className="text-xs text-surface-500">Total Escrow Required</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {(parseFloat(mintForm.backingXrp || 0) * parseInt(mintForm.quantity || 0)).toFixed(1)} XRP
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleMint}
          disabled={minting}
          className="mt-6 w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 disabled:from-surface-700 disabled:to-surface-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          {minting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Minting on XRPL... (this may take a moment)
            </>
          ) : (
            <>
              <Coins className="w-4 h-4" />
              Mint & List NFTs
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-xl text-sm text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-xl text-sm text-green-400">
            {success}
          </div>
        )}
      </div>

      {/* Company NFTs */}
      {companyNFTs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Your NFTs ({companyNFTs.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {companyNFTs.map((nft) => (
              <NFTCard key={nft.id} nft={{ ...nft, company_name: companyData?.name }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
