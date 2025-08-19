import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  Users, 
  Clock, 
  BookOpen,
  Play,
  Award,
  Heart,
  Bookmark,
  CheckCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PublicCourse } from "@/types/publicCourse";

interface PublicCourseCardProps {
  course: PublicCourse;
  onStartCourse: (courseId: string) => void;
  onPreview?: (courseId: string) => void;
  variant?: 'default' | 'featured' | 'compact';
  showBookmark?: boolean;
  isAuthenticated?: boolean;
  isEnrolled?: boolean;
  progress?: number;
}

export const PublicCourseCard: React.FC<PublicCourseCardProps> = ({
  course,
  onStartCourse,
  onPreview,
  variant = 'default',
  showBookmark = false,
  isAuthenticated = false,
  isEnrolled = false,
  progress = 0
}) => {
  const getGradientClass = () => {
    switch (variant) {
      case 'featured':
        return "from-blue-400 to-teal-500";
      case 'compact':
        return "from-purple-400 to-pink-500";
      default:
        return "from-indigo-400 to-purple-500";
    }
  };

  const getVariantBadge = () => {
    if (isEnrolled) {
      return (
        <Badge className="absolute top-3 right-3 bg-green-500 text-white hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Enrolled
        </Badge>
      );
    }
    if (variant === 'featured' || course.is_featured) {
      return (
        <Badge className="absolute top-3 right-3 bg-white/90 text-black hover:bg-white">
          <Award className="h-3 w-3 mr-1" />
          Featured
        </Badge>
      );
    }
    if (!isAuthenticated) {
      return (
        <Badge className="absolute top-3 left-3 bg-purple-500 text-white hover:bg-purple-600 text-xs">
          Free
        </Badge>
      );
    }
    return null;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : i < rating 
            ? "fill-yellow-400/50 text-yellow-400" 
            : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  const duration = course.duration_weeks 
    ? `${course.duration_weeks} weeks` 
    : 'Self-paced';

  const cardHeight = variant === 'compact' ? 'h-80' : 'h-96';

  return (
    <Card 
      className={`group flex flex-col ${cardHeight} hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 shadow-lg bg-white dark:bg-card overflow-hidden touch-manipulation focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
        !isAuthenticated 
          ? 'border-2 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700' 
          : 'border border-gray-200 dark:border-gray-800'
      }`}
      onClick={() => onPreview?.(course.id)}
      role="article"
      aria-label={`Course: ${course.title} by ${course.instructor.name}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPreview?.(course.id);
        }
      }}
    >
      <div className={`relative h-48 bg-gradient-to-r ${getGradientClass()}`}>
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="h-12 w-12 text-white/80" />
          </div>
        )}
        
        {getVariantBadge()}
        
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        
        <Button 
          size="sm" 
          className="absolute bottom-3 left-3 bg-white/90 text-black hover:bg-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
          onClick={(e) => { 
            e.stopPropagation(); 
            onPreview?.(course.id);
          }}
          aria-label={`Preview ${course.title} course`}
        >
          <Play className="h-4 w-4 mr-1" />
          Preview
        </Button>
        
        {showBookmark && (
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="sm" 
              variant="ghost" 
              className="bg-white/20 hover:bg-white/30 text-white h-8 w-8 p-0"
              disabled={!isAuthenticated}
              aria-label={`Add ${course.title} to favorites`}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="bg-white/20 hover:bg-white/30 text-white h-8 w-8 p-0"
              disabled={!isAuthenticated}
              aria-label={`Bookmark ${course.title} course`}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <CardHeader className={variant === 'compact' ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className={`line-clamp-2 group-hover:text-primary transition-colors ${
            variant === 'compact' ? 'text-base' : 'text-lg'
          }`}>
            {course.title}
          </CardTitle>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Avatar className="h-4 w-4">
            <AvatarImage src={course.instructor.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {course.instructor.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{course.instructor.name}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 pt-0">
        {variant !== 'compact' && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {isAuthenticated 
              ? course.description 
              : course.description === 'Sign up to see full course description'
                ? 'Sign up to see full course description'
                : course.description
            }
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {renderStars(course.rating_avg)}
            <span className="text-sm font-semibold ml-1">
              {course.rating_avg.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({course.reviews_count})
            </span>
          </div>
          {variant !== 'compact' && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {Math.floor(Math.random() * 2000) + 100}
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {isEnrolled && progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">
                {course.level || 'All levels'}
              </Badge>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration}
              </Badge>
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              Free
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          className={`w-full transition-colors ${
            !isAuthenticated 
              ? 'bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white' 
              : 'group-hover:bg-primary group-hover:text-primary-foreground'
          }`}
          onClick={(e) => { 
            e.stopPropagation(); 
            onStartCourse(course.id);
          }}
          aria-label={`${isEnrolled ? 'Continue' : 'Start'} ${course.title} course`}
        >
          <Play className="h-4 w-4 mr-2" />
          {isEnrolled 
            ? 'Continue Learning' 
            : isAuthenticated 
            ? 'Start Learning' 
            : 'Sign Up & Start'
          }
        </Button>
      </CardFooter>
    </Card>
  );
};