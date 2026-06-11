import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProfilePanel from './ProfilePanel';

describe('ProfilePanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the empty memories state without crashing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ posts: [] }),
      }))
    );

    render(
      <ProfilePanel
        user={{
          name: 'Terra Explorer',
          username: 'terra',
          email: 'terra@example.com',
          bio: '',
          profilePic: '',
          _count: { posts: 0, followers: 0, following: 0 },
        }}
        token="token"
        onClose={vi.fn()}
        onPinClick={vi.fn()}
        onProfileUpdated={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText(/explore the globe and pin/i)).toBeInTheDocument());
  });
});