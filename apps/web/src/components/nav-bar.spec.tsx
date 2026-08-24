import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { MemoryRouter } from 'react-router';
import { NavBar } from './nav-bar';
import { useAuthStore } from '@/stores/auth-store';

describe('NavBar', () => {
  it('renders all nav links', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /home/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /^tickets$/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /new ticket/i })).toBeTruthy();
  });

  it("renders the logged-in user's name when a user is set", () => {
    act(() => {
      useAuthStore.setState({
        user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'agent', avatarUrl: null },
      });
    });

    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    expect(screen.getByText('Test User')).toBeTruthy();

    act(() => {
      useAuthStore.setState({ user: null });
    });
  });

  it('calls the store logout action when Log out is clicked', async () => {
    const user = userEvent.setup();
    const logoutSpy = vi.fn();

    act(() => {
      useAuthStore.setState({ logout: logoutSpy });
    });

    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /log out/i }));

    expect(logoutSpy).toHaveBeenCalled();

    act(() => {
      useAuthStore.setState({ logout: useAuthStore.getInitialState().logout });
    });
  });
});