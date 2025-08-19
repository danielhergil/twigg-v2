import { render, screen, fireEvent } from '@testing-library/react';
import { PublicCourseCard } from '../PublicCourseCard';
import { PublicCourse } from '@/types/publicCourse';

const mockCourse: PublicCourse = {
  id: '1',
  title: 'Test Course',
  description: 'A test course description',
  thumbnail_url: null,
  level: 'beginner',
  duration_weeks: 4,
  rating_avg: 4.5,
  reviews_count: 100,
  created_at: '2024-01-01',
  is_featured: false,
  instructor: {
    name: 'John Doe',
    avatar_url: null
  }
};

const mockProps = {
  course: mockCourse,
  onStartCourse: jest.fn(),
  onPreview: jest.fn()
};

describe('PublicCourseCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders course information correctly', () => {
    render(<PublicCourseCard {...mockProps} />);
    
    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('A test course description')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText('4 weeks')).toBeInTheDocument();
  });

  it('calls onPreview when card is clicked', () => {
    render(<PublicCourseCard {...mockProps} />);
    
    const card = screen.getByRole('article');
    fireEvent.click(card);
    
    expect(mockProps.onPreview).toHaveBeenCalledWith('1');
  });

  it('calls onStartCourse when start button is clicked', () => {
    render(<PublicCourseCard {...mockProps} />);
    
    const startButton = screen.getByText('Start Course');
    fireEvent.click(startButton);
    
    expect(mockProps.onStartCourse).toHaveBeenCalledWith('1');
  });

  it('shows featured badge when course is featured', () => {
    const featuredCourse = { ...mockCourse, is_featured: true };
    render(<PublicCourseCard {...mockProps} course={featuredCourse} />);
    
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('shows enrolled badge when user is enrolled', () => {
    render(<PublicCourseCard {...mockProps} isEnrolled={true} />);
    
    expect(screen.getByText('Enrolled')).toBeInTheDocument();
  });

  it('shows progress bar when user is enrolled with progress', () => {
    render(<PublicCourseCard {...mockProps} isEnrolled={true} progress={75} />);
    
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<PublicCourseCard {...mockProps} />);
    
    const card = screen.getByRole('article');
    fireEvent.keyDown(card, { key: 'Enter' });
    
    expect(mockProps.onPreview).toHaveBeenCalledWith('1');
  });

  it('has proper accessibility attributes', () => {
    render(<PublicCourseCard {...mockProps} />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', 'Course: Test Course by John Doe');
    expect(card).toHaveAttribute('tabIndex', '0');
    
    const previewButton = screen.getByLabelText('Preview Test Course course');
    expect(previewButton).toBeInTheDocument();
    
    const startButton = screen.getByLabelText('Start Test Course course');
    expect(startButton).toBeInTheDocument();
  });
});