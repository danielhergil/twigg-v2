import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  TrendingUp,
  Award,
  Play,
  Heart,
  Bookmark,
  BarChart3,
  Flame,
  Calendar,
  Globe,
  SlidersHorizontal
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

interface Course {
  id: string;
  title: string;
  description: string;
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
  } | null;
}

interface CourseWithInstructor extends Course {
  instructor: string;
  students: number;
  duration: string;
  isFeatured: boolean;
}

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedLevel, setSelectedLevel] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<string>("popular");
  const [courses, setCourses] = useState<CourseWithInstructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch profile data for course authors
      const userIds = coursesData?.map(course => course.user_id) || [];
      let profilesData = [];
      
      if (userIds.length > 0) {
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        
        if (!profilesError) {
          profilesData = data || [];
        }
      }
      
      // Create a map of user_id to profile for easy lookup
      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);

      const coursesWithInstructor: CourseWithInstructor[] = (coursesData || []).map(course => {
        const profile = profilesMap.get(course.user_id);
        
        // Determine instructor name with fallbacks
        let instructorName = 'Unknown Instructor';
        
        if (profile) {
          // Try first_name + last_name
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          if (fullName) {
            instructorName = fullName;
          } else if (profile.email) {
            // Fallback to email username (part before @)
            const emailUsername = profile.email.split('@')[0];
            // Convert email username to readable format (replace dots/underscores with spaces and capitalize)
            instructorName = emailUsername
              .replace(/[._]/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          }
        }
        
        return {
          ...course,
          profiles: profile || null,
          instructor: instructorName,
          students: Math.floor(Math.random() * 2000) + 100,
          duration: course.duration_weeks ? `${course.duration_weeks} weeks` : 'Variable',
          isFeatured: (course.rating_avg || 0) >= 4.5 && (course.reviews_count || 0) >= 10,
          rating_avg: course.rating_avg || 0,
          reviews_count: course.reviews_count || 0
        };
      });

      setCourses(coursesWithInstructor);
    } catch (error) {
      console.error('Error fetching courses:', error);
      showError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLevel = selectedLevel === "all" || (course.level && course.level.toLowerCase() === selectedLevel.toLowerCase());
    
    return matchesSearch && matchesLevel;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating_avg || 0) - (a.rating_avg || 0);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'popular':
      default:
        return b.students - a.students;
    }
  });

  const suggestedCourses = courses.slice(0, 3);
  const featuredCourses = courses.filter(course => course.isFeatured);

  // Enhanced Course Card Component
  const CourseCard = ({ course, navigate, variant = "default" }: {
    course: CourseWithInstructor;
    navigate: (path: string) => void;
    variant?: "default" | "suggested" | "featured" | "trending";
  }) => {
    const getGradientClass = () => {
      switch (variant) {
        case "suggested":
          return "from-purple-400 to-pink-500";
        case "featured":
          return "from-blue-400 to-teal-500";
        case "trending":
          return "from-orange-400 to-red-500";
        default:
          return "from-indigo-400 to-purple-500";
      }
    };

    const getVariantBadge = () => {
      switch (variant) {
        case "featured":
          return (
            <Badge className="absolute top-3 right-3 bg-white/90 text-black hover:bg-white">
              <Award className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          );
        case "trending":
          return (
            <Badge className="absolute top-3 right-3 bg-orange-500 hover:bg-orange-600">
              <Flame className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          );
        case "suggested":
          return (
            <Badge className="absolute top-3 right-3 bg-purple-500 hover:bg-purple-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              For You
            </Badge>
          );
        default:
          return null;
      }
    };

    return (
      <Card 
        className="group flex flex-col hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-card overflow-hidden" 
        onClick={() => navigate(`/dashboard/course/${course.id}`)}
      >
        <div className={`relative h-48 bg-gradient-to-r ${getGradientClass()}`}>
          {course.thumbnail_url ? (
            <img 
              src={course.thumbnail_url} 
              alt={course.title}
              className="w-full h-full object-cover"
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
            className="absolute bottom-3 left-3 bg-white/90 text-black hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <Play className="h-4 w-4 mr-1" />
            Preview
          </Button>
          
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" className="bg-white/20 hover:bg-white/30 text-white h-8 w-8 p-0">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="bg-white/20 hover:bg-white/30 text-white h-8 w-8 p-0">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
              {course.title}
            </CardTitle>
          </div>
          <CardDescription className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            {course.instructor}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {course.description}
          </p>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">{(course.rating_avg || 0).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({course.reviews_count || 0})</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{course.students.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">{course.level || 'All levels'}</Badge>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.duration}
              </Badge>
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">Free</div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button 
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
            onClick={(e) => { 
              e.stopPropagation(); 
              navigate(`/dashboard/course/${course.id}`);
            }}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Learning
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8 md:p-12">
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Discover Your Next 
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              Learning Adventure
            </span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl">
            Explore thousands of courses from world-class instructors and unlock your potential with hands-on learning.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              <Play className="h-5 w-5 mr-2" />
              Start Learning Today
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-foreground">
              <BarChart3 className="h-5 w-5 mr-2" />
              Browse by Category
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-yellow-400/30 rounded-full blur-2xl" />
      </div>

      {/* Search and Filters */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses, topics, or instructors..."
            className="pl-12 py-6 text-lg border-2 focus:border-primary rounded-xl shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Filter Results</h3>
                <p className="text-sm text-muted-foreground">Refine your search to find the perfect course</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="lg:w-80">
            <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Results Found</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {filteredCourses.length}
                </Badge>
              </div>
              <Progress value={(filteredCourses.length / courses.length) * 100} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Course Sections with Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-4 w-auto">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              All Courses
            </TabsTrigger>
            <TabsTrigger value="suggested" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Suggested
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Trending
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Updated today
          </div>
        </div>

        <TabsContent value="all" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">All Courses</h2>
              <p className="text-muted-foreground">Browse our complete course catalog</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCourses.map((course) => (
              <CourseCard key={course.id} course={course} navigate={navigate} />
            ))}
          </div>
          {sortedCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No courses found</h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggested" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Suggested for You</h2>
              <p className="text-muted-foreground">Personalized recommendations based on your interests</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestedCourses.map((course) => (
              <CourseCard key={course.id} course={course} navigate={navigate} variant="suggested" />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Featured Courses</h2>
              <p className="text-muted-foreground">Hand-picked courses from top instructors</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} navigate={navigate} variant="featured" />
            ))}
          </div>
          {featuredCourses.length === 0 && (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No featured courses yet</h3>
              <p className="mt-2 text-muted-foreground">
                Featured courses will appear here based on ratings and popularity
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Trending Courses</h2>
              <p className="text-muted-foreground">Most popular courses this week</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 6).map((course) => (
              <CourseCard key={course.id} course={course} navigate={navigate} variant="trending" />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}