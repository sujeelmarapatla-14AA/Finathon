import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export interface AvatarList {
  image: string;
}

interface HeroSectionProps {
  avatarList?: AvatarList[];
}

export default function HeroSection({ avatarList = [] }: HeroSectionProps) {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto text-center space-y-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
        <span>Agency Excellence</span>
      </div>
      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 max-w-4xl mx-auto leading-tight">
        Build high-performing digital experiences with precision
      </h1>
      <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
        Crafting enterprise grade applications and procurement intelligence systems designed for speed, scale, and clarity.
      </p>
      <div className="flex items-center justify-center gap-4 pt-2">
        <Button size="lg" className="gap-2">
          Get Started <ArrowRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="lg">
          Learn More
        </Button>
      </div>
      {avatarList.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <div className="flex -space-x-2">
            {avatarList.map((av, idx) => (
              <img
                key={idx}
                src={av.image}
                alt="Client avatar"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
                }}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-500 font-medium pl-2">
            Trusted by 5,000+ teams worldwide
          </span>
        </div>
      )}
    </section>
  );
}
