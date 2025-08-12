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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  CheckCircle,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  AlertCircle
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    coverImage: null as File | null
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCourse(id);
      if (user) {
        checkUserProgress(id);
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (course) {
      setEditForm({
        title: course.title || '',
        description: course.description || '',
        coverImage: null
      });
    }
  }, [course]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditForm(prev => ({ ...prev, coverImage: file }));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    if (!id) return null;
    
    try {
      // Check authentication first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session?.user?.id, 'Error:', sessionError);
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${id}_cover.${fileExt}`;
      
      console.log('Uploading file:', fileName, 'for user:', session.user.id);

      // Delete existing cover image if it exists (optional, upsert will overwrite anyway)
      const { error: deleteError } = await supabase.storage
        .from('course-covers')
        .remove([fileName]);
      
      // Ignore delete errors (file might not exist)
      if (deleteError) {
        console.log('Delete warning (expected if file doesn\'t exist):', deleteError.message);
      }

      // Upload the new image
      const { data, error } = await supabase.storage
        .from('course-covers')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error details:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      const { data: urlData } = supabase.storage
        .from('course-covers')
        .getPublicUrl(fileName);

      // Add cache busting parameter to ensure browser loads new image
      const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      console.log('Public URL generated:', cacheBustedUrl);
      return cacheBustedUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    }
  };

  const handleUpdateCourse = async () => {
    if (!course || !id) return;

    try {
      setIsUpdating(true);
      let thumbnailUrl = course.thumbnail_url;

      // Upload new image if selected
      if (editForm.coverImage) {
        console.log('Uploading new cover image...');
        const uploadedUrl = await uploadCoverImage(editForm.coverImage);
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
          console.log('New thumbnail URL:', uploadedUrl);
        } else {
          throw new Error('Failed to upload image');
        }
      }

      console.log('Updating course with data:', {
        title: editForm.title,
        description: editForm.description,
        thumbnail_url: thumbnailUrl
      });

      // Update course in database
      const { data, error } = await supabase
        .from('courses')
        .update({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          thumbnail_url: thumbnailUrl
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Course updated successfully:', data);
      showSuccess('Course updated successfully!');
      setIsEditModalOpen(false);
      
      // Reset form
      setEditForm({
        title: data[0]?.title || editForm.title,
        description: data[0]?.description || editForm.description,
        coverImage: null
      });
      
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      
      // Force refresh course data with a small delay to ensure database is updated
      setTimeout(async () => {
        await fetchCourse(id);
      }, 100);
    } catch (error) {
      console.error('Error updating course:', error);
      showError('Failed to update course: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course || !id || deleteConfirmText !== course.title || !user) return;

    try {
      setIsDeleting(true);

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Delete course using the API endpoint with authentication
      const response = await fetch(`http://localhost:8000/courses/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      showSuccess('Course deleted successfully!');
      navigate('/dashboard/explore');
    } catch (error) {
      console.error('Error deleting course:', error);
      showError('Failed to delete course');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteConfirmText('');
    }
  };

  const renderStarRating = (currentRating: number, onRatingChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 cursor-pointer transition-colors ${
          i < currentRating 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-gray-300 dark:text-gray-600 hover:text-yellow-400"
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
  
  // Function to add cache busting to image URLs
  const getCacheBustedImageUrl = (url: string | null | undefined) => {
    if (!url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cb=${Date.now()}`;
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
            <div className="h-64 rounded-lg overflow-hidden">
              {course.thumbnail_url ? (
                <img 
                  src={getCacheBustedImageUrl(course.thumbnail_url)}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  key={course.thumbnail_url} // Force re-render when URL changes
                />
              ) : (
                <div className="h-64 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-white/60" />
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">{course.title}</h1>
                  <p className="text-lg text-muted-foreground">{course.description || 'No description available'}</p>
                </div>
                <div className="flex gap-2">
                  {isAuthor ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Course
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share className="h-4 w-4" />
                      </Button>
                    </>
                  )}
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
                    <Card key={index} className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-card">
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
              <Card className="border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-card">
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
          <Card className="sticky top-6 border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-card">
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

      {/* Edit Course Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update your course details and cover image.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Course Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter course title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Course Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students will learn in this course"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cover">Cover Image</Label>
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => document.getElementById("edit-cover")?.click()}
                >
                  <input
                    type="file"
                    id="edit-cover"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-medium text-primary cursor-pointer">Upload a new image</span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                </div>

                {/* Current or Preview Image */}
                {(previewUrl || course?.thumbnail_url) && (
                  <div className="relative">
                    <div className="text-sm font-medium mb-2">
                      {previewUrl ? 'New Image Preview:' : 'Current Image:'}
                    </div>
                    <div className="relative rounded-lg overflow-hidden border">
                      <img 
                        src={previewUrl || getCacheBustedImageUrl(course?.thumbnail_url) || ''} 
                        alt="Course cover" 
                        className="w-full h-48 object-cover"
                        key={previewUrl || course?.thumbnail_url} // Force re-render when URL changes
                      />
                      {previewUrl && (
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditForm(prev => ({ ...prev, coverImage: null }));
                              setPreviewUrl(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCourse} 
              disabled={isUpdating || !editForm.title.trim()}
            >
              {isUpdating ? 'Updating...' : 'Update Course'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Course Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              "<strong>{course?.title}</strong>" and all associated data including lessons, modules, and student progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-900 dark:text-red-100">
                  Warning: This action is irreversible
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Please type <strong>{course?.title}</strong> to confirm:
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type the course title here"
                className="border-red-200 dark:border-red-800 focus:border-red-500"
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteConfirmText('');
                setIsDeleteModalOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              disabled={deleteConfirmText !== course?.title || isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}