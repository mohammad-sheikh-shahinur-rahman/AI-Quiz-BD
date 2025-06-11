
export const TOTAL_QUESTIONS = 5;
export const QUESTION_TIMER_SECONDS = 45; // 45 seconds per question
export const POINTS_PER_CORRECT_ANSWER = 10;
export const QUIZ_STORAGE_KEY = 'aiQuizBDLiteState';
export const USER_NAME_STORAGE_KEY = 'aiQuizBDLiteUserName';
export const SELECTED_QUIZ_TOPIC_STORAGE_KEY = 'aiQuizBDLiteSelectedTopic';

export const RANDOM_TOPIC_VALUE = "__RANDOM_TOPIC__"; // Internal value for random topic selection

export const QUIZ_TOPICS = [
  { value: "সাধারণ জ্ঞান", label: "সাধারণ জ্ঞান" },
  { value: "বিজ্ঞান ও প্রযুক্তি", label: "বিজ্ঞান ও প্রযুক্তি" },
  { value: "ইতিহাস", label: "ইতিহাস" },
  { value: "খেলাধুলা", label: "খেলাধুলা" },
  { value: "বাংলাদেশ বিষয়াবলী", label: "বাংলাদেশ বিষয়াবলী" },
  { value: "সাহিত্য", label: "সাহিত্য" },
  { value: "ভূগোল", label: "ভূগোল" },
  { value: RANDOM_TOPIC_VALUE, label: "এলোমেলো বিষয় (Random Topic)" },
];

export const DEFAULT_QUIZ_TOPIC = "সাধারণ জ্ঞান";
