import React from 'react';
import { motion } from 'framer-motion';
// Import any Lucide icons you might use in the future, if not already global
// import { PlusCircle, Users, ShieldCheck } from 'lucide-react'; // Example icons

// Changed prop interface to match what App.tsx is passing
interface LandingPageProps {
  onStartLogin: () => void;  // Renamed and changed signature
  onStartSignup: () => void; // Renamed and changed signature
}

const featureVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const LandingPage: React.FC<LandingPageProps> = ({ onStartLogin, onStartSignup }) => { // Destructure new prop names
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-28 px-6 flex flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold mb-4"
        >
          Welcome to ServiceDesk Plus Cloud
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg mb-10 max-w-2xl"
        >
          Simplify ticket management, scheduling, equipment tracking, and team collaboration – all in one place.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex gap-4"
        >
          <button
            onClick={onStartLogin} // Call the new prop function
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Login
          </button>
          <button
            onClick={onStartSignup} // Call the new prop function
            className="px-8 py-3 bg-transparent border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition"
          >
            Sign Up
          </button>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50 text-gray-900">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          Key Features
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <motion.div
            variants={featureVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition"
          >
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <span className="text-blue-600 text-3xl">📋</span>
            </div>
            <h3 className="font-semibold text-xl mb-2">Ticket Management</h3>
            <p className="text-gray-600">
              Create, assign, track, and resolve tickets efficiently for your team.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            variants={featureVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition"
          >
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <span className="text-green-600 text-3xl">🛠️</span>
            </div>
            <h3 className="font-semibold text-xl mb-2">Equipment Tracking</h3>
            <p className="text-gray-600">
              Monitor and manage all technical equipment with ease and accountability.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            variants={featureVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition"
          >
            <div className="bg-purple-100 p-4 rounded-full mb-4">
              <span className="text-purple-600 text-3xl">📅</span>
            </div>
            <h3 className="font-semibold text-xl mb-2">Scheduler & Calendar</h3>
            <p className="text-gray-600">
              Organize meetings, maintenance, and on-call schedules all in one calendar.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-blue-600 text-white text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-4"
        >
          Get Started Today!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 max-w-xl mx-auto"
        >
          Sign up now to streamline your service desk operations and empower your team.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          onClick={onStartSignup} // Call the new prop function
          className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
        >
          Create an Account
        </motion.button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6">
        &copy; {new Date().getFullYear()} ServiceDesk Plus Cloud. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;