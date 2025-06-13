
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateFinalComment } from '@/ai/flows/generate-final-comment';
import { generateResultImage, type GenerateResultImageOutput } from '@/ai/flows/generate-result-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import type { QuizState } from '@/types/quiz';
import { QUIZ_STORAGE_KEY, USER_NAME_STORAGE_KEY, TOTAL_QUESTIONS, POINTS_PER_CORRECT_ANSWER, QUIZ_TOPICS, DEFAULT_QUIZ_TOPIC } from '@/constants/quiz';
import { Award, Share2, RotateCcw, MessageSquareHeart, CheckCircle2, XCircle, Image as ImageIcon, Download } from 'lucide-react';
import Logo from './Logo';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image'; // Using next/image for optimized image display

async function dataUriToImageFile(dataUri: string, fileName: string): Promise<File | null> {
  try {
    const response = await fetch(dataUri);
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) {
      console.error("Fetched data is not an image blob:", blob.type);
      return null; 
    }
    return new File([blob], fileName, { type: blob.type });
  } catch (error) {
    console.error("Error converting data URI to file:", error);
    return null;
  }
}


const ResultDisplay = () => {
  const router = useRouter();
  const { toast } = useToast();

  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [finalComment, setFinalComment] = useState<string | null>(null);
  const [isLoadingComment, setIsLoadingComment] = useState(true);
  const [resultImageDataUri, setResultImageDataUri] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const getQuizTopicLabel = useCallback((topicValue: string) => {
    const topic = QUIZ_TOPICS.find(t => t.value === topicValue);
    return topic ? topic.label : DEFAULT_QUIZ_TOPIC;
  }, []);


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

      generateResultImage({ 
        name: parsedState.userName || 'অংশগ্রহণকারী', 
        score: parsedState.totalScore,
        totalPossibleScore: TOTAL_QUESTIONS * POINTS_PER_CORRECT_ANSWER,
        quizTopicLabel: getQuizTopicLabel(parsedState.quizTopic)
      })
        .then((imageOutput: GenerateResultImageOutput) => {
          setResultImageDataUri(imageOutput.imageDataUri);
        })
        .catch(error => {
          console.error("Failed to generate result image:", error);
          let description = "ফলাফলের ছবি তৈরি করা যায়নি।";
          if (error instanceof Error) {
            if (error.message.includes("503") || error.message.toLowerCase().includes("overloaded") || error.message.toLowerCase().includes("service unavailable")) {
              description = "ফলাফলের ছবি এই মুহূর্তে তৈরি করা যাচ্ছে না কারণ মডেলটি ব্যস্ত আছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।";
            } else if (error.message.toLowerCase().includes("blocked") || error.message.toLowerCase().includes("safety settings")) {
              description = "নিরাপত্তা নীতিমালার কারণে ফলাফলের ছবিটি তৈরি করা সম্ভব হয়নি।";
            }
          }
          toast({ 
            title: "ছবি তৈরি ত্রুটি", 
            description: description, 
            variant: "destructive" 
          });
        })
        .finally(() => setIsLoadingImage(false));
    }
    return () => clearTimeout(timer);
  }, [router, toast, getQuizTopicLabel]);

  const handleShare = async () => {
    if (!quizState) return;
    const shareText = `আমি AI কুইজ বাংলাদেশ (${getQuizTopicLabel(quizState.quizTopic)})-এ ${quizState.totalScore} স্কোর করেছি! আপনিও যোগ দিন।`;
    const shareUrl = window.location.origin;
    const shareTitle = `AI কুইজ বাংলাদেশ - ${quizState.userName}-এর স্কোর`;

    let imageFile: File | null = null;
    if (resultImageDataUri) {
      imageFile = await dataUriToImageFile(resultImageDataUri, `AI_Quiz_BD_Result_${quizState.userName}.png`);
    }

    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        };
        if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          shareData.files = [imageFile];
        }
        
        await navigator.share(shareData);
        toast({ title: "সফল", description: "ফলাফল শেয়ার করা হয়েছে!" });

      } catch (error) {
        let toastTitle = "শেয়ার ত্রুটি";
        let toastDescription = "ফলাফল শেয়ার করতে একটি সমস্যা হয়েছে।";

        if (error instanceof DOMException) {
          if (error.name === 'AbortError') {
            return;
          } else if (error.name === 'NotAllowedError') {
            toastDescription = "শেয়ার করার অনুমতি দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজার সেটিংস পরীক্ষা করুন।";
          } else {
            toastDescription = `শেয়ার করতে সমস্যা: ${error.message || error.name}`;
          }
        } else if (error instanceof Error) {
           toastDescription = `শেয়ার করতে সমস্যা: ${error.message}`;
        }
        
        if (!imageFile || (error instanceof DOMException && error.name !== 'AbortError')) {
            try {
                await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
                toast({ title: "কপি সফল", description: "ফলাফল ক্লিপবোর্ডে কপি করা হয়েছে! (ছবি শেয়ার করা যায়নি)", variant: "default" });
            } catch (clipError) {
                 toast({ title: toastTitle, description: toastDescription, variant: "destructive" });
            }
        } else if (error instanceof DOMException && error.name !== 'AbortError') {
            toast({ title: toastTitle, description: toastDescription, variant: "destructive" });
        }
      }
    } else if (navigator.clipboard) { 
      try {
        await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
        toast({ title: "কপি সফল", description: "ফলাফল ক্লিপবোর্ডে কপি করা হয়েছে!" });
      } catch (error) {
        toast({ title: "কপি ত্রুটি", description: "ক্লিপবোর্ডে কপি করতে সমস্যা হয়েছে।", variant: "destructive" });
      }
    } else {
      toast({ title: "দুঃখিত", description: "আপনার ব্রাউজার স্বয়ংক্রিয় শেয়ারিং অথবা ক্লিপবোর্ড কপি সাপোর্ট করে না।", variant: "destructive" });
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
            <CardDescription className="text-lg sm:text-xl text-foreground/80">আপনার কুইজ সম্পন্ন হয়েছে। বিষয়: {getQuizTopicLabel(quizState.quizTopic)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-5xl sm:text-6xl font-bold text-accent">
              {quizState.totalScore} <span className="text-2xl text-foreground/70">/ {TOTAL_QUESTIONS * POINTS_PER_CORRECT_ANSWER}</span>
            </div>
            <div className="text-lg text-foreground/80">
              আপনি <span className="font-semibold text-primary">{TOTAL_QUESTIONS}</span> টি প্রশ্নের মধ্যে <span className="font-semibold text-primary">{quizState.quizHistory.filter(h => h.isCorrect).length}</span> টির সঠিক উত্তর দিয়েছেন। ({percentageScore.toFixed(0)}%)
            </div>

            {isLoadingImage && (
              <div className="p-4 border rounded-lg bg-muted/50 min-h-[150px] flex flex-col items-center justify-center animate-pulse">
                <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">ফলাফলের ছবি তৈরি করা হচ্ছে...</p>
                <LoadingSpinner size="sm" className="mt-2"/>
              </div>
            )}
            {!isLoadingImage && resultImageDataUri && (
              <div className="p-2 border rounded-lg bg-muted/50 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <Image 
                  src={resultImageDataUri} 
                  alt={`ফলাফলের ছবি - ${quizState.userName}`} 
                  width={500} 
                  height={281} 
                  className="rounded-md mx-auto shadow-md"
                  priority
                />
                 <a 
                  href={resultImageDataUri} 
                  download={`AI_Quiz_BD_Result_${quizState.userName}.png`}
                  className="mt-2 inline-flex items-center text-sm text-accent hover:underline"
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  ছবি ডাউনলোড করুন
                </a>
              </div>
            )}
             {!isLoadingImage && !resultImageDataUri && (
                <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 min-h-[80px] flex items-center justify-center">
                     <p className="text-sm text-destructive">ফলাফলের ছবি তৈরি করা যায়নি।</p>
                </div>
            )}


            <div className="p-4 border rounded-lg bg-muted/50 min-h-[80px] flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
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
                  <details key={index} className="p-0 border-0 rounded-md overflow-hidden animate-fade-in-up" style={{ animationDelay: `${500 + index * 100}ms` }}>
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
