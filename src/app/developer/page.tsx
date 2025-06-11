
import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, UserCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ডেভেলপার পরিচিতি | AI কুইজ বাংলাদেশ',
  description: 'AI কুইজ বাংলাদেশ অ্যাপের ডেভেলপারের পরিচিতি।',
};

export default function DeveloperPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl rounded-lg border border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-3">
              <UserCircle className="w-8 h-8 text-primary mr-2" />
              <CardTitle className="text-2xl sm:text-3xl font-headline text-primary">ডেভেলপার পরিচিতি</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Image 
              src="https://m.media-amazon.com/images/S/amzn-author-media-prod/b02mvc2hucu96hchlksdjmogii._SY450_CR0%2C0%2C450%2C450_.jpg" 
              alt="মোহাম্মদ শেখ শাহিনুর রহমান" 
              width={150} 
              height={150} 
              className="rounded-full mb-6 shadow-lg border-4 border-primary/60"
              priority
            />
            <h2 className="text-2xl font-bold text-primary mb-2">মোহাম্মদ শেখ শাহিনুর রহমান</h2>
            <div className="text-md text-foreground/80 space-y-1 mb-6">
              <p><span className="font-semibold">পেশা:</span> কবি, লেখক, সফটওয়্যার ইঞ্জিনিয়ার, প্রোগ্রামার</p>
              <p><span className="font-semibold">বিশেষজ্ঞতা:</span> ডিজিটাল ফরেনসিক, প্রযুক্তি উদ্ভাবন</p>
            </div>
            <CardDescription className="text-foreground/90 mb-6 px-4 text-justify sm:text-center leading-relaxed">
              মোহাম্মদ শেখ শাহিনুর রহমান একজন বহুমাত্রিক প্রতিভার অধিকারী ব্যক্তিত্ব। সাহিত্যচর্চার পাশাপাশি তিনি প্রযুক্তি জগতেও রেখেছেন গুরুত্বপূর্ণ অবদান। তাঁর লেখনী যেমন মানুষের মন ছুঁয়ে যায়, তেমনি তাঁর প্রযুক্তিগত উদ্ভাবন ও দক্ষতা বিভিন্ন জটিল সমস্যার সমাধানে সহায়ক হয়েছে। ডিজিটাল ফরেনসিক ক্ষেত্রে তাঁর অভিজ্ঞতা এবং প্রোগ্রামিং-এ তাঁর পারদর্শিতা তাঁকে সমসাময়িক প্রযুক্তিবিদদের মধ্যে এক স্বতন্ত্র অবস্থানে নিয়ে গেছে।
            </CardDescription>
            
            <div className="w-full border-t border-border/50 my-6"></div>

            <h3 className="text-xl font-semibold text-primary mb-4">আরও জানুন:</h3>
            <div className="space-y-3 w-full max-w-xs sm:max-w-sm">
              <Button asChild variant="outline" className="w-full justify-start text-md py-3">
                <a 
                  href="https://mohammad-sheikh-shahinur-rahman.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4 text-accent" /> ব্যক্তিগত ওয়েবসাইট
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-md py-3">
                <a 
                  href="http://shahinur.amadersomaj.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4 text-accent" /> আমাদের সমাজ প্রোফাইল
                </a>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="pt-8 flex justify-center">
            <Button asChild variant="default" size="lg">
              <Link href="/">
                <ArrowLeft className="mr-2 h-5 w-5" />
                হোম পেজে ফিরে যান
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
