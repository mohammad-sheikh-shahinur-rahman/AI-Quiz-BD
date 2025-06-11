"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const LandingPageClient = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleStartQuiz = () => {
    router.push('/start');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div 
        className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <Logo className="mb-8" />
        <p className="font-headline text-xl sm:text-2xl text-foreground/80 mb-12 animate-fade-in-up animation-delay-300">
          আপনার মেধা যাচাই করুন AI-এর চোখে!
        </p>
        <Button
          size="lg"
          className="animate-pulse-once animation-delay-600 font-semibold text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105"
          onClick={handleStartQuiz}
          aria-label="কুইজ শুরু করুন"
        >
          কুইজ শুরু করুন
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
       <footer className="absolute bottom-6 text-center w-full text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} AI Quiz BD Lite. সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );
};

export default LandingPageClient;

// Add this to your globals.css or tailwind.config.js if you want to use animation-delay utilities
// For tailwind.config.js under theme.extend.animation:
// 'fade-in-up': 'fade-in-up 0.5s ease-out forwards', (already added based on thought process)
// And you can add animationDelay utilities if needed, e.g. with a plugin, or inline style for simplicity.
// For simplicity, let's assume `animate-fade-in-up` already exists and we use inline style for delay if necessary,
// or create utility classes for animation delays if many are needed.
// The prompt implied "stylish animated Bangla UI", so these simple animations should suffice.
// The `animation-delay` classes here are conceptual. You might need to define them or use inline styles.
// Using `animate-fade-in-up` which was added to tailwind.config.ts
// We can create simple delay utilities in globals.css if needed:
// .animation-delay-300 { animation-delay: 300ms; }
// .animation-delay-600 { animation-delay: 600ms; }
// For this, I'll assume `animate-fade-in-up` is sufficient as a base animation for the text.
// The button has `animate-pulse-once`.
