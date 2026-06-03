import React from 'react';
import { render, screen } from '@testing-library/react';
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
});