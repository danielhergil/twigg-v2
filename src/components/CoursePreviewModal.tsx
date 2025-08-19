import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  Users, 
  Clock, 
  BookOpen,
  Play,
  Award,
  CheckCircle,
  Globe,
  Calendar,
  Loader2,
  X
} from "lucide-react";
import { CoursePreview } from "@/types/publicCourse";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useCoursePreview } from "@/hooks/usePublicCourses";
import { showError } from "@/utils/toast";

interface CoursePreviewModalProps {
  courseId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({
  courseId,
  isOpen,
  onClose
}) => {
  const { requireAuth, isAuthenticated } = useAuthGate();
  
  const {
    data: course,
    isLoading: loading,
    error
  } = useCoursePreview(courseId, isAuthenticated);

  useEffect(() => {
    if (error) {
      showError('Failed to load course details');
    }
  }, [error]);

  const handleEnrollNow = () => {
    if (!course) return;
    requireAuth(`/dashboard/course/${course.id}`, course.id);
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="course-preview-description"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : course ? (
          <>
            <DialogHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-2xl font-bold">
                      {course.title}
                    </DialogTitle>
                    {course.is_featured && (
                      <Badge className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <DialogDescription className="text-base" id="course-preview-description">
                    {course.description}
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Course Image */}
              <div className="relative h-64 rounded-lg overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white/60" />
                  </div>
                )}
              </div>

              {/* Course Metadata */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-1">
                  {renderStars(course.rating_avg)}
                  <span className="font-medium ml-1">
                    {course.rating_avg.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({course.reviews_count} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {Math.floor(Math.random() * 2000) + 100} students
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {course.duration_weeks ? `${course.duration_weeks} weeks` : 'Self-paced'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{course.language}</span>
                </div>
              </div>

              {/* Course Tags */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">
                  {course.level || 'All levels'}
                </Badge>
                <Badge variant="outline">Free Course</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Start Anytime
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Instructor Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Instructor</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={course.instructor.avatar_url || undefined} />
                    <AvatarFallback>
                      {course.instructor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{course.instructor.name}</div>
                    <div className="text-sm text-muted-foreground">Course Instructor</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Course Content */}
              {isAuthenticated && course.modules.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">What You'll Learn</h3>
                  <div className="grid gap-3">
                    {course.modules.slice(0, 6).map((module) => (
                      <div key={module.id} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          Module {module.module_number}: {module.title}
                        </span>
                      </div>
                    ))}
                    {course.modules.length > 6 && (
                      <div className="text-sm text-muted-foreground ml-8">
                        +{course.modules.length - 6} more modules
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Limited Content for Unauthenticated Users */}
              {!isAuthenticated && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Course Content</h3>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 text-center border-2 border-dashed border-purple-200 dark:border-purple-700">
                    <BookOpen className="mx-auto h-12 w-12 text-purple-500 mb-3" />
                    <h4 className="text-lg font-semibold mb-2">Unlock Full Course Content</h4>
                    <p className="text-muted-foreground mb-4">
                      Sign up for free to see the complete curriculum, modules, and learning objectives.
                    </p>
                    <Button 
                      onClick={handleEnrollNow}
                      className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Sign Up to View Content
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Course Requirements */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• No prior experience required</li>
                  <li>• Access to a computer with internet connection</li>
                  <li>• Willingness to learn and practice</li>
                </ul>
              </div>

              <Separator />

              {/* Course Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Course Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {course.description || 'This comprehensive course will guide you through essential concepts and practical applications. You\'ll gain hands-on experience and build real-world skills that you can apply immediately.'}
                </p>
              </div>

              {/* CTA Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Ready to Start Learning?</h3>
                <p className="text-muted-foreground mb-4">
                  {isAuthenticated 
                    ? 'Click below to start this course and begin your learning journey.'
                    : 'Create a free account to access this course and start learning today.'
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    size="lg"
                    onClick={handleEnrollNow}
                    className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isAuthenticated ? 'Start Course' : 'Enroll Now'}
                  </Button>
                  <Button variant="outline" size="lg" onClick={onClose}>
                    Browse More Courses
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Course not found</h3>
            <p className="mt-2 text-muted-foreground">
              The course you're looking for doesn't exist or isn't available.
            </p>
            <Button className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};