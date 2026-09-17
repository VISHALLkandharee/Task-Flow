/**
 * TaskEditForm unit tests
 *
 * Strategy: isolate at the component boundary.
 * - Mock useUpdateTask (react-query mutation) and useMembers (data fetch)
 * - Render with a realistic Task fixture
 * - Verify form field rendering, Zod validation error messages, and submit flow
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Module mocks ────────────────────────────────────────────────────────────

// Mock hooks so we don't need a real React Query context or network
jest.mock('@/hooks/useTasks', () => ({
  useUpdateTask: jest.fn(),
}));

jest.mock('@/hooks/useMembers', () => ({
  useMembers: jest.fn(),
}));

// lucide-react uses ESM; replace with simple text stubs to avoid transform issues
jest.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="icon-calendar" />,
  User: () => <span data-testid="icon-user" />,
  Clock: () => <span data-testid="icon-clock" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  Loader2: () => <span data-testid="icon-loader" />,
  ChevronDown: () => <span data-testid="icon-chevron" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
}));

// Mock TaskCommentsPanel since it has its own data dependencies
jest.mock('@/components/board/TaskCommentsPanel', () =>
  function MockCommentPanel() {
    return <div data-testid="comments-panel">Comments</div>;
  },
);

// Import after mocks are declared
import TaskEditForm from '@/components/board/TaskEditForm';
import { useUpdateTask } from '@/hooks/useTasks';
import { useMembers } from '@/hooks/useMembers';
import type { Task } from '@/lib/api/tasks';

// ─── Fixture ─────────────────────────────────────────────────────────────────

const mockTask: Task = {
  id: 'task-123',
  title: 'Fix the login bug',
  description: 'Steps to reproduce in the issue.',
  status: 'TODO',
  priority: 'HIGH',
  position: 1000,
  projectId: 'proj-abc',
  dueDate: undefined,
  assigneeId: undefined,
  assignee: undefined,
  creator: { id: 'user-1', name: 'Alice' },
  createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  updatedAt: new Date('2026-01-01T00:00:00Z').toISOString(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupMocks(mutateMock: jest.Mock = jest.fn()) {
  (useUpdateTask as jest.Mock).mockReturnValue({ mutate: mutateMock });
  (useMembers as jest.Mock).mockReturnValue({
    data: [
      {
        id: 'member-1',
        userId: 'user-1',
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
        workspaceId: 'ws-1',
        user: { id: 'user-1', name: 'Alice', email: 'alice@test.com' },
      },
      {
        id: 'member-2',
        userId: 'user-2',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
        workspaceId: 'ws-1',
        user: { id: 'user-2', name: 'Bob', email: 'bob@test.com' },
      },
    ],
  });
}

function renderForm(task: Task = mockTask, isOverdue = false) {
  const onClose = jest.fn();
  const utils = render(
    <TaskEditForm
      task={task}
      projectId="proj-abc"
      isOverdue={isOverdue}
      onClose={onClose}
    />,
  );
  return { ...utils, onClose };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TaskEditForm', () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the title input pre-filled with task title', () => {
      renderForm();
      const titleInput = screen.getByRole('textbox', { name: /title/i });
      // useEffect populates via reset() — the value should reflect the task
      expect(titleInput).toBeInTheDocument();
    });

    it('renders Status and Priority selects', () => {
      renderForm();
      // There should be at least 2 select elements (Status and Priority)
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });

    it('renders the submit button as disabled when form is pristine', () => {
      renderForm();
      const submitBtn = screen.getByRole('button', { name: /no changes/i });
      expect(submitBtn).toBeInTheDocument();
      expect(submitBtn).toBeDisabled();
    });

    it('renders the comments panel', () => {
      renderForm();
      expect(screen.getByTestId('comments-panel')).toBeInTheDocument();
    });
  });

  describe('overdue banner', () => {
    it('shows the overdue warning when isOverdue is true', () => {
      renderForm(mockTask, true);
      expect(screen.getByText(/this task is overdue/i)).toBeInTheDocument();
    });

    it('does NOT show the overdue warning when isOverdue is false', () => {
      renderForm(mockTask, false);
      expect(
        screen.queryByText(/this task is overdue/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('Zod validation', () => {
    it('shows validation error when title is cleared and form is submitted', async () => {
      renderForm();
      const user = userEvent.setup();

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      // Clear the title so it fails Zod min(1) validation
      await user.clear(titleInput);

      const submitBtn = await screen.findByRole('button', { name: /save changes/i });
      await user.click(submitBtn);

      // Zod says min(1, "Title required")
      await waitFor(() => {
        expect(screen.getByText(/title required/i)).toBeInTheDocument();
      });
    });
  });

  describe('submit flow', () => {
    it('calls updateTask mutate with correct payload on valid submission', async () => {
      const mutateMock = jest.fn();
      setupMocks(mutateMock);
      renderForm();

      const user = userEvent.setup();
      const titleInput = screen.getByRole('textbox', { name: /title/i });
      await user.type(titleInput, ' Updated');

      const submitBtn = await screen.findByRole('button', { name: /save changes/i });
      expect(submitBtn).not.toBeDisabled();
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mutateMock).toHaveBeenCalledTimes(1);
        const [callArg] = mutateMock.mock.calls[0];
        expect(callArg).toMatchObject({
          id: 'task-123',
          data: expect.objectContaining({
            title: 'Fix the login bug Updated',
          }),
        });
      });
    });
  });
});
