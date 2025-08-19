import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { PublicCourseService } from '@/services/publicCourseService';
import { CourseFilters, PublicCourse, CoursePreview } from '@/types/publicCourse';

export const usePublicCourses = (
  filters: CourseFilters,
  limit: number = 12,
  enabled: boolean = true,
  isAuthenticated: boolean = false
) => {
  return useInfiniteQuery({
    queryKey: ['publicCourses', filters, limit, isAuthenticated],
    queryFn: ({ pageParam = 1 }) => 
      PublicCourseService.fetchPublicCourses(filters, pageParam, limit, isAuthenticated),
    getNextPageParam: (lastPage, allPages) => 
      lastPage.hasMore ? allPages.length + 1 : undefined,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useFeaturedCourses = (limit: number = 6, isAuthenticated: boolean = false) => {
  return useQuery({
    queryKey: ['featuredCourses', limit, isAuthenticated],
    queryFn: () => PublicCourseService.getFeaturedCourses(limit, isAuthenticated),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useCoursePreview = (courseId: string | null, isAuthenticated: boolean = false) => {
  return useQuery({
    queryKey: ['coursePreview', courseId, isAuthenticated],
    queryFn: () => courseId ? PublicCourseService.fetchCoursePreview(courseId, isAuthenticated) : null,
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};