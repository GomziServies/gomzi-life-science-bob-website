import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DetailsPage } from './pages/DetailsPage';
import { CustomizePage } from './pages/CustomizePage';
import { DesignPage } from './pages/DesignPage';
import { ReviewPage } from './pages/ReviewPage';
import { DonePage } from './pages/DonePage';
import { BrochurePage } from './pages/BrochurePage';
import { WhatsAppButton } from './components/WhatsAppButton';
import { OrderProvider } from './state/order';
import './styles.css';

/** The customer banner website: mounted at /shop/* by the app's router, its CSS scoped under .site. */
export default function SiteApp() {
  return (
    <OrderProvider>
      <div className="site">
        <Header />
        <main>
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="details" element={<DetailsPage />} />
            <Route path="customize" element={<CustomizePage />} />
            <Route path="customize/:productId" element={<DesignPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="done/:leadId" element={<DonePage />} />
            <Route path="brochure" element={<BrochurePage />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </OrderProvider>
  );
}
