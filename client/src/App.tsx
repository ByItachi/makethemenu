import { Switch, Route, Redirect } from "wouter";
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
import Orders from "@/pages/Orders";
import Menu from "@/pages/Menu";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Demo from "@/pages/Demo";
import ForgotPassword from "@/pages/ForgotPassword";
import Register from "@/pages/Register";
import PublicMenuPage from "@/pages/PublicMenu";
import { VerifyEmailPage, ResetPasswordPage } from "@/pages/AuthToken";
import RestaurantSettingsPage from "@/pages/RestaurantSettings";
import TestCheckoutPage from "@/pages/billing/TestCheckoutPage";
import PlanCheckoutPage from "@/pages/billing/PlanCheckoutPage";
import { PaymentSuccessPage, PaymentFailedPage } from "@/pages/billing/PaymentResultPage";
import LandingPage from "@/pages/LandingPage";
import FeaturesPage from "@/pages/FeaturesPage";
import TemplatesPage from "@/pages/TemplatesPage";
import PricingPage from "@/pages/PricingPage";
import DownloadPage from "@/pages/DownloadPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import Blog from "@/pages/Blog";
import SolutionsPage from "@/pages/SolutionsPage";
import FeatureDetailPage from "@/pages/FeatureDetailPage";
import AboutSubPage from "@/pages/AboutSubPage";
import PartnersPage from "@/pages/PartnersPage";
import KnowledgeBasePage from "@/pages/KnowledgeBasePage";
import ApiDocsPage from "@/pages/ApiDocsPage";
import SuccessStoriesPage from "@/pages/SuccessStoriesPage";
import Purchase from "@/pages/Purchase";
import IntegrationPurchase from "@/pages/IntegrationPurchase";

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/ozellikler" component={FeaturesPage} />
      <Route path="/sablonlar" component={TemplatesPage} />
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
      <Route path="/kaynaklar/bilgi-merkezi" component={KnowledgeBasePage} />
      <Route path="/kaynaklar/api" component={ApiDocsPage} />
      <Route path="/basari-hikayeleri" component={SuccessStoriesPage} />
      <Route path="/purchase" component={Purchase} />
      <Route path="/integration-purchase" component={IntegrationPurchase} />
      <Route path="/p/:slug" component={PublicMenuPage} />
      <Route path="/dogrula" component={VerifyEmailPage} />
      <Route path="/sifre-sifirla" component={ResetPasswordPage} />
      <Route path="/giris" component={Login} />
      <Route path="/demo" component={Demo} />
      <Route path="/sifremi-unuttum" component={ForgotPassword} />
      <Route path="/kayit" component={Register} />

      <Route path="/admin" component={AdminOverview} />
      <Route path="/admin/businesses" component={AdminBusinesses} />
      <Route path="/admin/venues" component={AdminVenues} />
      <Route path="/admin/licenses" component={AdminLicenses} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin/coupons" component={AdminCoupons} />
      <Route path="/admin/invoices" component={AdminInvoices} />
      <Route path="/admin/notifications" component={AdminNotifications} />
      <Route path="/admin/settings" component={AdminSettings} />

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
      <Route path="/panel">
        {() => <ProtectedRoute component={Dashboard} />}
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <DarkModeProvider>
          <TooltipProvider>
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
