import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Settings, Zap, Users, ArrowRight, CheckCircle, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo.png';
import { useState } from 'react';

interface LandingPageProps {
  // No props needed as routing is handled internally
}

const COLORS = {
  primary: {
    light: '#7BA4D0',
    main: '#5483B3',
    dark: '#3A5C80',
    gradient: 'from-[#7BA4D0] to-[#5483B3]',
    lightBg: 'bg-[#F0F5FC]'
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const featureVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
};

const LandingPage: React.FC<LandingPageProps> = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    navigate('/login');
    setIsMobileMenuOpen(false);
  };
  
  const handleSignup = () => {
    navigate('/signup');
    setIsMobileMenuOpen(false);
  };
  
  const handleDemo = () => navigate('/demo');

  const features = [
    {
      icon: ClipboardList,
      title: "Ticket Submission & Tracking",
      description: "Submit new tickets and track progress easily with a user-friendly interface.",
      color: "from-[#7BA4D0] to-[#5483B3]",
    },
    {
      icon: Settings,
      title: "Admin Controls & Status Management",
      description: "Admins manage tickets, update statuses (Open, In Progress, Closed), and oversee issue resolution.",
      color: "from-[#85B8D0] to-[#5A9BB8]",
    },
    {
      icon: Zap,
      title: "Real-Time Notifications",
      description: "Integrated Microsoft Teams alerts keep your team updated on ticket activity instantly.",
      color: "from-[#7BD0C5] to-[#5AB8A8]",
    },
    {
      icon: Users,
      title: "Dashboard Overview",
      description: "Organized dashboard for ticket stats, latest updates, and easy navigation.",
      color: "from-[#D0857B] to-[#B85A5A]",
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Streamlined Support Process",
      description: "Centralize communication to speed up issue resolution and improve user satisfaction.",
    },
    {
      icon: Settings,
      title: "Secure & Role-Based Access",
      description: "Row-level security ensures users only see their tickets; admins have full control.",
    },
    {
      icon: Users,
      title: "Integration & Scalability",
      description: "Easily integrates with Microsoft Teams and scales to accommodate your team's growth.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      {/* Navigation - Mobile Optimized */}
      <nav className="bg-gradient-to-r from-[#5483B3] to-[#7BA4D0] py-3 px-4 sm:px-6 lg:px-8 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2 sm:space-x-3"
          >
            <img src={Logo} alt="Hapo Desk Logo" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />
            <span className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">Hapo Desk</span>
          </motion.div>
          
          {/* Desktop Navigation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden md:flex items-center space-x-4"
          >
            <button
              onClick={handleLogin}
              className="text-white/90 hover:text-white font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-white/10 backdrop-blur-sm"
            >
              Sign In
            </button>
            <button
              onClick={handleSignup}
              className="bg-white text-[#5483B3] px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold hover:bg-blue-50 hover:shadow-lg transition-all duration-300 shadow-md text-sm sm:text-base"
            >
              Get Started
            </button>
          </motion.div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/10 backdrop-blur-md mt-4 rounded-lg p-4"
          >
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleLogin}
                className="text-white text-left py-2 px-4 rounded-lg hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={handleSignup}
                className="bg-white text-[#5483B3] py-2 px-4 rounded-lg font-semibold text-center transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section - Mobile Optimized */}
      <section className="relative bg-gradient-to-br from-[#F0F5FC] to-[#E8F0FA] py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-5xl mx-auto"
          >
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight"
            >
              Service Desk Made{' '}
              <span className="relative inline-block">
                Simple
                <span className="absolute bottom-0 left-0 w-full h-1 bg-[#5483B3] rounded-full"></span>
              </span>{' '}
              with Hapo Desk
            </motion.h1>
            
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-2"
            >
              A web-based platform that centralizes IT service requests, ticket tracking, and support collaboration — helping teams resolve issues faster with real-time notifications.
            </motion.p>
            
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16"
            >
              <button
                onClick={handleSignup}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#5483B3] text-white font-semibold rounded-xl shadow-lg hover:bg-[#3A5C80] hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleDemo}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-[#5483B3] hover:text-[#5483B3] transition-all duration-300 text-sm sm:text-base"
              >
                Watch Demo
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Dashboard preview - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="max-w-6xl mx-auto mt-12 sm:mt-16 md:mt-20 lg:mt-24 flex items-center justify-center"
        >
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border border-gray-100 p-2 w-full max-w-4xl mx-4">
            <div className="bg-gradient-to-br from-gray-900 to-[#3A5C80] rounded-lg sm:rounded-xl p-6 sm:p-8 min-h-[300px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center">
              <div className="text-center text-white px-2">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Hapo Desk Dashboard</div>
                <p className="text-gray-300 text-sm sm:text-base">Interactive preview of your future command center</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid - Mobile Optimized */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Everything You Need
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              Powerful features designed to streamline your service desk operations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={featureVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gray-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:bg-white hover:shadow-xl transition-all duration-500 border border-gray-100"
              >
                <div className={`bg-gradient-to-r ${feature.color} w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon size={24} className="sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Mobile Optimized */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-[#F8FAFD] border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Why Choose Hapo Desk?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              Built with modern teams in mind, designed for real-world service desk challenges
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.2 }}
                className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="bg-[#5483B3] w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-4 sm:mb-6 mx-auto shadow-lg">
                  <benefit.icon size={24} className="sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-gradient-to-br from-[#3A5C80] to-[#5483B3] text-white py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <img src={Logo} alt="Hapo Desk Logo" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />
                <span className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">Hapo Desk</span>
              </div>
              <p className="text-blue-100 max-w-md leading-relaxed text-sm sm:text-base">
                Streamlining IT support with intelligent ticketing, real-time collaboration, 
                and seamless team integration for faster issue resolution.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-white">Product</h3>
              <ul className="space-y-2 sm:space-y-3 text-blue-100 text-sm sm:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-white">Support</h3>
              <ul className="space-y-2 sm:space-y-3 text-blue-100 text-sm sm:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 border-t border-blue-300/30 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="text-blue-100 text-xs sm:text-sm text-center md:text-left">
              &copy; {new Date().getFullYear()} Hapo Desk. All rights reserved.
            </div>
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
              <a href="#" className="text-blue-100 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-blue-100 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-blue-100 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;