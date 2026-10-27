import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { initAnalytics, trackPageView, watchConsentChanges } from "@/lib/analytics";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsent } from "@/components/CookieConsent";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import POS from "@/pages/POS";
import Tables from "@/pages/Tables";
import SuSiparisPage from "@/pages/SuSiparisPage";
import HaliYikamaPage from "@/pages/HaliYikamaPage";
import SuOpsDemo from "@/pages/SuOpsDemo";
import HaliOpsDemo from "@/pages/HaliOpsDemo";
import DriverServicePage from "@/pages/DriverServicePage";
import DeliveryConfirmPage from "@/pages/DeliveryConfirmPage";
import WaterOpsPanel from "@/pages/WaterOpsPanel";
import FleetPage from "@/pages/FleetPage";
import DriverLocationPage from "@/pages/DriverLocationPage";
import Orders from "@/pages/Orders";
import Menu from "@/pages/Menu";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Demo from "@/pages/Demo";
import ForgotPassword from "@/pages/ForgotPassword";
import Register from "@/pages/Register";
import OnboardingTemplates from "@/pages/OnboardingTemplates";
import PublicMenuPage from "@/pages/PublicMenu";
import { VerifyEmailPage, ResetPasswordPage } from "@/pages/AuthToken";
import RestaurantSettingsPage from "@/pages/RestaurantSettings";
import TestCheckoutPage from "@/pages/billing/TestCheckoutPage";
import PlanCheckoutPage from "@/pages/billing/PlanCheckoutPage";
import { PaymentSuccessPage, PaymentFailedPage } from "@/pages/billing/PaymentResultPage";
import LandingPage from "@/pages/LandingPage";
import FeaturesPage from "@/pages/FeaturesPage";
import TemplatesPage from "@/pages/TemplatesPage";
import TemplateDetailPage from "@/pages/TemplateDetailPage";
import TemplateDemoPage from "@/pages/TemplateDemoPage";
import PricingPage from "@/pages/PricingPage";
import DownloadPage from "@/pages/DownloadPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import Blog from "@/pages/Blog";
import BlogDetailPage from "@/pages/BlogDetailPage";
import SolutionsPage from "@/pages/SolutionsPage";
import FeatureDetailPage from "@/pages/FeatureDetailPage";
import AboutSubPage from "@/pages/AboutSubPage";
import PartnersPage from "@/pages/PartnersPage";
import KnowledgeBasePage from "@/pages/KnowledgeBasePage";
import KnowledgeBaseArticlePage from "@/pages/KnowledgeBaseArticlePage";
import ApiDocsPage from "@/pages/ApiDocsPage";
import LegalPage from "@/pages/LegalPage";
import AdminAnalyticsSettings from "@/pages/admin/AdminAnalyticsSettings";
import AdminSectors from "@/pages/admin/AdminSectors";
import AdminIntegrations from "@/pages/admin/AdminIntegrations";
import AdminSms from "@/pages/admin/AdminSms";
import SuccessStoriesPage from "@/pages/SuccessStoriesPage";
import Purchase from "@/pages/Purchase";
import IntegrationPurchase from "@/pages/IntegrationPurchase";
import PlanCheckout from "@/pages/PlanCheckout";

// Adisyo Business Pages
import CafeAutomationPage from "@/pages/CafeAutomationPage";
import RestaurantAutomationPage from "@/pages/RestaurantAutomationPage";
import MultiBranchPage from "@/pages/MultiBranchPage";
import FastFoodPage from "@/pages/FastFoodPage";
import BurgerRestaurantPage from "@/pages/BurgerRestaurantPage";
import SeasonalBusinessPage from "@/pages/SeasonalBusinessPage";
import CloudKitchenPage from "@/pages/CloudKitchenPage";
import PizzaRestaurantPage from "@/pages/PizzaRestaurantPage";
import HotelRestaurantPage from "@/pages/HotelRestaurantPage";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminBusinesses from "@/pages/admin/AdminBusinesses";
import AdminVenues from "@/pages/admin/AdminVenues";
import AdminLicenses from "@/pages/admin/AdminLicenses";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminInvoices from "@/pages/admin/AdminInvoices";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminTemplates from "@/pages/admin/AdminTemplates";
import AdminTemplateBuilder from "@/pages/admin/AdminTemplateBuilder";
import AdminAIBuilder from "@/pages/admin/AdminAIBuilder";
import AdminDemos from "@/pages/admin/AdminDemos";
import { Loader2 } from "lucide-react";
import DesktopDashboard from "@/pages/DesktopDashboard";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DarkModeProvider } from "@/contexts/DarkModeContext";

