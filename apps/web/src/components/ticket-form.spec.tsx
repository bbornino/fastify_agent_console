import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketForm } from './ticket-form';

describe('TicketForm', () => {
  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<TicketForm onSubmit={onSubmit} submitLabel="Create Ticket" />);

    await user.click(screen.getByRole('button', { name: /create ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/subject is required/i)).toBeTruthy();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data with the correct shape', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<TicketForm onSubmit={onSubmit} submitLabel="Create Ticket" />);

    await user.type(screen.getByLabelText(/customer name/i), 'Jane Customer');
    await user.type(screen.getByLabelText(/customer email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Cannot log in');
    await user.type(screen.getByLabelText(/description/i), 'Getting an error message');
    await user.click(screen.getByRole('button', { name: /create ticket/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Jane Customer',
          customerEmail: 'jane@example.com',
          subject: 'Cannot log in',
          description: 'Getting an error message',
        }),
        expect.anything()
      );
    });
  });

  it('does not show status/assignment fields when showStatusFields is false', () => {
    render(<TicketForm onSubmit={vi.fn()} submitLabel="Create Ticket" />);

    expect(screen.queryByText(/^status$/i)).toBeNull();
    expect(screen.queryByText(/assigned agent/i)).toBeNull();
  });

  it('shows status/assignment fields when showStatusFields is true', () => {
    render(
      <TicketForm
        onSubmit={vi.fn()}
        submitLabel="Save Changes"
        showStatusFields
        agents={[{ id: 1, name: 'Alex Agent' }]}
      />
    );

    expect(screen.getByText(/^status$/i)).toBeTruthy();
    expect(screen.getByText(/assigned agent/i)).toBeTruthy();
  });

  it('pre-fills fields from defaultValues', () => {
    render(
      <TicketForm
        onSubmit={vi.fn()}
        submitLabel="Save Changes"
        defaultValues={{
          subject: 'Existing ticket subject',
          customerName: 'Existing Customer',
        }}
      />
    );

    expect(screen.getByDisplayValue('Existing ticket subject')).toBeTruthy();
    expect(screen.getByDisplayValue('Existing Customer')).toBeTruthy();
  });

  it('displays a server error message when provided', () => {
    render(
      <TicketForm onSubmit={vi.fn()} submitLabel="Create Ticket" serverError="Something broke" />
    );

    expect(screen.getByText('Something broke')).toBeTruthy();
  });
});