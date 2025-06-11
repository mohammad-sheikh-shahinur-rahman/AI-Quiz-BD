
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, Info } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
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

       <footer className="relative mt-20 mb-6 text-center w-full text-muted-foreground text-xs sm:text-sm">
        <p>এই অ্যাপটি তৈরি করেছেন <span className="font-semibold text-foreground/90">মোহাম্মদ শেখ শাহিনুর রহমান</span>।</p>
        <Link href="/developer" className="inline-flex items-center text-accent hover:underline hover:text-accent/80 transition-colors mt-2">
          <Info className="mr-1.5 h-4 w-4" />
          ডেভেলপার সম্পর্কে বিস্তারিত জানুন
        </Link>
        <p className="mt-2">&copy; {new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );
};

export default LandingPageClient;
