import { PublicCourse, CourseFilters, CoursesResponse, CoursePreview } from "@/types/publicCourse";

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Retry utility function
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};

// API client utility
const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export class PublicCourseService {
  static async fetchPublicCourses(
    filters: CourseFilters = { search: '', level: 'all', sortBy: 'popular' },
    page: number = 1,
    limit: number = 12,
    isAuthenticated: boolean = false
  ): Promise<CoursesResponse> {
    return retryOperation(async () => {
      // For unauthenticated users, use the public API endpoint
      if (!isAuthenticated) {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sort_by: filters.sortBy,
        });

        if (filters.search) {
          params.append('search', filters.search);
        }

        if (filters.level !== 'all') {
          params.append('level', filters.level);
        }

        const data = await apiClient(`/courses/public/cards?${params.toString()}`);
        
        const courses: PublicCourse[] = data.map((course: any) => ({
          id: course.id,
          title: course.title,
          description: 'Sign up to see full course description',
          thumbnail_url: course.thumbnail_url,
          level: course.level,
          duration_weeks: course.duration_weeks,
          rating_avg: course.rating_avg,
          reviews_count: course.reviews_count,
          created_at: course.created_at,
          is_featured: course.is_featured,
          instructor: {
            name: course.instructor_name,
            avatar_url: course.instructor_avatar
          }
        }));

        return {
          courses,
          total: courses.length, // Backend doesn't return total count for public endpoint
          hasMore: courses.length === limit
        };
      }

      // For authenticated users, we would use a different endpoint or include auth headers
      // For now, fallback to the same public endpoint
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: filters.sortBy,
      });

      if (filters.search) {
        params.append('search', filters.search);
      }

      if (filters.level !== 'all') {
        params.append('level', filters.level);
      }

      const data = await apiClient(`/courses/public/cards?${params.toString()}`);
      
      const courses: PublicCourse[] = data.map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.title, // For authenticated users, we'd get full description
        thumbnail_url: course.thumbnail_url,
        level: course.level,
        duration_weeks: course.duration_weeks,
        rating_avg: course.rating_avg,
        reviews_count: course.reviews_count,
        created_at: course.created_at,
        is_featured: course.is_featured,
        instructor: {
          name: course.instructor_name,
          avatar_url: course.instructor_avatar
        }
      }));

      return {
        courses,
        total: courses.length,
        hasMore: courses.length === limit
      };
    });
  }

  static async fetchCoursePreview(courseId: string, isAuthenticated: boolean = false): Promise<CoursePreview | null> {
    return retryOperation(async () => {
      try {
        // Use the public preview endpoint
        const data = await apiClient(`/courses/public/${courseId}/preview`);
        
        const coursePreview: CoursePreview = {
          id: data.id,
          title: data.title,
          description: data.description,
          thumbnail_url: data.thumbnail_url,
          level: data.level,
          duration_weeks: data.duration_weeks,
          rating_avg: data.rating_avg,
          reviews_count: data.reviews_count,
          created_at: data.created_at,
          language: data.language,
          is_featured: data.is_featured,
          instructor: {
            name: data.instructor.name,
            avatar_url: data.instructor.avatar_url
          },
          modules: data.modules || []
        };

        return coursePreview;
      } catch (error) {
        console.error('Error fetching course preview:', error);
        return null;
      }
    });
  }

  static async getFeaturedCourses(limit: number = 6, isAuthenticated: boolean = false): Promise<PublicCourse[]> {
    try {
      // Use the dedicated featured courses endpoint
      const data = await apiClient(`/courses/public/featured?limit=${limit}`);
      
      const courses: PublicCourse[] = data.map((course: any) => ({
        id: course.id,
        title: course.title,
        description: isAuthenticated ? course.title : 'Sign up to see full course description',
        thumbnail_url: course.thumbnail_url,
        level: course.level,
        duration_weeks: course.duration_weeks,
        rating_avg: course.rating_avg,
        reviews_count: course.reviews_count,
        created_at: course.created_at,
        is_featured: course.is_featured,
        instructor: {
          name: course.instructor_name,
          avatar_url: course.instructor_avatar
        }
      }));

      return courses;
    } catch (error) {
      console.error('Error fetching featured courses:', error);
      return [];
    }
  }
}