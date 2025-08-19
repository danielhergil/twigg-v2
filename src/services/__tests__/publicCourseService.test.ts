import { PublicCourseService } from '../publicCourseService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          or: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => ({
                data: [],
                error: null,
                count: 0
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('PublicCourseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPublicCourses', () => {
    it('fetches courses with default filters', async () => {
      const mockData = [
        {
          id: '1',
          title: 'Test Course',
          description: 'Test description',
          thumbnail_url: null,
          level: 'beginner',
          duration_weeks: 4,
          rating_avg: 4.5,
          reviews_count: 100,
          created_at: '2024-01-01',
          profiles: {
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: null
          }
        }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
          count: 1
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await PublicCourseService.fetchPublicCourses();

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].title).toBe('Test Course');
      expect(result.courses[0].instructor.name).toBe('John Doe');
      expect(result.total).toBe(1);
    });

    it('handles search filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      await PublicCourseService.fetchPublicCourses({
        search: 'javascript',
        level: 'all',
        sortBy: 'popular'
      });

      expect(mockQuery.or).toHaveBeenCalledWith(
        'title.ilike.%javascript%,description.ilike.%javascript%'
      );
    });

    it('handles level filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      await PublicCourseService.fetchPublicCourses({
        search: '',
        level: 'intermediate',
        sortBy: 'popular'
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('level', 'intermediate');
    });

    it('handles different sort options', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      // Test rating sort
      await PublicCourseService.fetchPublicCourses({
        search: '',
        level: 'all',
        sortBy: 'rating'
      });

      expect(mockQuery.order).toHaveBeenCalledWith('rating_avg', { ascending: false });

      // Test newest sort
      await PublicCourseService.fetchPublicCourses({
        search: '',
        level: 'all',
        sortBy: 'newest'
      });

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('retries on failure', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValue({
            data: [],
            error: null,
            count: 0
          })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await PublicCourseService.fetchPublicCourses();

      expect(mockQuery.range).toHaveBeenCalledTimes(3);
      expect(result.courses).toHaveLength(0);
    });
  });

  describe('fetchCoursePreview', () => {
    it('fetches course preview with modules', async () => {
      const mockCourseData = {
        id: '1',
        title: 'Test Course',
        description: 'Test description',
        thumbnail_url: null,
        level: 'beginner',
        duration_weeks: 4,
        rating_avg: 4.5,
        reviews_count: 100,
        created_at: '2024-01-01',
        language: 'English',
        profiles: {
          first_name: 'John',
          last_name: 'Doe',
          avatar_url: null
        }
      };

      const mockModulesData = [
        { id: '1', title: 'Module 1', module_number: 1 },
        { id: '2', title: 'Module 2', module_number: 2 }
      ];

      const mockCourseQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCourseData,
          error: null
        })
      };

      const mockModulesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockModulesData,
          error: null
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCourseQuery as any)
        .mockReturnValueOnce(mockModulesQuery as any);

      const result = await PublicCourseService.fetchCoursePreview('1');

      expect(result).toBeTruthy();
      expect(result?.title).toBe('Test Course');
      expect(result?.modules).toHaveLength(2);
      expect(result?.instructor.name).toBe('John Doe');
    });

    it('returns null for non-existent course', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await PublicCourseService.fetchCoursePreview('nonexistent');

      expect(result).toBeNull();
    });
  });
});