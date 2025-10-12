// lib/emailjs-config.ts
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your credentials
export const initEmailJS = () => {
  const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  if (!publicKey) {
    console.warn('EmailJS public key not found');
    return false;
  }
  
  emailjs.init(publicKey);
  return true;
};

// Your EmailJS service configuration
export const EMAILJS_CONFIG = {
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || '',
  templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '',
};