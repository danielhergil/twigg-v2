import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Play,
  BookOpen,
  Clock,
  AlertCircle,
  Trophy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useUser } from "@/hooks/useUser";
import YouTubePlayer from "@/components/YouTubePlayer";

interface Course {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  position: number;
  estimated_minutes: number | null;
}

interface Test {
  id: string;
  question: string;
  options: string[];
  answer: string;
  solution: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

type ViewMode = 'lesson' | 'test';

export default function CourseExecution() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('lesson');
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showSolution, setShowSolution] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasStartedCourse, setHasStartedCourse] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
    }
  }, [courseId, user]);

  useEffect(() => {
    if (lessons.length > 0 && user) {
      fetchUserProgress();
    }
  }, [lessons, user]);

  const fetchCourseData = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, description, user_id')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('position');

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

    } catch (error) {
      console.error('Error fetching course data:', error);
      showError('Failed to load course data');
      navigate('/dashboard/explore');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user || !courseId) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessons.map(l => l.id));

      if (error) throw error;
      setUserProgress(data || []);
      
      const hasAnyProgress = data && data.length > 0;
      setHasStartedCourse(hasAnyProgress);
      
      if (hasAnyProgress) {
        const lastCompletedIndex = lessons.findIndex((lesson, index) => {
          const progress = data.find(p => p.lesson_id === lesson.id);
          const nextLesson = lessons[index + 1];
          const nextProgress = nextLesson ? data.find(p => p.lesson_id === nextLesson.id) : null;
          
          return progress?.completed && (!nextProgress || !nextProgress.completed);
        });
        
        if (lastCompletedIndex !== -1 && lastCompletedIndex + 1 < lessons.length) {
          setCurrentLessonIndex(lastCompletedIndex + 1);
        } else if (lastCompletedIndex === -1) {
          setCurrentLessonIndex(0);
        }
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const fetchLessonTest = async (lessonId: string) => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data && data.options) {
        setCurrentTest({
          ...data,
          options: Array.isArray(data.options) ? data.options : Object.values(data.options)
        });
        setViewMode('test');
        setSelectedAnswer('');
        setShowSolution(false);
        setIsAnswerCorrect(null);
        setIsTestCompleted(false);
      } else {
        await markLessonCompleted(lessonId);
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      showError('Failed to load test');
    }
  };

  const markLessonCompleted = async (lessonId: string) => {
    if (!user) return;

    try {
      const existingProgress = userProgress.find(p => p.lesson_id === lessonId);
      
      if (existingProgress) {
        const { error } = await supabase
          .from('user_progress')
          .update({ 
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      await fetchUserProgress();
      showSuccess('Lesson completed!');
    } catch (error) {
      console.error('Error marking lesson completed:', error);
      showError('Failed to save progress');
    }
  };

  const startCourse = async () => {
    if (!user || !lessons.length) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          lesson_id: lessons[0].id,
          completed: false
        });

      if (error && error.code !== '23505') {
        throw error;
      }

      setHasStartedCourse(true);
      setCurrentLessonIndex(0);
      await fetchUserProgress();
    } catch (error) {
      console.error('Error starting course:', error);
      showError('Failed to start course');
    }
  };

  const handleLessonComplete = async () => {
    const currentLesson = lessons[currentLessonIndex];
    if (!currentLesson) return;

    await fetchLessonTest(currentLesson.id);
  };

  const handleTestSubmit = () => {
    if (!currentTest || !selectedAnswer) return;

    const correct = selectedAnswer === currentTest.answer;
    setIsAnswerCorrect(correct);
    setShowSolution(true);
    setIsTestCompleted(true);

    if (correct) {
      showSuccess('Correct answer!');
    } else {
      showError('Incorrect answer. Review the solution.');
    }
  };

  const handleNextLesson = async () => {
    const currentLesson = lessons[currentLessonIndex];
    if (!currentLesson) return;

    if (viewMode === 'test' && currentTest) {
      await markLessonCompleted(currentLesson.id);
      
      if (currentLessonIndex < lessons.length - 1) {
        setCurrentLessonIndex(currentLessonIndex + 1);
        setViewMode('lesson');
        setCurrentTest(null);
      } else {
        showSuccess('Congratulations! You have completed the course!');
      }
    } else {
      handleLessonComplete();
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setViewMode('lesson');
      setCurrentTest(null);
    }
  };

  const canStartLesson = (lessonIndex: number) => {
    if (lessonIndex === 0) return true;
    const previousLesson = lessons[lessonIndex - 1];
    const previousProgress = userProgress.find(p => p.lesson_id === previousLesson?.id);
    return previousProgress?.completed || false;
  };

  const getLessonProgress = (lessonId: string) => {
    return userProgress.find(p => p.lesson_id === lessonId);
  };

  const calculateOverallProgress = () => {
    const completedLessons = userProgress.filter(p => p.completed).length;
    return lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course || !lessons.length) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Course not available</h3>
        <p className="mt-2 text-muted-foreground">This course doesn't exist or has no lessons yet.</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard/explore')}>
          Back to Explore
        </Button>
      </div>
    );
  }

  const currentLesson = lessons[currentLessonIndex];
  const progress = getLessonProgress(currentLesson?.id);
  const overallProgress = calculateOverallProgress();
  const isLastLesson = currentLessonIndex === lessons.length - 1;

  if (!loading && !hasStartedCourse && userProgress.length === 0) {
    return (
      <div className="space-y-6">
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

        <Card className="max-w-2xl mx-auto border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Ready to start your learning journey?
            </CardTitle>
            <CardDescription>
              You're about to begin "{course.title}". This course contains {lessons.length} lessons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">What you'll learn:</h4>
              <ul className="space-y-1">
                {lessons.slice(0, 5).map((lesson, index) => (
                  <li key={lesson.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3" />
                    Lesson {index + 1}: {lesson.title}
                  </li>
                ))}
                {lessons.length > 5 && (
                  <li className="text-sm text-muted-foreground pl-5">
                    ...and {lessons.length - 5} more lessons
                  </li>
                )}
              </ul>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={startCourse} className="flex-1">
                Start Course
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Not Ready
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Button>
        <Badge variant="secondary">
          Lesson {currentLessonIndex + 1} of {lessons.length}
        </Badge>
      </div>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Overall Progress:</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="flex-1 max-w-xs" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {viewMode === 'lesson' ? (
                      <BookOpen className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    {viewMode === 'lesson' 
                      ? `Lesson ${currentLessonIndex + 1}: ${currentLesson.title}`
                      : `Test: ${currentLesson.title}`
                    }
                  </CardTitle>
                  {viewMode === 'lesson' && (
                    <div className="flex items-center gap-4">
                      {currentLesson.estimated_minutes && (
                        <CardDescription className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {currentLesson.estimated_minutes} minutes
                        </CardDescription>
                      )}
                      {currentLesson.video_url && (
                        <CardDescription className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          Video included
                        </CardDescription>
                      )}
                    </div>
                  )}
                </div>
                {progress?.completed && (
                  <Badge className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {viewMode === 'lesson' ? (
                <div>
                  {/* Layout when both video and content exist */}
                  {currentLesson.video_url && currentLesson.content && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[500px]">
                      {/* Video Section */}
                      <div className="p-6 lg:border-r lg:border-b-0 border-b border-border">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-primary" />
                            <h3 className="font-medium">Video Lesson</h3>
                          </div>
                          <YouTubePlayer 
                            videoUrl={currentLesson.video_url}
                            title={currentLesson.title}
                            className="border border-border"
                          />
                        </div>
                      </div>
                      
                      {/* Content Section */}
                      <div className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <h3 className="font-medium">Lesson Notes</h3>
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-w-none overflow-y-auto max-h-[400px] pr-2">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: currentLesson.content 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Layout when only video exists */}
                  {currentLesson.video_url && !currentLesson.content && (
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-primary" />
                          <h3 className="font-medium">Video Lesson</h3>
                        </div>
                        <div className="max-w-4xl mx-auto">
                          <YouTubePlayer 
                            videoUrl={currentLesson.video_url}
                            title={currentLesson.title}
                            className="border border-border"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Layout when only content exists */}
                  {!currentLesson.video_url && currentLesson.content && (
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <h3 className="font-medium">Lesson Content</h3>
                        </div>
                        <div className="max-w-4xl mx-auto">
                          <div className="prose dark:prose-invert max-w-none">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: currentLesson.content 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!currentLesson.video_url && !currentLesson.content && (
                    <div className="text-center py-12 p-6">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No content available for this lesson.</p>
                    </div>
                  )}
                </div>
              ) : (
                currentTest && (
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-medium">{currentTest.question}</h3>
                    
                    <div className="space-y-2">
                      {currentTest.options.map((option, index) => {
                        const optionKey = String.fromCharCode(65 + index);
                        const isSelected = selectedAnswer === option;
                        const isCorrect = option === currentTest.answer;
                        const showCorrect = showSolution && isCorrect;
                        const showIncorrect = showSolution && isSelected && !isCorrect;
                        
                        return (
                          <div
                            key={index}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected && !showSolution
                                ? 'border-primary bg-primary/10'
                                : showCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : showIncorrect
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => {
                              if (!showSolution) {
                                setSelectedAnswer(option);
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                                isSelected && !showSolution
                                  ? 'border-primary bg-primary text-white'
                                  : showCorrect
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : showIncorrect
                                  ? 'border-red-500 bg-red-500 text-white'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {optionKey}
                              </div>
                              <span>{option}</span>
                              {showCorrect && <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {showSolution && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Explanation:</h4>
                        <p className="text-blue-800 dark:text-blue-200">{currentTest.solution}</p>
                      </div>
                    )}
                  </div>
                )
              )}
              
              <div className="px-6">
                <Separator />
              </div>
              
              <div className="p-6 pt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousLesson}
                  disabled={currentLessonIndex === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {viewMode === 'lesson' ? (
                    <Button
                      onClick={handleLessonComplete}
                      className="flex items-center gap-2"
                    >
                      {isLastLesson ? 'Complete Course' : 'Continue'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      {!showSolution ? (
                        <Button
                          onClick={handleTestSubmit}
                          disabled={!selectedAnswer}
                          className="flex items-center gap-2"
                        >
                          Submit Answer
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNextLesson}
                          className="flex items-center gap-2"
                        >
                          {isLastLesson ? (
                            <>
                              <Trophy className="h-4 w-4" />
                              Complete Course
                            </>
                          ) : (
                            <>
                              Next Lesson
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const lessonProgress = getLessonProgress(lesson.id);
                  const isCurrentLesson = index === currentLessonIndex;
                  const canStart = canStartLesson(index);
                  
                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isCurrentLesson ? 'bg-primary/10 border border-primary/20' : ''
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        lessonProgress?.completed
                          ? 'bg-green-500 text-white'
                          : canStart
                          ? isCurrentLesson
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {lessonProgress?.completed ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          canStart ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {lesson.title}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {lesson.estimated_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.estimated_minutes} min
                            </div>
                          )}
                          {lesson.video_url && (
                            <div className="flex items-center gap-1">
                              <Play className="h-3 w-3" />
                              Video
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}