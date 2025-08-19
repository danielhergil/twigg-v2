export interface PublicCourse {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  level: string | null;
  duration_weeks: number | null;
  rating_avg: number;
  reviews_count: number;
  created_at: string;
  is_featured: boolean;
  instructor: {
    name: string;
    avatar_url: string | null;
  };
}

export interface CourseFilters {
  search: string;
  level: string;
  sortBy: 'popular' | 'rating' | 'newest';
}

export interface CoursesResponse {
  courses: PublicCourse[];
  total: number;
  hasMore: boolean;
}

export interface CoursePreview extends PublicCourse {
  modules: {
    id: string;
    title: string;
    module_number: number;
  }[];
  language: string;
}