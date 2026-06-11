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

  it('renders fallback state when image fails to load and resets error on post change', () => {
    const { rerender } = render(
      <MemoryCard
        post={{
          id: 'memory-2',
          title: 'A quiet coastline',
          latitude: 34.0522,
          longitude: -118.2437,
          visibility: 'PUBLIC',
          createdAt: '2026-06-02T00:00:00.000Z',
          user: { name: 'Terra' },
          _count: { likes: 0 },
          media: [{ url: 'https://example.com/failed-image.jpg' }],
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

    const img = screen.getByRole('img', { name: 'A quiet coastline' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/failed-image.jpg');

    // Simulate image error
    fireEvent.error(img);

    // Verify accessible fallback UI is rendered with role="img" and matching label
    const fallback = screen.getByRole('img', { name: 'Photo unavailable' });
    expect(fallback).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'A quiet coastline' })).not.toBeInTheDocument();

    // Rerender with a different post
    rerender(
      <MemoryCard
        post={{
          id: 'memory-3',
          title: 'A busy city',
          latitude: 40.7128,
          longitude: -74.0060,
          visibility: 'PUBLIC',
          createdAt: '2026-06-02T00:00:00.000Z',
          user: { name: 'Terra' },
          _count: { likes: 0 },
          media: [{ url: 'https://example.com/new-image.jpg' }],
    const img = screen.getByRole('img');
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

    // Verify error state is reset and new image is rendering
    const newImg = screen.getByRole('img', { name: 'A busy city' });
    expect(newImg).toBeInTheDocument();
    expect(newImg).toHaveAttribute('src', 'https://example.com/new-image.jpg');
    expect(screen.queryByRole('img', { name: 'Photo unavailable' })).not.toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Mountain View at 12.346, 78.901');
  });
});