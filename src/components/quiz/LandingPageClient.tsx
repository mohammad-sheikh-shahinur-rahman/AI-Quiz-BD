
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Link as LinkIcon, UserCircle } from 'lucide-react';

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

      <div className={`mt-16 w-full max-w-md mx-auto transition-opacity duration-1000 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '500ms' }}>
        <Card className="shadow-xl rounded-lg border border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center mb-2">
              <UserCircle className="w-7 h-7 text-primary mr-2" />
              <CardTitle className="text-xl font-headline text-center text-primary">ডেভেলপার পরিচিতি</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Image 
              src="https://m.media-amazon.com/images/S/amzn-author-media-prod/b02mvc2hucu96hchlksdjmogii._SY450_CR0%2C0%2C450%2C450_.jpg" 
              alt="মোহাম্মদ শেখ শাহিনুর রহমান" 
              width={120} 
              height={120} 
              className="rounded-full mb-4 shadow-md border-2 border-primary/50"
              priority
            />
            <h3 className="text-lg font-semibold text-primary">মোহাম্মদ শেখ শাহিনুর রহমান</h3>
            <div className="text-sm text-foreground/80 mt-2 mb-4 px-2 space-y-1">
              <p>কবি | লেখক</p>
              <p>সফটওয়্যার ইঞ্জিনিয়ার | প্রোগ্রামার</p>
              <p>ডিজিটাল ফরেনসিক বিশেষজ্ঞ</p>
              <p>প্রযুক্তি উদ্ভাবক</p>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-foreground/90 mb-1">আরও জানুন:</p>
              <a 
                href="https://mohammad-sheikh-shahinur-rahman.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-sm text-accent hover:underline hover:text-accent/80 transition-colors"
              >
                <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Personal Website
              </a>
              <br/>
              <a 
                href="http://shahinur.amadersomaj.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-sm text-accent hover:underline hover:text-accent/80 transition-colors"
              >
                <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> AmaderSomaj Profile
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

       <footer className="relative mt-12 mb-6 text-center w-full text-muted-foreground text-xs sm:text-sm">
        <p>এই অ্যাপটি তৈরি করেছেন <span className="font-semibold text-foreground/90">মোহাম্মদ শেখ শাহিনুর রহমান</span>।</p>
        <p>&copy; {new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );
};

export default LandingPageClient;
