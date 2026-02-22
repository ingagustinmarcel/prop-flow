import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock react-i18next before importing the component
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const translations = {
                'units.tenantName': 'Tenant Name',
                'units.tenantEmail': 'Tenant Email',
                'units.rentAmount': 'Rent Amount',
                'units.rentPerMonth': 'Rent / Month',
                'units.securityDeposit': 'Security Deposit',
                'units.leaseStart': 'Start Date',
                'units.leaseEnd': 'End Date',
                'units.addLease': 'Add Lease',
                'units.editLease': 'Edit Lease',
                'common.save': 'Save',
                'common.cancel': 'Cancel',
            };
            return translations[key] || key;
        },
    }),
}));

import LeaseModal from '../LeaseModal';

describe('LeaseModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        unitId: 'unit-1',
        unitName: 'Unit 101',
        onSave: vi.fn(),
        mode: 'add',
        lease: null,
        currentTenantEmail: '',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all form fields in add mode', () => {
        render(<LeaseModal {...defaultProps} />);

        // Check the email field placeholder
        expect(screen.getByPlaceholderText('inquilino@email.com')).toBeInTheDocument();
        // Check rent inputs exist (placeholder is "0.00")
        const numberInputs = screen.getAllByPlaceholderText('0.00');
        expect(numberInputs.length).toBeGreaterThanOrEqual(1);
        // Check date inputs exist
        const { container } = render(<LeaseModal {...defaultProps} />);
        const dateInputs = container.querySelectorAll('input[type="date"]');
        expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    });

    it('pre-populates fields in edit mode', () => {
        const lease = {
            tenantName: 'John Doe',
            rentAmount: 150000,
            securityDeposit: 300000,
            startDate: '2025-03-01',
            endDate: '2026-03-01',
        };

        render(
            <LeaseModal
                {...defaultProps}
                mode="edit"
                lease={lease}
                currentTenantEmail="john@test.com"
            />
        );

        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('150000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('300000')).toBeInTheDocument();
    });

    it('calls onSave with correct payload including tenantEmail', () => {
        const onSave = vi.fn();

        render(<LeaseModal {...defaultProps} onSave={onSave} />);

        // Fill in required fields by targeting input names
        const nameInput = screen.getByPlaceholderText('inquilino@email.com')
            .closest('form')
            .querySelector('input[name="tenantName"]');
        const emailInput = screen.getByPlaceholderText('inquilino@email.com');
        const rentInput = screen.getByPlaceholderText('inquilino@email.com')
            .closest('form')
            .querySelector('input[name="rentAmount"]');

        fireEvent.change(nameInput, { target: { value: 'Jane', name: 'tenantName' } });
        fireEvent.change(emailInput, { target: { value: 'jane@mail.com', name: 'tenantEmail' } });
        fireEvent.change(rentInput, { target: { value: '200000', name: 'rentAmount' } });

        // Submit the form
        const form = emailInput.closest('form');
        fireEvent.submit(form);

        expect(onSave).toHaveBeenCalledOnce();
        const payload = onSave.mock.calls[0][0];
        expect(payload.tenantName).toBe('Jane');
        expect(payload.tenantEmail).toBe('jane@mail.com');
        expect(payload.rentAmount).toBe(200000);
        expect(payload.unitId).toBe('unit-1');
    });

    it('does not render when isOpen is false', () => {
        render(<LeaseModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByPlaceholderText('inquilino@email.com')).not.toBeInTheDocument();
    });
});
