import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PostModal from './PostModal';

describe('PostModal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders and surfaces a publish error when submission fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('nominatim.openstreetmap.org')) {
          return {
            ok: true,
            json: async () => ({ display_name: 'Paris, France' }),
          } as Response;
        }

        return {
          ok: false,
          json: async () => ({ message: 'Publish failed' }),
        } as Response;
      })
    );

    render(<PostModal lat={48.8566} lng={2.3522} token="token" onClose={vi.fn()} onCreated={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /pin a memory to earth/i })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/what happened here/i), { target: { value: 'Sunrise' } });
    fireEvent.click(screen.getByRole('button', { name: /publish memory/i }));

    expect(await screen.findByText('Publish failed')).toBeInTheDocument();
  });
});