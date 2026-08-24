import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { TicketsPage } from './tickets-page';

const { mockApiClient } = vi.hoisted(() => ({
  mockApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: mockApiClient,
}));

// EventSource doesn't exist in jsdom by default — provide a minimal fake
class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  close = vi.fn();
  constructor(public url: string) {}
}

describe('TicketsPage', () => {
  beforeEach(() => {
    mockApiClient.get.mockReset();
    vi.stubGlobal('EventSource', MockEventSource);
  });

  it('renders a list of tickets from the first page', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        tickets: [
          {
            id: 1,
            subject: 'Cannot log in',
            description: 'Getting an error',
            status: 'new',
            priority: 'medium',
            customerEmail: 'jane@example.com',
            customerName: 'Jane Customer',
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      },
    });

    render(
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>
    );


    await waitFor(() => {
      expect(screen.getByText('Cannot log in')).toBeTruthy();
    });

    expect(screen.getByText(/Jane Customer/)).toBeTruthy();
  });

  it('does not show a Load more button when nextCursor is null', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: { tickets: [], nextCursor: null },
    });

    render(
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    expect(screen.queryByRole('button', { name: /load more/i })).toBeNull();
  });

  it('shows a Load more button and fetches the next page when clicked', async () => {
    const user = userEvent.setup();

    mockApiClient.get
      .mockResolvedValueOnce({
        data: {
          tickets: [
            {
              id: 1,
              subject: 'First page ticket',
              description: '',
              status: 'new',
              priority: 'medium',
              customerEmail: 'a@example.com',
              customerName: 'A',
              createdAt: new Date().toISOString(),
            },
          ],
          nextCursor: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          tickets: [
            {
              id: 2,
              subject: 'Second page ticket',
              description: '',
              status: 'new',
              priority: 'medium',
              customerEmail: 'b@example.com',
              customerName: 'B',
              createdAt: new Date().toISOString(),
            },
          ],
          nextCursor: null,
        },
      });

    render(
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('First page ticket')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: /load more/i }));

    await waitFor(() => {
      expect(screen.getByText('Second page ticket')).toBeTruthy();
    });

    expect(screen.getByText('First page ticket')).toBeTruthy();
  });
});