import OnlineLayout from "@/components/layouts/OnlineLayout";
import PatronLayout from "@/components/layouts/PatronLayout";

// Definition Pages


function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/giris" />;
  }

  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/giris" />;
  }

  if (!user.isPlatformAdmin) {
    return <Redirect to="/desktop" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/ozellikler" component={FeaturesPage} />
      <Route path="/sablonlar" component={TemplatesPage} />
      <Route path="/sablonlar/:slug" component={TemplateDetailPage} />
      <Route path="/sablon-demo/:slug" component={TemplateDemoPage} />
      <Route path="/ozellikler/:slug" component={FeatureDetailPage} />
      <Route path="/fiyatlar" component={PricingPage} />
      <Route path="/indir" component={DownloadPage} />
      <Route path="/fiyatlandirma" component={PlanCheckoutPage} />
      <Route path="/hakkimizda" component={AboutPage} />
      <Route path="/hakkimizda/:slug" component={AboutSubPage} />
      <Route path="/iletisim" component={ContactPage} />
      <Route path="/cozumler/:slug" component={SolutionsPage} />
      
      {/* Adisyo Business Routes */}
      <Route path="/cafe-otomasyon-sistemi" component={CafeAutomationPage} />
      <Route path="/restoran-otomasyon-sistemi" component={RestaurantAutomationPage} />
      <Route path="/coklu-sube-adisyon-pos-sistemi" component={MultiBranchPage} />
      <Route path="/fast-food-isletme-adisyon-programi" component={FastFoodPage} />
      <Route path="/burger-cafe-restoran-adisyon-sistemi" component={BurgerRestaurantPage} />
      <Route path="/sezonluk-isletmeler" component={SeasonalBusinessPage} />
      <Route path="/cloud-kitchen-bulut-mutfak-adisyon-programi-pos-sistemi" component={CloudKitchenPage} />
      <Route path="/pizza-restaurant-pos-otomasyon-sistemi" component={PizzaRestaurantPage} />
      <Route path="/otel-restoran-yazilimi-otel-yazilim-programi" component={HotelRestaurantPage} />
      
      <Route path="/is-ortakligi/:slug" component={PartnersPage} />
      <Route path="/kaynaklar/blog" component={Blog} />
      <Route path="/kaynaklar/blog/:slug" component={BlogDetailPage} />
      <Route path="/kaynaklar/bilgi-merkezi" component={KnowledgeBasePage} />
      <Route path="/kaynaklar/bilgi-merkezi/:slug" component={KnowledgeBaseArticlePage} />
      <Route path="/kaynaklar/api" component={ApiDocsPage} />
      <Route path="/gizlilik" component={() => <LegalPage kind="gizlilik" />} />
      <Route path="/kvkk" component={() => <LegalPage kind="kvkk" />} />
      <Route path="/kosullar" component={() => <LegalPage kind="kosullar" />} />
      <Route path="/basari-hikayeleri" component={SuccessStoriesPage} />
      <Route path="/purchase" component={Purchase} />
      <Route path="/integration-purchase" component={IntegrationPurchase} />
      <Route path="/checkout" component={PlanCheckout} />
      <Route path="/p/:slug" component={PublicMenuPage} />
      <Route path="/dogrula" component={VerifyEmailPage} />
      <Route path="/sifre-sifirla" component={ResetPasswordPage} />
      <Route path="/giris" component={Login} />
      <Route path="/demo" component={Demo} />
      <Route path="/sifremi-unuttum" component={ForgotPassword} />
      <Route path="/kayit" component={Register} />

      <Route path="/sablon-sec">
        {() => <ProtectedRoute component={OnboardingTemplates} />}
      </Route>

      <Route path="/admin">
        {() => <AdminRoute component={AdminOverview} />}
      </Route>
      <Route path="/admin/businesses">
        {() => <AdminRoute component={AdminBusinesses} />}
      </Route>
      <Route path="/admin/venues">
        {() => <AdminRoute component={AdminVenues} />}
      </Route>
      <Route path="/admin/licenses">
        {() => <AdminRoute component={AdminLicenses} />}
      </Route>
      <Route path="/admin/payments">
        {() => <AdminRoute component={AdminPayments} />}
      </Route>
      <Route path="/admin/coupons">
        {() => <AdminRoute component={AdminCoupons} />}
      </Route>
      <Route path="/admin/invoices">
        {() => <AdminRoute component={AdminInvoices} />}
      </Route>
      <Route path="/admin/notifications">
        {() => <AdminRoute component={AdminNotifications} />}
      </Route>
      <Route path="/admin/templates">
        {() => <AdminRoute component={AdminTemplates} />}
      </Route>
      <Route path="/admin/templates/new">
        {() => <AdminRoute component={AdminTemplateBuilder} />}
      </Route>
      <Route path="/admin/templates/:id/edit">
        {() => <AdminRoute component={AdminTemplateBuilder} />}
      </Route>
      <Route path="/admin/ai-builder">
        {() => <AdminRoute component={AdminAIBuilder} />}
      </Route>
      <Route path="/admin/demos">
        {() => <AdminRoute component={AdminDemos} />}
      </Route>
      <Route path="/admin/settings">
        {() => <AdminRoute component={AdminSettings} />}
      </Route>
      <Route path="/admin/settings/analytics">
        {() => <AdminRoute component={AdminAnalyticsSettings} />}
      </Route>
      <Route path="/admin/sectors">
        {() => <AdminRoute component={AdminSectors} />}
      </Route>
      <Route path="/admin/integrations">
        {() => <AdminRoute component={AdminIntegrations} />}
      </Route>
      <Route path="/admin/sms">
        {() => <AdminRoute component={AdminSms} />}
      </Route>

      <Route path="/desktop">
        {() => <ProtectedRoute component={DesktopDashboard} />}
      </Route>

      {/* Restoran Paneli (eski /online) */}
      <Route path="/restoran">
        {() => <ProtectedRoute component={OnlineLayout} />}
      </Route>
      <Route path="/restoran/*">
        {() => <ProtectedRoute component={OnlineLayout} />}
      </Route>
      {/* Geriye dönük uyumluluk: /online → /restoran yönlendirme */}
      <Route path="/online">
        {() => <Redirect to="/restoran" />}
      </Route>
      <Route path="/online/*">
        {() => <Redirect to="/restoran" />}
      </Route>

      {/* Patron Paneli */}
      <Route path="/patron">
        {() => <ProtectedRoute component={PatronLayout} />}
      </Route>
      <Route path="/patron/*">
        {() => <ProtectedRoute component={PatronLayout} />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/dashboard/fleet">
        {() => <ProtectedRoute component={FleetPage} />}
      </Route>
      <Route path="/driver/location">
        {() => <ProtectedRoute component={DriverLocationPage} />}
      </Route>
      <Route path="/surucu" component={() => <Redirect to="/surucu/hali" />} />
      <Route path="/surucu/hali" component={() => <DriverServicePage key="carpet" sector="carpet" />} />
      <Route path="/surucu/su" component={() => <DriverServicePage key="water" sector="water" />} />
      <Route path="/surucu/tup" component={() => <DriverServicePage key="tube" sector="tube" />} />
      <Route path="/teslimat/:rest">
        {({ rest }) => <DeliveryConfirmPage key={rest} code={decodeURIComponent(rest ?? "")} />}
      </Route>
      <Route path="/su-servisi" component={() => <WaterOpsPanel kind="damacana" />} />
      <Route path="/tup-servisi" component={() => <WaterOpsPanel kind="tup" />} />
      <Route path="/su-siparisi" component={SuSiparisPage} />
      <Route path="/hali-yikama" component={HaliYikamaPage} />
      <Route path="/su" component={SuOpsDemo} />
      <Route path="/hali" component={HaliOpsDemo} />
      <Route path="/panel">
        {() => <Redirect to="/dashboard" />}
      </Route>
      <Route path="/pos">
        {() => <ProtectedRoute component={POS} />}
      </Route>
      <Route path="/masalar">
        {() => <ProtectedRoute component={Tables} />}
      </Route>
      <Route path="/siparisler">
        {() => <ProtectedRoute component={Orders} />}
      </Route>
      <Route path="/menu">
        {() => <ProtectedRoute component={Menu} />}
      </Route>
      <Route path="/isletme">
        {() => <ProtectedRoute component={RestaurantSettingsPage} />}
      </Route>
      <Route path="/odeme/test" component={TestCheckoutPage} />
      <Route path="/odeme/basarili" component={PaymentSuccessPage} />
      <Route path="/odeme/basarisiz" component={PaymentFailedPage} />
      <Route path="/ayarlar">
        {() => <ProtectedRoute component={Settings} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AnalyticsTracker() {
  const [location] = useLocation();
  useEffect(() => {
    initAnalytics();
    watchConsentChanges();
  }, []);
  useEffect(() => {
    trackPageView(location);
  }, [location]);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <DarkModeProvider>
          <TooltipProvider>
            <AnalyticsTracker />
            <ImpersonationBanner />
            <Toaster />
            <Router />
            <CookieConsent />
          </TooltipProvider>
        </DarkModeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
