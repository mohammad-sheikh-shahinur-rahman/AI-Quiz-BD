
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
import { Award, Share2, RotateCcw, MessageSquareHeart, CheckCircle2, XCircle } from 'lucide-react';
import Logo from './Logo';
import { ScrollArea } from '@/components/ui/scroll-area';

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
          setFinalComment("আপনার প্রচেষ্টার জন্য ধন্যবাদ!"); 
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
        let toastTitle = "ত্রুটি";
        let toastDescription = "শেয়ার করতে একটি অপ্রত্যাশিত সমস্যা হয়েছে।";

        if (error instanceof DOMException) {
          switch (error.name) {
            case 'AbortError':
              toastDescription = "শেয়ার করার প্রক্রিয়া বাতিল করা হয়েছে অথবা কোনো উপযুক্ত অ্যাপ পাওয়া যায়নি।";
              break;
            case 'NotAllowedError':
              toastDescription = "শেয়ার করার অনুমতি দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজার সেটিংস পরীক্ষা করুন।";
              break;
            default:
              toastDescription = `শেয়ার করতে সমস্যা হয়েছে: ${error.message || error.name}`;
          }
        } else if (error instanceof Error) {
          toastDescription = `শেয়ার করতে সমস্যা হয়েছে: ${error.message}`;
        }
        
        toast({ title: toastTitle, description: toastDescription, variant: "destructive" });
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
            <CardDescription className="text-lg sm:text-xl text-foreground/80">আপনার কুইজ সম্পন্ন হয়েছে।</CardDescription>
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
            
            <h3 className="text-xl font-semibold mt-6 mb-3 text-left text-primary">আপনার উত্তরসমূহ বিস্তারিত:</h3>
            <ScrollArea className="max-h-72 w-full pr-3">
              <div className="space-y-3 text-left">
                {quizState.quizHistory.map((item, index) => (
                  <details key={index} className="p-0 border-0 rounded-md overflow-hidden">
                    <summary className="cursor-pointer font-medium text-foreground/90 hover:bg-muted/70 dark:hover:bg-muted/30 p-3 flex justify-between items-center rounded-md border bg-card hover:border-primary/50 transition-all">
                      <span className="truncate max-w-[80%]">প্রশ্ন {index + 1}: {item.questionText.substring(0,50)}{item.questionText.length > 50 ? '...' : ''}</span>
                      {item.isCorrect ? <CheckCircle2 className="text-green-500 ml-2 h-5 w-5 flex-shrink-0"/> : <XCircle className="text-red-500 ml-2 h-5 w-5 flex-shrink-0"/>}
                    </summary>
                    <div className="mt-0 p-3 border border-t-0 rounded-b-md bg-muted/30 dark:bg-card/50 space-y-2 text-sm text-muted-foreground">
                      <p><strong>আপনার উত্তর:</strong> <span className={item.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{item.userSelectedAnswer || "উত্তর দেননি"}</span></p>
                      {!item.isCorrect && <p><strong>সঠিক উত্তর:</strong> <span className="text-green-600 dark:text-green-400">{item.correctAnswerText}</span></p>}
                      <p><strong>AI ফিডব্যাক:</strong> {item.aiFeedback}</p>
                       <p><strong>পয়েন্ট:</strong> {item.pointsAwarded}</p>
                    </div>
                  </details>
                ))}
              </div>
            </ScrollArea>

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
