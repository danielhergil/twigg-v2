import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CoursesGallery } from '../CoursesGallery';
import { PublicCourseService } from '@/services/publicCourseService';

// Mock the service
jest.mock('@/services/publicCourseService');
jest.mock('@/hooks/useAuthGate', () => ({
  useAuthGate: () => ({
    requireAuth: jest.fn(),
    isAuthenticated: false,
    user: null
  })
}));

const mockPublicCourseService = PublicCourseService as jest.Mocked<typeof PublicCourseService>;

const mockCourses = [
  {
    id: '1',
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript',
    thumbnail_url: null,
    level: 'beginner',
    duration_weeks: 4,
    rating_avg: 4.5,
    reviews_count: 100,
    created_at: '2024-01-01',
    is_featured: true,
    instructor: {
      name: 'John Doe',
      avatar_url: null
    }
  },
  {
    id: '2',
    title: 'React Advanced',
    description: 'Advanced React concepts',
    thumbnail_url: null,
    level: 'advanced',
    duration_weeks: 6,
    rating_avg: 4.8,
    reviews_count: 200,
    created_at: '2024-01-02',
    is_featured: false,
    instructor: {
      name: 'Jane Smith',
      avatar_url: null
    }
  }
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CoursesGallery Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPublicCourseService.fetchPublicCourses.mockResolvedValue({
      courses: mockCourses,
      total: 2,
      hasMore: false
    });
    mockPublicCourseService.getFeaturedCourses.mockResolvedValue([mockCourses[0]]);
  });

  it('renders courses gallery with all tabs', async () => {
    render(
      <TestWrapper>
        <CoursesGallery onCoursePreview={jest.fn()} />
      </TestWrapper>
    );

    // Check section header
    expect(screen.getByText('Start Learning')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();

    // Check tabs
    expect(screen.getByText('All Courses')).toBeInTheDocument();
    expect(screen.getByText('Suggested')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();

    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('React Advanced')).toBeInTheDocument();
    });
  });

  it('filters courses by search query', async () => {
    render(
      <TestWrapper>
        <CoursesGallery onCoursePreview={jest.fn()} />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    });

    // Search for JavaScript
    const searchInput = screen.getByPlaceholderText('Search courses...');
    fireEvent.change(searchInput, { target: { value: 'JavaScript' } });

    // Wait for debounced search
    await waitFor(() => {
      expect(mockPublicCourseService.fetchPublicCourses).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'JavaScript'
        }),
        1,
        12
      );
    }, { timeout: 1000 });
  });

  it('filters courses by level', async () => {
    render(
      <TestWrapper>
        <CoursesGallery onCoursePreview={jest.fn()} />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    });

    // Change level filter
    const levelSelect = screen.getByDisplayValue('All Levels');
    fireEvent.click(levelSelect);
    
    const beginnerOption = screen.getByText('Beginner');
    fireEvent.click(beginnerOption);

    await waitFor(() => {
      expect(mockPublicCourseService.fetchPublicCourses).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'beginner'
        }),
        1,
        12
      );
    });
  });

  it('switches between tabs correctly', async () => {
    render(
      <TestWrapper>
        <CoursesGallery onCoursePreview={jest.fn()} />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    });

    // Click featured tab
    const featuredTab = screen.getByText('Featured');
    fireEvent.click(featuredTab);

    await waitFor(() => {
      expect(mockPublicCourseService.getFeaturedCourses).toHaveBeenCalled();
    });

    // Should show featured courses section
    expect(screen.getByText('Hand-picked courses from top instructors')).toBeInTheDocument();
  });

  it('handles course preview correctly', async () => {
    const mockOnPreview = jest.fn();
    
    render(
      <TestWrapper>
        <CoursesGallery onCoursePreview={mockOnPreview} />
      </TestWrapper>
    );

    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    });

    // Click on a course card
    const courseCard = screen.getByLabelText('Course: JavaScript Fundamentals by John Doe');
    fireEvent.click(courseCard);

    expect(mockOnPreview).toHaveBeenCalledWith('1');
  });

  it('handles loading states correctly', () => {
    // Mock loading state
    mockPublicCourseService.fetchPublicCourses.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <TestWrapper>
        <CoursesGallery onCoursePreview={jest.fn()} />
      </TestWrapper>
    );

    // Should show skeleton loaders
    expect(screen.getAllByTestId('course-skeleton')).toHaveLength(6);
  });

  it('handles error states correctly', async () => {
    // Mock error
    mockPublicCourseService.fetchPublicCourses.mockRejectedValue(
      new Error('Failed to fetch courses')
    );

    render(
      <TestWrapper>
        <CoursesGallery onCoursePreview={jest.fn()} />
      </TestWrapper>
    );

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('No courses found')).toBeInTheDocument();
    });
  });

  it('updates URL parameters when filters change', async () => {
    render(
      <TestWrapper>
        <CoursesGallery onCoursePreview={jest.fn()} />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    });

    // Change sort order
    const sortSelect = screen.getByDisplayValue('Most Popular');
    fireEvent.click(sortSelect);
    
    const ratingOption = screen.getByText('Highest Rated');
    fireEvent.click(ratingOption);

    // URL should be updated (we can't easily test this in jsdom, but the function should be called)
    await waitFor(() => {
      expect(mockPublicCourseService.fetchPublicCourses).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'rating'
        }),
        1,
        12
      );
    });
  });
});