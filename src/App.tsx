import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { WalletProvider } from "./context/WalletContext";
import DashboardPage from "./pages/DashboardPage";
import FamiliesPage from "./pages/FamiliesPage";
import LedgerPage from "./pages/LedgerPage";
import AdminPage from "./pages/AdminPage";
import DonatePage from "./pages/DonatePage";
import NotFoundPage from "./pages/NotFoundPage";

// CONTRACT_ID is read from VITE_CONTRACT_ID in .env (see .env.example).
// It is re-exported here for any component that imports from App rather than
// stellar.ts directly, but the canonical source is src/lib/stellar.ts.
export { CONTRACT_ID } from "./lib/stellar";

export default function App() {
  return (
    <WalletProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/families" element={<FamiliesPage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </WalletProvider>
  );
}
