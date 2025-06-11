"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { USER_NAME_STORAGE_KEY, QUIZ_STORAGE_KEY } from '@/constants/quiz';
import { useToast } from "@/hooks/use-toast";

const NameEntryForm = () => {
  const [name, setName] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    // Clear any previous quiz state when starting anew
    if (typeof window !== 'undefined') {
      localStorage.removeItem(QUIZ_STORAGE_KEY);
    }
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      toast({
        title: "ত্রুটি",
        description: "অনুগ্রহ করে আপনার নাম লিখুন।",
        variant: "destructive",
      });
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_NAME_STORAGE_KEY, name.trim());
    }
    router.push('/quiz');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div 
        className={`w-full max-w-md transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <Logo className="mb-6" />
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center text-primary">কুইজে স্বাগতম!</CardTitle>
            <CardDescription className="text-center">
              কুইজ শুরু করার জন্য আপনার নাম লিখুন।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground/90 font-medium">আপনার নাম</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="এখানে আপনার নাম লিখুন"
                  required
                  className="text-lg"
                />
              </div>
              <Button type="submit" className="w-full text-lg py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition-shadow transform hover:scale-105">
                কুইজ শুরু করুন
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NameEntryForm;
