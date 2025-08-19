import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  BookOpen, 
  TrendingUp,
  Award,
  Flame,
  Globe,
  SlidersHorizontal,
  Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PublicCourseCard } from "./PublicCourseCard";
import { PublicCourse, CourseFilters } from "@/types/publicCourse";
import { useAuthGate } from "@/hooks/useAuthGate";
import { usePublicCourses, useFeaturedCourses } from "@/hooks/usePublicCourses";
import { showError } from "@/utils/toast";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface CoursesGalleryProps {
  maxCourses?: number;
  showFilters?: boolean;
  variant?: 'compact' | 'full';
  onCoursePreview?: (courseId: string) => void;
}

export const CoursesGallery: React.FC<CoursesGalleryProps> = ({
  maxCourses = 12,
  showFilters = true,
  variant = 'full',
  onCoursePreview
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [selectedLevel, setSelectedLevel] = useState<string>(searchParams.get('level') || "all");
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || "popular");
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "all");
  
  const { requireAuth, isAuthenticated } = useAuthGate();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      updateURLParams({ search: query });
    }, 300),
    []
  );

  const updateURLParams = useCallback((updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const filters: CourseFilters = useMemo(() => ({
    search: searchQuery,
    level: selectedLevel,
    sortBy: sortBy as 'popular' | 'rating' | 'newest'
  }), [searchQuery, selectedLevel, sortBy]);

  // Use React Query for data fetching
  const {
    data: coursesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: coursesError
  } = usePublicCourses(filters, maxCourses, activeTab !== 'featured', isAuthenticated);

  const {
    data: featuredCourses,
    isLoading: featuredLoading,
    error: featuredError
  } = useFeaturedCourses(maxCourses, isAuthenticated);

  // Flatten paginated data
  const courses = useMemo(() => {
    if (activeTab === 'featured') {
      return featuredCourses || [];
    }
    return coursesData?.pages.flatMap(page => page.courses) || [];
  }, [coursesData, featuredCourses, activeTab]);

  const loading = activeTab === 'featured' ? featuredLoading : isLoading;
  const error = activeTab === 'featured' ? featuredError : coursesError;

  useEffect(() => {
    if (error) {
      showError('Failed to load courses');
    }
  }, [error]);

  const handleStartCourse = (courseId: string) => {
    requireAuth(`/dashboard/course/${courseId}`, courseId);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    updateURLParams({ tab: value });
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    updateURLParams({ level: value });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateURLParams({ sort: value });
  };

  const handleSearchChange = (value: string) => {
    debouncedSearch(value);
  };

  // Skeleton loader component
  const CourseCardSkeleton = () => (
    <div className="animate-pulse" data-testid="course-skeleton">
      <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-t-lg"></div>
      <div className="p-6 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  const filteredCourses = useMemo(() => {
    if (activeTab === 'featured') {
      return courses.filter(course => course.is_featured);
    }
    if (activeTab === 'trending') {
      return courses.slice(0, 6); // Show top 6 as trending
    }
    if (activeTab === 'suggested') {
      return courses.slice(0, 3); // Show top 3 as suggested
    }
    return courses;
  }, [courses, activeTab]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-20">
      {/* Section Header */}
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-3 bg-white/80 backdrop-blur-sm text-purple-700 dark:bg-card/60 dark:text-primary">
          Discover Courses
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
          Start Learning{" "}
          <span className="bg-gradient-to-br from-purple-600 to-pink-700 bg-clip-text text-transparent">
            Today
          </span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore our collection of high-quality courses from expert instructors. 
          Find the perfect course to advance your skills and achieve your goals.
        </p>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <div className="space-y-6 mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-12 py-3 text-base border-2 focus:border-primary rounded-xl shadow-sm"
              defaultValue={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">Filters:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedLevel} onValueChange={handleLevelChange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-40">
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
        </div>
      )}

      {/* Course Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex justify-center">
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
        </div>

        <TabsContent value="all" className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold">All Courses</h3>
            <p className="text-muted-foreground">Browse our complete course catalog</p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <PublicCourseCard
                    key={course.id}
                    course={course}
                    onStartCourse={handleStartCourse}
                    onPreview={onCoursePreview}
                    variant={variant === 'compact' ? 'compact' : 'default'}
                    showBookmark={true}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
              
              {filteredCourses.length === 0 && !loading && (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No courses found</h3>
                  <p className="mt-2 text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
              
              {hasNextPage && filteredCourses.length > 0 && (
                <div className="text-center">
                  <Button 
                    onClick={handleLoadMore} 
                    disabled={isFetchingNextPage}
                    variant="outline"
                    size="lg"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Courses'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="suggested" className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Suggested for You</h3>
            <p className="text-muted-foreground">Personalized recommendations</p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <PublicCourseCard
                  key={course.id}
                  course={course}
                  onStartCourse={handleStartCourse}
                  onPreview={onCoursePreview}
                  variant="default"
                  showBookmark={true}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Featured Courses</h3>
            <p className="text-muted-foreground">Hand-picked courses from top instructors</p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <PublicCourseCard
                    key={course.id}
                    course={course}
                    onStartCourse={handleStartCourse}
                    onPreview={onCoursePreview}
                    variant="featured"
                    showBookmark={true}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
              
              {filteredCourses.length === 0 && (
                <div className="text-center py-12">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No featured courses yet</h3>
                  <p className="mt-2 text-muted-foreground">
                    Featured courses will appear here based on ratings and popularity
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Trending Courses</h3>
            <p className="text-muted-foreground">Most popular courses this week</p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <PublicCourseCard
                  key={course.id}
                  course={course}
                  onStartCourse={handleStartCourse}
                  onPreview={onCoursePreview}
                  variant="default"
                  showBookmark={true}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
};