import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Star, 
  Users, 
  Clock, 
  BookOpen,
  Play,
  Download,
  Share,
  Heart,
  Award,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useUser } from "@/hooks/useUser";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  level: string | null;
  duration_weeks: number | null;
  reviews_count: number;
  rating_avg: number;
  language: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  modules?: Module[];
  lessons?: Lesson[];
  course_reviews?: CourseReview[];
}

interface Module {
  id: string;
  module_number: number;
  title: string;
  weeks: number[] | null;
  created_at: string;
  topics?: Topic[];
}

interface Topic {
  id: string;
  title: string;
  created_at: string;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  position: number;
  is_published: boolean;
  language: string | null;
  estimated_minutes: number | null;
}

interface CourseReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    body: ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [hasStartedCourse, setHasStartedCourse] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourse(id);
      if (user) {
        checkUserProgress(id);
      }
    }
  }, [id, user]);

  const fetchCourse = async (courseId: string) => {
    try {
      setLoading(true);
      
      // Fetch course data first
      console.log('Fetching course:', courseId);
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      console.log('Course data:', { courseData, courseError });

      if (courseError) throw courseError;

      // Fetch instructor profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', courseData.user_id)
        .single();

      console.log('Profile data:', { profileData, profileError });

      // Fetch modules for this course
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_number');

      console.log('Modules data:', { modulesData, modulesError });

      // Fetch course reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('course_reviews')
        .select(`
          id,
          rating,
          title,
          body,
          created_at,
          user_id
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      console.log('Reviews data:', { reviewsData, reviewsError });

      // If we have reviews, fetch reviewer profiles
      let reviewsWithProfiles = [];
      if (reviewsData && reviewsData.length > 0) {
        const reviewerIds = reviewsData.map(review => review.user_id);
        const { data: reviewerProfiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', reviewerIds);

        const reviewerProfilesMap = new Map(reviewerProfiles?.map(profile => [profile.id, profile]) || []);

        reviewsWithProfiles = reviewsData.map(review => ({
          ...review,
          profiles: reviewerProfilesMap.get(review.user_id) || null
        }));
      }

      // Combine all the data
      const completeeCourse: Course = {
        ...courseData,
        profiles: profileData || null,
        modules: modulesData || [],
        course_reviews: reviewsWithProfiles
      };

      console.log('Complete course:', completeeCourse);
      setCourse(completeeCourse);
    } catch (error) {
      console.error('Error fetching course:', error);
      showError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkUserProgress = async (courseId: string) => {
    if (!user) return;

    try {
      // First, get all lessons for this course
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      if (lessonsData && lessonsData.length > 0) {
        const lessonIds = lessonsData.map(lesson => lesson.id);
        
        // Check if user has any progress on these lessons
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);

        if (progressError) throw progressError;

        setUserProgress(progressData || []);
        setHasStartedCourse(progressData && progressData.length > 0);
      }
    } catch (error) {
      console.error('Error checking user progress:', error);
    }
  };

  const submitReview = async () => {
    if (!user || !course || !id) {
      showError('You must be logged in to submit a review');
      return;
    }

    if (course.user_id === user.id) {
      showError('You cannot review your own course');
      return;
    }

    if (reviewForm.rating === 0) {
      showError('Please select a rating');
      return;
    }

    if (!reviewForm.body.trim()) {
      showError('Please write a review');
      return;
    }

    try {
      setIsSubmittingReview(true);

      console.log('Submitting review with data:', {
        course_id: id,
        user_id: user.id,
        rating: reviewForm.rating,
        title: reviewForm.title.trim() || null,
        body: reviewForm.body.trim()
      });

      // Submit the review
      const { data: reviewData, error: reviewError } = await supabase
        .from('course_reviews')
        .insert({
          course_id: id,
          user_id: user.id,
          rating: reviewForm.rating,
          title: reviewForm.title.trim() || null,
          body: reviewForm.body.trim()
        })
        .select();

      console.log('Review submission result:', { reviewData, reviewError });

      if (reviewError) throw reviewError;

      // Calculate new average rating
      const allReviews = [...(course.course_reviews || []), { rating: reviewForm.rating }];
      const newAvgRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
      const newReviewCount = allReviews.length;

      // Update the course with new rating
      const { error: courseUpdateError } = await supabase
        .from('courses')
        .update({
          rating_avg: newAvgRating,
          reviews_count: newReviewCount
        })
        .eq('id', id);

      if (courseUpdateError) throw courseUpdateError;

      showSuccess('Review submitted successfully!');
      
      // Reset form and close modal
      setReviewForm({ rating: 0, title: '', body: '' });
      setIsReviewModalOpen(false);
      
      // Refresh course data to show the new review
      fetchCourse(id);

    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      // Handle specific error cases
      if (error?.message?.includes('Authors cannot review their own course')) {
        showError('You cannot review your own course');
      } else if (error?.code === 'P0001') {
        showError('You cannot review your own course');
      } else {
        showError('Failed to submit review');
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStarRating = (currentRating: number, onRatingChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 cursor-pointer transition-colors ${
          i < currentRating 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-gray-300 hover:text-yellow-400"
        }`}
        onClick={() => onRatingChange && onRatingChange(i + 1)}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Course not found</h3>
        <p className="mt-2 text-muted-foreground">The course you're looking for doesn't exist or isn't published.</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard/explore')}>Back to Explore</Button>
      </div>
    );
  }
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : i < rating 
            ? "fill-yellow-400/50 text-yellow-400" 
            : "text-gray-300"
        }`}
      />
    ));
  };

  const instructor = course.profiles ? 
    `${course.profiles.first_name || ''} ${course.profiles.last_name || ''}`.trim() || 'Unknown Instructor'
    : 'Unknown Instructor';

  const duration = course.duration_weeks ? `${course.duration_weeks} weeks` : 'Variable';
  const students = Math.floor(Math.random() * 2000) + 100; // Mock for now
  const isFeatured = course.rating_avg >= 4.5 && course.reviews_count >= 10;

  // Check if current user has already reviewed this course
  const userHasReviewed = course.course_reviews?.some(review => 
    user && review.user_id === user.id
  ) || false;

  // Check if current user is the course author
  const isAuthor = user && course.user_id === user.id;

  const ratingBreakdown = [
    { stars: 5, count: 892, percentage: 72 },
    { stars: 4, count: 248, percentage: 20 },
    { stars: 3, count: 74, percentage: 6 },
    { stars: 2, count: 19, percentage: 1.5 },
    { stars: 1, count: 7, percentage: 0.5 }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-6">
            <div className="h-64 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg" />
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">{course.title}</h1>
                  <p className="text-lg text-muted-foreground">{course.description || 'No description available'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {renderStars(course.rating_avg)}
                  <span className="font-medium">{(course.rating_avg || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({course.reviews_count} ratings)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{students} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{duration}</span>
                </div>
                <Badge variant="secondary">{course.level || 'Not specified'}</Badge>
                {isFeatured && (
                  <Badge className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">About This Course</h2>
              <p className="text-muted-foreground leading-relaxed">{course.description || 'No detailed description available for this course.'}</p>
            </div>

            {course.modules && course.modules.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">What You'll Learn</h3>
                <div className="grid gap-3">
                  {course.modules.slice(0, 5).map((module, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{module.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.modules && course.modules.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Course Content</h3>
                <div className="space-y-3">
                  {course.modules.map((module, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Play className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <CardTitle className="text-base">Module {module.module_number}: {module.title}</CardTitle>
                              <CardDescription>
                                {module.topics ? `${module.topics.length} topics` : 'No topics yet'}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-4">Instructor</h3>
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={course.profiles?.avatar_url || undefined} />
                      <AvatarFallback>{instructor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{instructor}</CardTitle>
                      <CardDescription className="mt-2">Course creator and instructor</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Student Reviews</h2>
              <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!user || userHasReviewed || isAuthor}>
                    {isAuthor ? 'Cannot Review Own Course' : 
                     userHasReviewed ? 'Already Reviewed' : 
                     'Write a Review'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>
                      Share your experience with this course to help other students.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating</Label>
                      <div className="flex gap-1">
                        {renderStarRating(reviewForm.rating, (rating) => 
                          setReviewForm(prev => ({ ...prev, rating }))
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="review-title">Review Title (Optional)</Label>
                      <Input
                        id="review-title"
                        placeholder="Summarize your review"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="review-body">Your Review</Label>
                      <Textarea
                        id="review-body"
                        placeholder="Tell us about your experience with this course..."
                        className="min-h-[100px]"
                        value={reviewForm.body}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, body: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={submitReview} disabled={isSubmittingReview}>
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">{(course.rating_avg || 0).toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {renderStars(course.rating_avg)}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Based on {course.reviews_count} reviews
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {ratingBreakdown.map((item) => (
                  <div key={item.stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm">{item.stars}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <Progress value={item.percentage} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-12">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              {course.course_reviews && course.course_reviews.length > 0 ? (
                course.course_reviews.map((review) => {
                  const reviewerName = review.profiles ? 
                    `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || 'Anonymous'
                    : 'Anonymous';
                  const reviewDate = new Date(review.created_at).toLocaleDateString();
                  
                  return (
                    <Card key={review.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarImage src={review.profiles?.avatar_url || undefined} />
                              <AvatarFallback>{reviewerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{reviewerName}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  {renderStars(review.rating)}
                                </div>
                                <span className="text-sm text-muted-foreground">{reviewDate}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {review.title && <h4 className="font-medium mb-2">{review.title}</h4>}
                        <p className="text-muted-foreground">{review.body || 'No review content'}</p>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No reviews yet. Be the first to review this course!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasStartedCourse ? (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate(`/dashboard/course/${id}/learn`)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue Learning
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate(`/dashboard/course/${id}/learn`)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Course
                </Button>
              )}
              <Button variant="outline" className="w-full">
                <BookOpen className="h-4 w-4 mr-2" />
                Preview Course
              </Button>
              <Separator />
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Duration</span>
                  <span className="font-medium">{duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Level</span>
                  <span className="font-medium">{course.level || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Students</span>
                  <span className="font-medium">{students}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Certificate</span>
                  <span className="font-medium">Yes</span>
                </div>
              </div>
              <Separator />
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Resources
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}