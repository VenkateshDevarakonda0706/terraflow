import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MemoryCard from './MemoryCard';

describe('MemoryCard', () => {
  it('renders the empty photo state without crashing', () => {
    render(
      <MemoryCard
        post={{
          id: 'memory-1',
          title: 'A quiet coastline',
          latitude: 34.0522,
          longitude: -118.2437,
          visibility: 'PUBLIC',
          createdAt: '2026-06-02T00:00:00.000Z',
          user: { name: 'Terra' },
          _count: { likes: 0 },
        }}
        token=""
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onFlyTo={vi.fn()}
      />
    );

    expect(screen.getByText('No photo attached')).toBeInTheDocument();
    expect(screen.getByText('A quiet coastline')).toBeInTheDocument();
  });

  it('renders the attached image with descriptive alt text containing title and location', () => {
    render(
      <MemoryCard
        post={{
          id: 'memory-2',
          title: 'Sunset Beach',
          latitude: 34.0522,
          longitude: -118.2437,
          location: 'Malibu, CA',
          visibility: 'PUBLIC',
          createdAt: '2026-06-02T00:00:00.000Z',
          user: { name: 'Terra' },
          media: [{ url: 'https://example.com/beach.jpg' }],
          _count: { likes: 0 },
        }}
        token=""
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onFlyTo={vi.fn()}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Sunset Beach at Malibu, CA');
  });

  it('renders coordinate fallback alt text when location is missing', () => {
    render(
      <MemoryCard
        post={{
          id: 'memory-3',
          title: 'Mountain View',
          latitude: 12.3456,
          longitude: 78.9012,
          location: null,
          visibility: 'PUBLIC',
          createdAt: '2026-06-02T00:00:00.000Z',
          user: { name: 'Terra' },
          media: [{ url: 'https://example.com/mountain.jpg' }],
          _count: { likes: 0 },
        }}
        token=""
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onFlyTo={vi.fn()}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Mountain View at 12.346, 78.901');
  });

  it('renders fallback state when image fails to load', () => {
    render(
      <MemoryCard
        post={{
          id: 'memory-4',
          title: 'Failed Image Memory',
          latitude: 34.0522,
          longitude: -118.2437,
          location: 'Malibu, CA',
          visibility: 'PUBLIC',
          createdAt: '2026-06-02T00:00:00.000Z',
          user: { name: 'Terra' },
          media: [{ url: 'https://example.com/failed-image.jpg' }],
          _count: { likes: 0 },
        }}
        token=""
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onFlyTo={vi.fn()}
      />
    );

    const img = screen.getByRole('img', { name: 'Failed Image Memory at Malibu, CA' });
    expect(img).toBeInTheDocument();

    // Simulate image error
    fireEvent.error(img);

    // Verify accessible fallback UI is rendered with role="img" and matching label
    const fallback = screen.getByRole('img', { name: 'Photo unavailable' });
    expect(fallback).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Failed Image Memory at Malibu, CA' })).not.toBeInTheDocument();
  });

  it('resets image error state on post change', () => {
    const { rerender } = render(
      <MemoryCard
        post={{
          id: 'memory-5',
          title: 'Failing Image',
          latitude: 34.0522,
          longitude: -118.2437,
          location: 'Malibu, CA',
          visibility: 'PUBLIC',
          createdAt: '2026-06-02T00:00:00.000Z',
          user: { name: 'Terra' },
          media: [{ url: 'https://example.com/failed-image.jpg' }],
          _count: { likes: 0 },
        }}
        token=""
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onFlyTo={vi.fn()}
      />
    );

    const img = screen.getByRole('img', { name: 'Failing Image at Malibu, CA' });
    expect(img).toBeInTheDocument();

    // Trigger error to set imageError = true
    fireEvent.error(img);
    expect(screen.getByRole('img', { name: 'Photo unavailable' })).toBeInTheDocument();

    // Rerender with a new post
    rerender(
      <MemoryCard
        post={{
          id: 'memory-6',
          title: 'Working Image',
          latitude: 40.7128,
          longitude: -74.0060,
          location: 'New York, NY',
          visibility: 'PUBLIC',
          createdAt: '2026-06-02T00:00:00.000Z',
          user: { name: 'Terra' },
          media: [{ url: 'https://example.com/working-image.jpg' }],
          _count: { likes: 0 },
        }}
        token=""
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onFlyTo={vi.fn()}
      />
    );

    // Verify error state was reset and new image renders
    const newImg = screen.getByRole('img', { name: 'Working Image at New York, NY' });
    expect(newImg).toBeInTheDocument();
    expect(newImg).toHaveAttribute('src', 'https://example.com/working-image.jpg');
    expect(screen.queryByRole('img', { name: 'Photo unavailable' })).not.toBeInTheDocument();
  });
});