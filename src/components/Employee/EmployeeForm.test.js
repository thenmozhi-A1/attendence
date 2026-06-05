import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmployeeForm from './EmployeeForm';
import employeeService from '../../services/employeeService';
import webauthnService from '../../services/webauthnService';

jest.mock('../../services/employeeService', () => ({
  addEmployee: jest.fn(),
  updateEmployee: jest.fn(),
}));

jest.mock('../../services/webauthnService', () => ({
  isSupported: jest.fn(),
  register: jest.fn(),
}));

describe('EmployeeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    employeeService.addEmployee.mockResolvedValue({ id: 'emp-1', employeeCode: 'EMP001' });
    webauthnService.isSupported.mockReturnValue(true);
    webauthnService.register.mockResolvedValue({});
  });

  it('registers device biometric after saving a tech employee', async () => {
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

    await waitFor(() => {
      expect(employeeService.addEmployee).toHaveBeenCalled();
      expect(webauthnService.register).toHaveBeenCalledWith('emp-1');
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
