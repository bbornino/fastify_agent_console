import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import App from './app';

describe('App', () => {
  it('should render successfully without crashing', () => {
    const { baseElement } = render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    expect(baseElement).toBeTruthy();
  });

  it('redirects an unauthenticated user to the login page', () => {
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(getByRole('heading', { name: /log in/i })).toBeTruthy();
  });
});