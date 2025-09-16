import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Settings, CalendarDays } from 'lucide-react'; // Lucide Icons

interface LandingPageProps {
  onStartLogin: () => void;
  onStartSignup: () => void;
}

const featureVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const LandingPage: React.FC<LandingPageProps> = ({ onStartLogin, onStartSignup }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-28 px-6 flex flex-col items-center text-center relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Subtle geometric pattern or lines */}
          <svg className="absolute w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 L 0 10" fill="none" stroke="currentColor" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold mb-4 relative z-10"
        >
          Welcome to ServiceDesk Plus Cloud
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg mb-10 max-w-2xl relative z-10"
        >
          Simplify ticket management, scheduling, equipment tracking, and team collaboration – all in one place.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col items-center gap-4 relative z-10" // Changed to flex-col and items-center
        >
          <button
            onClick={onStartSignup}
            className="px-10 py-4 bg-blue-500 border border-blue-500 text-white font-semibold rounded-full shadow-lg hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 transform hover:-translate-y-1 text-lg" // Larger, bolder button
          >
            Sign Up
          </button>
          <p className="text-sm mt-2">
            Already have an account?{' '}
            <button 
              onClick={onStartLogin} 
              className="text-white underline hover:text-blue-200 transition-colors duration-300 focus:outline-none"
            >
              Login here
            </button>
          </p>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white text-gray-900">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-4xl font-extrabold text-center mb-16"
        >
          Key Features
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Feature 1: Ticket Management */}
          <motion.div
            variants={featureVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="bg-gray-50 rounded-xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="bg-blue-100 p-4 rounded-full mb-6 text-blue-600">
              <ClipboardList size={36} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-2xl mb-3 text-gray-800">Ticket Management</h3>
            <p className="text-gray-600 leading-relaxed">
              Create, assign, track, and resolve tickets efficiently for your team, ensuring no issue is missed.
            </p>
          </motion.div>

          {/* Feature 2: Equipment Tracking */}
          <motion.div
            variants={featureVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-50 rounded-xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="bg-blue-100 p-4 rounded-full mb-6 text-blue-600">
              <Settings size={36} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-2xl mb-3 text-gray-800">Equipment Tracking</h3>
            <p className="text-gray-600 leading-relaxed">
              Monitor and manage all technical equipment with ease, maintaining accountability and lifecycle.
            </p>
          </motion.div>

          {/* Feature 3: Scheduler & Calendar */}
          <motion.div
            variants={featureVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-50 rounded-xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="bg-blue-100 p-4 rounded-full mb-6 text-blue-600">
              <CalendarDays size={36} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-2xl mb-3 text-gray-800">Scheduler & Calendar</h3>
            <p className="text-gray-600 leading-relaxed">
              Organize meetings, maintenance, and on-call schedules, keeping everyone synchronized effortlessly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-blue-700 text-white text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-4xl font-bold mb-4"
        >
          Ready to Elevate Your Service Desk?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          className="mb-8 max-w-xl mx-auto text-lg"
        >
          Join countless businesses simplifying their operations and enhancing team productivity with ServiceDesk Plus Cloud.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          onClick={onStartSignup}
          className="px-10 py-4 bg-white text-blue-700 font-bold rounded-full shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 text-lg"
        >
          Start Your Free Trial
        </motion.button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        &copy; {new Date().getFullYear()} ServiceDesk Plus Cloud. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;