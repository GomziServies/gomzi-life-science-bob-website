import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
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
import { Seo } from './components/Seo';
import { BackToTop } from './components/BackToTop';
import { HomeSeo } from './components/HomeSeo';
import { GuideSeo } from './components/GuideSeo';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';
import { CustomLabelsPage } from './pages/CustomLabelsPage';
import { BrandingPage } from './pages/BrandingPage';
import { PrivateLabelPage } from './pages/PrivateLabelPage';
import { DropshipPage } from './pages/DropshipPage';
import { AboutPage } from './pages/AboutPage';
import { OrderProvider } from './state/order';
import './styles.css';
import './smooth.css';
import { startSmoothScroll } from './lib/smoothScroll';

/** The customer banner website: mounted at /* by the app's router, its CSS scoped under .site. */
export default function SiteApp() {
  const { pathname } = useLocation();
  useEffect(() => startSmoothScroll(), []);
  return (
    <OrderProvider>
      <div className="site">
        <Header />
        <main key={pathname} className="page-in">
          <Routes>
            <Route index element={<><HomeSeo /><HomePage /></>} />
            <Route path="products" element={<><Seo title="All Products: Whey Protein, Creatine, Pre-Workout & More | Gomzi" description="Browse every private-label product we make: whey protein, plant protein, mass gainer, creatine, BCAA, pre-workout, peanut butter and wellness. Add to your inquiry and design your label." /><HomePage view="products" /></>} />
            <Route path="products/:productId" element={<HomePage view="product" />} />
            <Route path="how-it-works" element={<><GuideSeo kind="how" /><HowItWorksPage /></>} />
            <Route path="about" element={<AboutPage />} />
            <Route path="dropshipping" element={<DropshipPage />} />
            <Route path="how-private-label-works" element={<PrivateLabelPage />} />
            <Route path="custom-branding" element={<BrandingPage />} />
            <Route path="custom-labels" element={<CustomLabelsPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="faq" element={<><GuideSeo kind="faq" /><FaqPage /></>} />
            <Route path="details" element={<><Seo noindex title="Your details | Gomzi Life Science LLP" description="Share your name, brand and contact details to continue your inquiry." /><DetailsPage /></>} />
            <Route path="customize" element={<><Seo noindex title="Your labels | Gomzi Life Science LLP" description="Choose and customise the label for each product in your inquiry." /><CustomizePage /></>} />
            <Route path="customize/:productId" element={<><Seo noindex title="Design your label | Gomzi Life Science LLP" description="Design your own label in our studio." /><DesignPage /></>} />
            <Route path="review" element={<><Seo noindex title="Review your inquiry | Gomzi Life Science LLP" description="Review every product and label before you send your inquiry." /><ReviewPage /></>} />
            <Route path="done/:leadId" element={<><Seo noindex title="Inquiry sent | Gomzi Life Science LLP" description="Your inquiry has been sent to our team." /><DonePage /></>} />
            <Route path="brochure" element={<><Seo title="Product Brochure: Whey Protein, Creatine & More | Gomzi" description="Our full private-label range with flavours, nutrition tables and pack sizes: whey protein, mass gainer, creatine, pre-workout, BCAA and wellness products." /><BrochurePage /></>} />
            <Route path="*" element={<><Seo noindex title="Page not found | Gomzi Life Science LLP" description="This page does not exist." /><section className="section"><div className="wrap" style={{ textAlign: 'center' }}><h1>Page not found</h1><p className="lede">The page you opened does not exist.</p><p><Link className="btn btn-lime" to="/">Back to home</Link></p></div></section></>} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppButton />
        <BackToTop />
      </div>
    </OrderProvider>
  );
}
