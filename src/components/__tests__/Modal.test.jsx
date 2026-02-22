import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal', () => {
    it('renders children when isOpen is true', () => {
        render(
            <Modal isOpen={true} onClose={() => { }} title="Test Modal">
                <p>Modal content</p>
            </Modal>
        );

        expect(screen.getByText('Modal content')).toBeInTheDocument();
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('does not render children when isOpen is false', () => {
        render(
            <Modal isOpen={false} onClose={() => { }} title="Test Modal">
                <p>Modal content</p>
            </Modal>
        );

        expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('calls onClose when the close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <p>Modal content</p>
            </Modal>
        );

        // The close button contains an X icon — find it by the button role near the title
        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when the backdrop is clicked', () => {
        const onClose = vi.fn();
        const { container } = render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <p>Modal content</p>
            </Modal>
        );

        // The backdrop is the first div with the bg-slate-900/50 class
        const backdrop = container.querySelector('.backdrop-blur-sm');
        fireEvent.click(backdrop);

        expect(onClose).toHaveBeenCalledOnce();
    });
});
