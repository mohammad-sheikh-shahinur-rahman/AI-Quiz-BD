"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateQuizQuestion, type GenerateQuizQuestionOutput } from '@/ai/flows/generate-quiz-question';
import { evaluateUserAnswer } from '@/ai/flows/evaluate-user-answer';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from './LoadingSpinner';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { QuizState, QuizHistoryEntry } from '@/types/quiz';
import { TOTAL_QUESTIONS, QUESTION_TIMER_SECONDS, POINTS_PER_CORRECT_ANSWER, QUIZ_STORAGE_KEY, USER_NAME_STORAGE_KEY } from '@/constants/quiz';
import { AlertCircle, CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';

const QuizInterface = () => {
  const router = useRouter();
  const { toast } = useToast();

  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [currentQuestionData, setCurrentQuestionData] = useState<GenerateQuizQuestionOutput | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean; aiEvaluation?: string } | null>(null);
  
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);

  const loadQuizState = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem(USER_NAME_STORAGE_KEY);
      if (!storedName) {
        router.replace('/start');
        return;
      }
      
      const storedState = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (storedState) {
        const parsedState: QuizState = JSON.parse(storedState);
        // Basic validation, could be more thorough
        if (parsedState.userName === storedName && parsedState.currentQuestionNumber <= TOTAL_QUESTIONS) {
           setQuizState(parsedState);
           return;
        }
      }
      // Initialize new quiz state
      setQuizState({
        userName: storedName,
        currentQuestionNumber: 1,
        totalScore: 0,
        quizHistory: [],
        quizTopic: "সাধারণ জ্ঞান" 
      });
    }
  }, [router]);

  useEffect(() => {
    loadQuizState();
  }, [loadQuizState]);

  const fetchNewQuestion = useCallback(async (topic: string) => {
    setIsLoadingQuestion(true);
    setFeedback(null);
    setSelectedAnswer(null);
    try {
      const question = await generateQuizQuestion({ topic });
      setCurrentQuestionData(question);
      setTimeLeft(QUESTION_TIMER_SECONDS);
      setTimerActive(true);
    } catch (error) {
      console.error("Failed to fetch question:", error);
      toast({
        title: "প্রশ্ন আনতে সমস্যা",
        description: "প্রশ্ন আনতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।",
        variant: "destructive",
      });
      // Potentially offer a retry mechanism or navigate away
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [toast]);

  useEffect(() => {
    if (quizState && quizState.currentQuestionNumber <= TOTAL_QUESTIONS && !currentQuestionData && !isLoadingQuestion) {
       // If we have a quiz state, are within question limits, but no current question data is loaded (and not already loading), fetch one.
       // This handles initial load or resuming a quiz.
      fetchNewQuestion(quizState.quizTopic);
    }
  }, [quizState, currentQuestionData, isLoadingQuestion, fetchNewQuestion]);


  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || !currentQuestionData) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timerActive, timeLeft, currentQuestionData]);

  useEffect(() => {
    if (timeLeft === 0 && timerActive && currentQuestionData) {
      setTimerActive(false);
      handleTimeUp();
    }
  }, [timeLeft, timerActive, currentQuestionData]); // handleTimeUp needs to be stable or wrapped in useCallback if passed as dep

  const handleTimeUp = useCallback(() => {
    if (!quizState || !currentQuestionData) return;
    
    setFeedback({ message: "সময় শেষ! এই প্রশ্নের জন্য কোন পয়েন্ট নেই।", isCorrect: false });
    
    const historyEntry: QuizHistoryEntry = {
      questionText: currentQuestionData.question,
      options: currentQuestionData.options,
      userSelectedAnswer: null,
      correctAnswerText: currentQuestionData.correctAnswer,
      isCorrect: false,
      aiFeedback: "সময় শেষ!",
      pointsAwarded: 0,
    };

    setQuizState(prevState => {
      if (!prevState) return null;
      const newState = {
        ...prevState,
        quizHistory: [...prevState.quizHistory, historyEntry],
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(newState));
      }
      return newState;
    });
  }, [quizState, currentQuestionData]);


  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestionData || !quizState) return;

    setTimerActive(false);
    setIsEvaluating(true);

    const isCorrect = selectedAnswer === currentQuestionData.correctAnswer;
    const pointsAwarded = isCorrect ? POINTS_PER_CORRECT_ANSWER : 0;

    let aiFeedbackText = isCorrect ? "সঠিক উত্তর!" : "ভুল উত্তর।";
    try {
      const evaluation = await evaluateUserAnswer({
        userAnswer: selectedAnswer,
        correctAnswer: currentQuestionData.correctAnswer,
      });
      aiFeedbackText = evaluation.feedback;
    } catch (error) {
      console.error("Failed to evaluate answer:", error);
      toast({
        title: "মূল্যায়নে সমস্যা",
        description: "উত্তর মূল্যায়ন করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    }

    setFeedback({ message: isCorrect ? "সঠিক উত্তর!" : "ভুল উত্তর!", isCorrect, aiEvaluation: aiFeedbackText });

    const historyEntry: QuizHistoryEntry = {
      questionText: currentQuestionData.question,
      options: currentQuestionData.options,
      userSelectedAnswer: selectedAnswer,
      correctAnswerText: currentQuestionData.correctAnswer,
      isCorrect,
      aiFeedback: aiFeedbackText,
      pointsAwarded,
    };
    
    setQuizState(prevState => {
      if (!prevState) return null;
      const newState = {
        ...prevState,
        totalScore: prevState.totalScore + pointsAwarded,
        quizHistory: [...prevState.quizHistory, historyEntry],
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(newState));
      }
      return newState;
    });

    setIsEvaluating(false);
  };

  const handleNext = () => {
    if (!quizState) return;

    if (quizState.currentQuestionNumber >= TOTAL_QUESTIONS) {
      router.push('/result');
    } else {
      setQuizState(prevState => {
        if (!prevState) return null;
        const newState = { ...prevState, currentQuestionNumber: prevState.currentQuestionNumber + 1 };
        // Don't save to localStorage here yet, fetchNewQuestion will trigger save after new question is loaded with its state
        return newState;
      });
      setCurrentQuestionData(null); // Clear current question to trigger fetch in useEffect
      // fetchNewQuestion will be called by useEffect due to currentQuestionData becoming null
    }
  };
  
  if (!quizState) {
    return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
  }


  const progressPercentage = (quizState.currentQuestionNumber / TOTAL_QUESTIONS) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 bg-background">
      <Card className="w-full max-w-2xl shadow-2xl rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-headline text-primary">AI কুইজ চলছে...</CardTitle>
          <CardDescription>প্রশ্ন নং: {quizState.currentQuestionNumber}/{TOTAL_QUESTIONS} | মোট স্কোর: {quizState.totalScore}</CardDescription>
          <Progress value={progressPercentage} className="w-full mt-2" />
          {currentQuestionData && !feedback && (
             <div className={`mt-4 text-xl font-semibold ${timeLeft <= 10 ? 'text-destructive animate-pulse' : 'text-accent'}`}>
                সময় বাকি: {timeLeft} সেকেন্ড
            </div>
          )}
        </CardHeader>

        <CardContent className="min-h-[300px]">
          {isLoadingQuestion && <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>}
          
          {!isLoadingQuestion && currentQuestionData && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed">{currentQuestionData.question}</h2>
              <RadioGroup
                value={selectedAnswer || ""}
                onValueChange={(value) => !feedback && setSelectedAnswer(value)}
                disabled={!!feedback || isEvaluating}
                className="space-y-3"
              >
                {currentQuestionData.options.map((option, index) => (
                  <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-300
                    ${feedback && option === currentQuestionData.correctAnswer ? 'bg-green-100 dark:bg-green-900 border-green-500' : ''}
                    ${feedback && selectedAnswer === option && option !== currentQuestionData.correctAnswer ? 'bg-red-100 dark:bg-red-900 border-red-500' : ''}
                    ${!feedback && selectedAnswer === option ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50' }`}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} className="border-primary text-primary focus:ring-primary"/>
                    <Label htmlFor={`option-${index}`} className="text-md sm:text-lg text-foreground/90 cursor-pointer flex-1">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {isEvaluating && <div className="flex items-center justify-center mt-6"><LoadingSpinner /><p className="ml-2">মূল্যায়ন করা হচ্ছে...</p></div>}

          {feedback && (
            <div className={`mt-6 p-4 rounded-lg border animate-fade-in-up
              ${feedback.isCorrect ? 'bg-green-100 dark:bg-green-800 border-green-500' : 'bg-red-100 dark:bg-red-800 border-red-500'}`}
            >
              <div className="flex items-center mb-2">
                {feedback.isCorrect ? <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mr-2"/> : <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-2"/>}
                <h3 className={`text-lg font-semibold ${feedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{feedback.message}</h3>
              </div>
              {feedback.aiEvaluation && <p className="text-sm text-foreground/80">{feedback.aiEvaluation}</p>}
              {!feedback.aiEvaluation && feedback.message.includes("সময় শেষ") && <p className="text-sm text-foreground/80">{currentQuestionData?.correctAnswer ? `সঠিক উত্তর ছিল: ${currentQuestionData.correctAnswer}` : ''}</p>}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end pt-6">
          {!feedback && !isLoadingQuestion && currentQuestionData && (
            <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer || isEvaluating} size="lg" className="font-semibold">
              উত্তর জমা দিন
            </Button>
          )}
          {feedback && (
             <Button onClick={handleNext} size="lg" className="font-semibold bg-accent hover:bg-accent/90">
              {quizState.currentQuestionNumber >= TOTAL_QUESTIONS ? "ফলাফল দেখুন" : "পরবর্তী প্রশ্ন"}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </CardFooter>
      </Card>
       <Button variant="outline" onClick={() => router.push('/start')} className="mt-8 text-sm">
        <RotateCcw className="mr-2 h-4 w-4" />
        নতুন করে শুরু করুন
      </Button>
    </div>
  );
};

export default QuizInterface;
