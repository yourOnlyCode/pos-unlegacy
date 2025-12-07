import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import {
  Restaurant,
  Coffee,
  LocalCafe,
  Storefront,
  Speed,
  AttachMoney,
  Smartphone,
  CheckCircle,
} from '@mui/icons-material';
import Navigation from './splash-page/Navigation';
import HeroSection from './splash-page/HeroSection';
import FeaturesSection from './splash-page/FeaturesSection';
import PricingSection from './splash-page/PricingSection';
import HowItWorksSection from './splash-page/HowItWorksSection';
import CTASection from './splash-page/CTASection';
import ContactSection from './splash-page/ContactSection';
import Footer from './splash-page/Footer';

const BUSINESSES = [
  {
    name: 'Downtown Cafe',
    type: 'Coffee Shop',
    icon: <Coffee />,
    color: '#8B4513',
    orders: '2,500+',
    description: 'Streamlined SMS ordering for busy mornings',
  },
  {
    name: 'Bella Vista',
    type: 'Italian Restaurant',
    icon: <Restaurant />,
    color: '#C8102E',
    orders: '3,800+',
    description: 'Elegant table ordering without the wait',
  },
  {
    name: 'Morning Brew',
    type: 'Coffee & Pastries',
    icon: <LocalCafe />,
    color: '#6F4E37',
    orders: '1,900+',
    description: 'Quick orders, happy customers',
  },
  {
    name: 'The Corner Store',
    type: 'Convenience Store',
    icon: <Storefront />,
    color: '#2E7D32',
    orders: '5,200+',
    description: 'Text-to-order for on-the-go customers',
  },
];

const FEATURES = [
  {
    icon: <Smartphone fontSize="large" />,
    title: 'SMS Ordering',
    description: 'Customers order via text - no app required',
  },
  {
    icon: <Speed fontSize="large" />,
    title: 'Lightning Fast',
    description: 'Orders processed in seconds with AI parsing',
  },
  {
    icon: <AttachMoney fontSize="large" />,
    title: 'Simple Pricing',
    description: 'Pay only for what you use - no hidden fees',
  },
  {
    icon: <CheckCircle fontSize="large" />,
    title: 'Easy Setup',
    description: 'Get started in minutes, not days',
  },
];

const PRICING_TIERS = [
  {
    name: 'Upgrade',
    price: '.25%',
    period: '/transaction',
    features: [
      'Add on to your existing POS provider',
      'SMS ordering',
      'Basic analytics',
      'Email support',
      'Single location',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Suite',
    price: '.35%',
    period: '/transaction',
    features: [
      'SMS ordering',
      'Advanced analytics',
      'Priority support',
      'Multi-location support',
      'Custom branding',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Expansion',
    price: 'Custom',
    period: '',
    features: [
      'SMS ordering',
      'Full analytics suite',
      'Unlimited locations',
      'Custom integrations',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function SplashPage() {
  const [currentBusinessIndex, setCurrentBusinessIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBusinessIndex((prev) => (prev + 1) % BUSINESSES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Navigation onNavigate={scrollToSection} />
      <HeroSection
        currentBusiness={BUSINESSES[currentBusinessIndex]}
        businesses={BUSINESSES}
        currentBusinessIndex={currentBusinessIndex}
        onNavigate={scrollToSection}
      />
      <FeaturesSection features={FEATURES} />
      <PricingSection tiers={PRICING_TIERS} />
      <HowItWorksSection />
      <CTASection onNavigate={scrollToSection} />
      <ContactSection />
      <Footer />
    </Box>
  );
}
