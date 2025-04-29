
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Calendar, Save, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface CarouselProps {
  content: any;
}

export function Carousel({ content }: CarouselProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  if (!content || !content.content || !content.content.slides) {
    return <div className="text-muted-foreground text-center py-4">No carousel content generated yet.</div>;
  }

  const { title, slides } = content.content;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedIndex(index);
        toast({
          title: "Slide copied!",
          description: "The slide content has been copied to your clipboard.",
        });
        setTimeout(() => setCopiedIndex(null), 2000);
      },
      () => {
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    );
  };

  const nextSlide = () => {
    setActiveSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">{title || "Carousel Content"}</h3>
      
      <div className="border rounded-md p-4 bg-card">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium">
            Slide {activeSlideIndex + 1} of {slides.length}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={prevSlide}
              disabled={activeSlideIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={nextSlide}
              disabled={activeSlideIndex === slides.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="min-h-[150px] p-4 border rounded-md bg-card mb-4">
          {slides[activeSlideIndex] && (
            <div>
              <span className="text-xs uppercase text-muted-foreground block mb-2">
                {slides[activeSlideIndex].type}
              </span>
              <p>{slides[activeSlideIndex].content}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => copyToClipboard(slides[activeSlideIndex].content, activeSlideIndex)}
          >
            {copiedIndex === activeSlideIndex ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Slide
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Add to Calendar</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Save className="h-4 w-4" />
              <span>Save</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
