import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmployeeForm from './EmployeeForm';

describe('EmployeeForm', () => {
  it('requires fingerprint data when role is tech', async () => {
    const onSuccess = jest.fn();
    const onCancel = jest.fn();

    render(<EmployeeForm onSuccess={onSuccess} onCancel={onCancel} />);

    fireEvent.change(screen.getByLabelText(/Employee Code/i), {
      target: { value: 'EMP001' },
    });
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: 'Tech' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Department/i), {
      target: { value: 'engineering' },
    });
    fireEvent.change(screen.getByLabelText(/Role/i), {
      target: { value: 'tech' },
    });
    fireEvent.change(screen.getByLabelText(/Hire Date/i), {
      target: { value: '2026-06-04' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Employee/i }));

    // Check for error message (exact text match to avoid picking up helper text)
    const errorElements = screen.queryAllByText('Fingerprint data is required for tech employees');
    expect(errorElements.length).toBeGreaterThan(0);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
