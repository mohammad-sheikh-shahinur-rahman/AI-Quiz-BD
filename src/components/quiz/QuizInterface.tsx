
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { 
  TOTAL_QUESTIONS, 
  QUESTION_TIMER_SECONDS, 
  POINTS_PER_CORRECT_ANSWER, 
  QUIZ_STORAGE_KEY, 
  USER_NAME_STORAGE_KEY,
  SELECTED_QUIZ_TOPIC_STORAGE_KEY,
  DEFAULT_QUIZ_TOPIC,
  QUIZ_TOPICS,
  RANDOM_TOPIC_VALUE
} from '@/constants/quiz';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';

type InitializationStatus = 'pending' | 'redirecting' | 'initialized';

const QuizInterface = () => {
  const router = useRouter();
  const { toast } = useToast();
  const isMountedRef = useRef(false);

  const [initializationStatus, setInitializationStatus] = useState<InitializationStatus>('pending');
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [currentQuestionData, setCurrentQuestionData] = useState<GenerateQuizQuestionOutput | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean; aiEvaluation?: string } | null>(null);
  
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const [currentQuestionActualTopicLabel, setCurrentQuestionActualTopicLabel] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem(USER_NAME_STORAGE_KEY);
      if (!storedName) {
        if (isMountedRef.current) setInitializationStatus('redirecting');
        return;
      }
      
      const storedState = localStorage.getItem(QUIZ_STORAGE_KEY);
      let loadedState: QuizState | null = null;
      if (storedState) {
        try {
          const parsedState: QuizState = JSON.parse(storedState);
          if (
              parsedState.userName === storedName && 
              parsedState.currentQuestionNumber > 0 &&
              parsedState.currentQuestionNumber <= TOTAL_QUESTIONS + 1 &&
              parsedState.quizHistory.length === Math.min(parsedState.currentQuestionNumber - 1, TOTAL_QUESTIONS)
          ) {
             loadedState = parsedState;
          } else {
            localStorage.removeItem(QUIZ_STORAGE_KEY); 
          }
        } catch (e) {
          console.error("Failed to parse stored quiz state:", e);
          localStorage.removeItem(QUIZ_STORAGE_KEY);
        }
      }

      if (isMountedRef.current) {
        if (loadedState) {
           setQuizState(loadedState);
        } else {
          const initialTopic = localStorage.getItem(SELECTED_QUIZ_TOPIC_STORAGE_KEY) || DEFAULT_QUIZ_TOPIC;
          setQuizState({
            userName: storedName,
            currentQuestionNumber: 1,
            totalScore: 0,
            quizHistory: [],
            quizTopic: initialTopic 
          });
        }
        setInitializationStatus('initialized');
      }
    }
  }, []);

  useEffect(() => {
    if (initializationStatus === 'redirecting' && isMountedRef.current) {
      router.replace('/start');
    }
  }, [initializationStatus, router]);
 
  useEffect(() => {
    if (isMountedRef.current && quizState && quizState.currentQuestionNumber > TOTAL_QUESTIONS && initializationStatus === 'initialized') {
      if (quizState.quizHistory.length === TOTAL_QUESTIONS) {
        router.push('/result');
      }
    }
  }, [quizState, router, initializationStatus]);


  const fetchNewQuestion = useCallback(async (baseTopic: string, previouslyAsked: string[]) => {
    if (!isMountedRef.current) return;
    
    if (isMountedRef.current) {
      setIsLoadingQuestion(true);
      setCurrentQuestionData(null); 
      setFeedback(null);
      setSelectedAnswer(null);
      setCurrentQuestionActualTopicLabel(null);
    }

    let topicForGeneration = baseTopic;
    let actualTopicDisplayValue = "";

    if (baseTopic === RANDOM_TOPIC_VALUE) {
      const eligibleTopics = QUIZ_TOPICS.filter(t => t.value !== RANDOM_TOPIC_VALUE);
      let chosenTopicValue = DEFAULT_QUIZ_TOPIC; 
      if (eligibleTopics.length > 0) {
        const randomIndex = Math.floor(Math.random() * eligibleTopics.length);
        chosenTopicValue = eligibleTopics[randomIndex].value;
      }
      topicForGeneration = chosenTopicValue;
      actualTopicDisplayValue = QUIZ_TOPICS.find(t => t.value === chosenTopicValue)?.label || chosenTopicValue;
    } else {
      topicForGeneration = baseTopic;
      actualTopicDisplayValue = QUIZ_TOPICS.find(t => t.value === baseTopic)?.label || baseTopic;
    }
        
    try {
      const question = await generateQuizQuestion({ topic: topicForGeneration, previouslyAskedQuestions: previouslyAsked });
      if (isMountedRef.current) {
        setCurrentQuestionData(question);
        if (baseTopic === RANDOM_TOPIC_VALUE) {
            setCurrentQuestionActualTopicLabel(actualTopicDisplayValue);
        }
        setTimeLeft(QUESTION_TIMER_SECONDS);
        setTimerActive(true);
      }
    } catch (error) {
      console.error("Failed to fetch question:", error);
      if (isMountedRef.current) {
        toast({
          title: "প্রশ্ন আনতে সমস্যা",
          description: "প্রশ্ন আনতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingQuestion(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    if (
      initializationStatus === 'initialized' &&
      quizState &&
      quizState.currentQuestionNumber <= TOTAL_QUESTIONS &&
      !currentQuestionData &&
      !isLoadingQuestion &&
      !feedback && 
      quizState.quizHistory.length === quizState.currentQuestionNumber - 1
    ) {
      const previouslyAsked = quizState.quizHistory.map(h => h.questionText);
      fetchNewQuestion(quizState.quizTopic, previouslyAsked);
    }
  }, [initializationStatus, quizState, currentQuestionData, isLoadingQuestion, feedback, fetchNewQuestion]);


  const handleTimeUp = useCallback(() => {
    if (!isMountedRef.current || !quizState || !currentQuestionData || feedback) return; 
    
    setTimerActive(false);
    const correctAnswerText = currentQuestionData.correctAnswer;
    
    if(isMountedRef.current) {
        setFeedback({ 
          message: "সময় শেষ!", 
          isCorrect: false,
          aiEvaluation: `দুঃখিত, সময় শেষ। সঠিক উত্তর ছিল: ${correctAnswerText}`
        });
    }
    
    const historyEntry: QuizHistoryEntry = {
      questionText: currentQuestionData.question,
      options: currentQuestionData.options,
      userSelectedAnswer: null,
      correctAnswerText: correctAnswerText,
      isCorrect: false,
      aiFeedback: `সময় শেষ! সঠিক উত্তর ছিল: ${correctAnswerText}`,
      pointsAwarded: 0,
    };

    if(isMountedRef.current) {
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
    }
  }, [quizState, currentQuestionData, feedback]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || !currentQuestionData) return;
    const intervalId = setInterval(() => {
      if(isMountedRef.current) setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timerActive, timeLeft, currentQuestionData]);

  useEffect(() => {
    if (timeLeft === 0 && timerActive && currentQuestionData && !feedback) {
      handleTimeUp();
    }
  }, [timeLeft, timerActive, currentQuestionData, feedback, handleTimeUp]);


  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestionData || !quizState || !isMountedRef.current) return;

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
      if (isMountedRef.current) {
        toast({
          title: "মূল্যায়নে সমস্যা",
          description: "উত্তর মূল্যায়ন করতে সমস্যা হয়েছে।",
          variant: "destructive",
        });
      }
    }

    if (!isMountedRef.current) return;
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
    
    if(isMountedRef.current) setIsEvaluating(false);
  };

  const handleNext = () => {
    if (!isMountedRef.current || !quizState || isLoadingQuestion) return;
    
    const nextQuestionNumber = quizState.currentQuestionNumber + 1;

    if (isMountedRef.current) {
      setCurrentQuestionData(null);
      setFeedback(null);
      setSelectedAnswer(null);
      setCurrentQuestionActualTopicLabel(null); 
      
      setQuizState(prevState => {
          if (!prevState) return null; 
          const newState = {
              ...prevState,
              currentQuestionNumber: nextQuestionNumber,
          };
          if (typeof window !== 'undefined') {
              localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(newState));
          }
          return newState;
      });
    }
  };
  
  const handleRestartQuiz = () => {
     if (typeof window !== 'undefined') {
      localStorage.removeItem(QUIZ_STORAGE_KEY); 
    }
    router.push('/start');
  };

  if (initializationStatus === 'pending' || initializationStatus === 'redirecting' || !quizState) {
    return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
  }

  const getQuizTopicDisplayLabel = (topicValue: string) => {
    const topicObject = QUIZ_TOPICS.find(t => t.value === topicValue);
    return topicObject ? topicObject.label : DEFAULT_QUIZ_TOPIC;
  };

  const progressPercentage = (quizState.currentQuestionNumber / TOTAL_QUESTIONS) * 100;
  const timerProgressPercentage = (timeLeft / QUESTION_TIMER_SECONDS) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 bg-background">
      <Card className="w-full max-w-2xl shadow-2xl rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-headline text-primary">AI কুইজ - {getQuizTopicDisplayLabel(quizState.quizTopic)}</CardTitle>
           {quizState.quizTopic === RANDOM_TOPIC_VALUE && currentQuestionActualTopicLabel && currentQuestionData && !feedback && (
            <p className="text-sm text-center text-accent font-semibold mt-1">
              এবারের বিষয়: {currentQuestionActualTopicLabel}
            </p>
          )}
          <CardDescription>প্রশ্ন নং: {quizState.currentQuestionNumber > TOTAL_QUESTIONS ? TOTAL_QUESTIONS : quizState.currentQuestionNumber}/{TOTAL_QUESTIONS} | মোট স্কোর: {quizState.totalScore}</CardDescription>
          <Progress value={progressPercentage} className="w-full mt-2" />
          {currentQuestionData && !feedback && (
             <div className="mt-4">
                <div className={`text-xl font-semibold ${timeLeft <= 10 ? 'text-destructive animate-pulse' : 'text-accent'}`}>
                    সময় বাকি: {timeLeft} সেকেন্ড
                </div>
                <Progress value={timerProgressPercentage} className="w-full mt-2 h-2" />
            </div>
          )}
        </CardHeader>

        <CardContent className="min-h-[300px]">
          {isLoadingQuestion && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-lg text-foreground/80">প্রশ্ন তৈরি হচ্ছে...</p>
            </div>
          )}
          
          {!isLoadingQuestion && currentQuestionData && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed">{currentQuestionData.question}</h2>
              <RadioGroup
                value={selectedAnswer || ""}
                onValueChange={(value) => !feedback && setSelectedAnswer(value)}
                disabled={!!feedback || isEvaluating || isLoadingQuestion}
                className="space-y-3"
              >
                {currentQuestionData.options.map((option, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-300
                    ${feedback && option === currentQuestionData.correctAnswer ? 'bg-green-100 dark:bg-green-900 border-green-500' : ''}
                    ${feedback && selectedAnswer === option && option !== currentQuestionData.correctAnswer ? 'bg-red-100 dark:bg-red-900 border-red-500' : ''}
                    ${!feedback && selectedAnswer === option ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50' }`}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} className="border-primary text-primary focus:ring-primary"/>
                    <Label htmlFor={`option-${index}`} className="text-md sm:text-lg text-foreground/90 cursor-pointer flex-1">{option}</Label>
                    {feedback && option === currentQuestionData.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                    {feedback && selectedAnswer === option && option !== currentQuestionData.correctAnswer && (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
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
              {!feedback.isCorrect && currentQuestionData && (
                <p className="text-sm text-foreground/80 mt-1"><strong>সঠিক উত্তর ছিল:</strong> {currentQuestionData.correctAnswer}</p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end pt-6">
          {!feedback && !isLoadingQuestion && currentQuestionData && (
            <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer || isEvaluating || timeLeft === 0} size="lg" className="font-semibold">
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
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="mt-8 text-sm">
            <RotateCcw className="mr-2 h-4 w-4" />
            নতুন করে শুরু করুন
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
            <AlertDialogDescription>
              বর্তমান কুইজের অগ্রগতি হারিয়ে যাবে এবং আপনাকে কুইজ শুরু করার পৃষ্ঠায় নিয়ে যাওয়া হবে। আপনি কি আসলেই নতুন করে শুরু করতে চান?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestartQuiz}>নিশ্চিত করুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuizInterface;
