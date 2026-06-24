import Sidebar from './components/Sidebar';
import HeaderBanner from './components/HeaderBanner';
import DashboardPage from './components/DashboardPage';
import AssetLedgerPage from './components/AssetLedgerPage';
import SettingsPage from './components/SettingsPage';
import { AssetProvider, useAssets } from './context/AssetContext';
import './styles/App.css';

function PageContent() {
  const { state } = useAssets();

  switch (state.currentPage) {
    case 'ledger':
      return <AssetLedgerPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <DashboardPage />;
  }
}

export default function App() {
  return (
    <AssetProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <HeaderBanner />
          <main className="main-content">
            <PageContent />
          </main>
        </div>
      </div>
    </AssetProvider>
  );
}
