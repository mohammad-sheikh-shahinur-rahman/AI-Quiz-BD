"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateFinalComment } from '@/ai/flows/generate-final-comment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import type { QuizState } from '@/types/quiz';
import { QUIZ_STORAGE_KEY, USER_NAME_STORAGE_KEY, TOTAL_QUESTIONS, POINTS_PER_CORRECT_ANSWER } from '@/constants/quiz';
import { Award, Share2, RotateCcw, MessageSquareHeart } from 'lucide-react';
import Logo from './Logo';

const ResultDisplay = () => {
  const router = useRouter();
  const { toast } = useToast();

  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [finalComment, setFinalComment] = useState<string | null>(null);
  const [isLoadingComment, setIsLoadingComment] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    if (typeof window !== 'undefined') {
      const storedState = localStorage.getItem(QUIZ_STORAGE_KEY);
      const storedName = localStorage.getItem(USER_NAME_STORAGE_KEY);

      if (!storedState || !storedName) {
        toast({ title: "ত্রুটি", description: "ফলাফল খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আবার কুইজ শুরু করুন।", variant: "destructive" });
        router.replace('/start');
        return;
      }
      
      const parsedState: QuizState = JSON.parse(storedState);
      setQuizState(parsedState);

      generateFinalComment({ score: parsedState.totalScore, name: parsedState.userName || 'বন্ধু' })
        .then(commentData => setFinalComment(commentData.comment))
        .catch(error => {
          console.error("Failed to generate final comment:", error);
          setFinalComment("আপনার প্রচেষ্টার জন্য ধন্যবাদ!"); // Fallback comment
        })
        .finally(() => setIsLoadingComment(false));
    }
    return () => clearTimeout(timer);
  }, [router, toast]);

  const handleShare = async () => {
    if (!quizState) return;
    const shareText = `আমি AI কুইজ বাংলাদেশ-এ ${quizState.totalScore} স্কোর করেছি! আপনিও যোগ দিন।`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI কুইজ বাংলাদেশ - আমার স্কোর',
          text: shareText,
          url: shareUrl,
        });
        toast({ title: "সফল", description: "ফলাফল শেয়ার করা হয়েছে!" });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({ title: "ত্রুটি", description: "শেয়ার করতে সমস্যা হয়েছে।", variant: "destructive" });
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({ title: "সফল", description: "ফলাফল ক্লিপবোর্ডে কপি করা হয়েছে!" });
      } catch (error) {
        toast({ title: "ত্রুটি", description: "ক্লিপবোর্ডে কপি করতে সমস্যা হয়েছে।", variant: "destructive" });
      }
    } else {
      toast({ title: "দুঃখিত", description: "আপনার ব্রাউজারে স্বয়ংক্রিয় শেয়ারিং সাপোর্ট করে না।", variant: "destructive" });
    }
  };

  const handlePlayAgain = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(QUIZ_STORAGE_KEY);
      // Keep username for convenience or remove it too based on preference
      // localStorage.removeItem(USER_NAME_STORAGE_KEY); 
    }
    router.push('/start');
  };

  if (!quizState) {
    return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
  }

  const percentageScore = (quizState.totalScore / (TOTAL_QUESTIONS * POINTS_PER_CORRECT_ANSWER)) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 bg-background">
       <div className={`w-full max-w-xl transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <Logo className="mb-6" />
        <Card className="shadow-2xl rounded-xl text-center">
          <CardHeader>
            <Award className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <CardTitle className="text-3xl sm:text-4xl font-headline text-primary">অভিনন্দন, {quizState.userName}!</CardTitle>
            <CardDescription className="text-lg sm:text-xl">আপনার কুইজ সম্পন্ন হয়েছে।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-5xl sm:text-6xl font-bold text-accent">
              {quizState.totalScore} <span className="text-2xl text-foreground/70">/ {TOTAL_QUESTIONS * POINTS_PER_CORRECT_ANSWER}</span>
            </div>
            <div className="text-lg text-foreground/80">
              আপনি <span className="font-semibold text-primary">{TOTAL_QUESTIONS}</span> টি প্রশ্নের মধ্যে <span className="font-semibold text-primary">{quizState.quizHistory.filter(h => h.isCorrect).length}</span> টির সঠিক উত্তর দিয়েছেন। ({percentageScore.toFixed(0)}%)
            </div>

            <div className="p-4 border rounded-lg bg-muted/50 min-h-[80px] flex items-center justify-center">
              {isLoadingComment ? (
                <LoadingSpinner size="sm" />
              ) : (
                <p className="text-md sm:text-lg text-foreground italic flex items-center">
                  <MessageSquareHeart className="w-5 h-5 mr-2 text-pink-500 flex-shrink-0" />
                  {finalComment || "আপনার প্রচেষ্টার জন্য ধন্যবাদ!"}
                </p>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mt-6 mb-2 text-left text-primary">আপনার উত্তরসমূহ:</h3>
            <div className="max-h-60 overflow-y-auto space-y-3 text-left pr-2">
              {quizState.quizHistory.map((item, index) => (
                <details key={index} className="p-3 border rounded-md bg-card/80">
                  <summary className="cursor-pointer font-medium text-foreground/90 hover:text-primary">
                    প্রশ্ন {index + 1}: {item.questionText.substring(0,50)}... 
                    {item.isCorrect ? <span className="text-green-500 ml-2">(সঠিক)</span> : <span className="text-red-500 ml-2">(ভুল)</span>}
                  </summary>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p><strong>আপনার উত্তর:</strong> {item.userSelectedAnswer || "উত্তর দেননি"}</p>
                    {!item.isCorrect && <p><strong>সঠিক উত্তর:</strong> {item.correctAnswerText}</p>}
                    <p><strong>AI ফিডব্যাক:</strong> {item.aiFeedback}</p>
                  </div>
                </details>
              ))}
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <Button onClick={handlePlayAgain} size="lg" variant="outline" className="font-semibold text-lg">
              <RotateCcw className="mr-2 h-5 w-5" />
              আবার খেলুন
            </Button>
            <Button onClick={handleShare} size="lg" className="font-semibold text-lg bg-accent hover:bg-accent/90">
              <Share2 className="mr-2 h-5 w-5" />
              শেয়ার করুন
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResultDisplay;
