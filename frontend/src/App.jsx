import { Routes, Route } from 'react-router-dom';
import { WalletProvider } from './hooks/useWallet';
import Layout from './components/Layout';
import Home from './pages/Home';
import CompanyDashboard from './pages/CompanyDashboard';
import Marketplace from './pages/Marketplace';
import NFTDetail from './pages/NFTDetail';
import Portfolio from './pages/Portfolio';
import WalletPage from './pages/WalletPage';

export default function App() {
  return (
    <WalletProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/nft/:id" element={<NFTDetail />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/wallet" element={<WalletPage />} />
        </Routes>
      </Layout>
    </WalletProvider>
  );
}
