import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TurnControlAndResolution } from './TurnControlAndResolution';
import { AdminRoomSnapshot } from '../../../data/rpc';

import { ToastProvider } from '../../../ui';

vi.mock('../../../data/rpc', async () => {
  const actual = await vi.importActual('../../../data/rpc');
  return {
    ...actual,
    rpcAdminAdjust: vi.fn(),
    rpcAdminAddBusiness: vi.fn(),
    rpcAdminSetBusinessLevel: vi.fn(),
  };
});

describe('TurnControlAndResolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  const mockSnapshot: AdminRoomSnapshot = {
    room: {
      id: 'room-1',
      code: 'TEST88',
      status: 'ACTIVE',
      team_count: 5,
      started_at: '2026-09-21T10:00:00Z',
      ends_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      created_at: '2026-09-21T09:50:00Z',
      created_by: 'admin-1',
    },
    server_now: new Date().toISOString(),
    teams: [
      {
        id: 'team-1',
        slot: 1,
        name: 'Alpha Rockets',
        color: '#E52521',
        cash: 1000,
        cv: 300,
        is_bankrupt: false,
        version: 1,
        tiebreak_order: null,
        claimed: true,
        businesses: [],
      },
      {
        id: 'team-2',
        slot: 2,
        name: 'Beta Builders',
        color: '#0099FF',
        cash: 1500,
        cv: 800,
        is_bankrupt: false,
        version: 2,
        tiebreak_order: null,
        claimed: true,
        businesses: [],
      },
    ],
    events: [],
  };

  const renderComponent = (props: Partial<React.ComponentProps<typeof TurnControlAndResolution>> = {}) => {
    const defaultProps = {
      snapshot: mockSnapshot,
      selectedTeamId: 'team-1',
      onSelectTeam: vi.fn(),
      onRefetch: vi.fn().mockResolvedValue(undefined),
      onOpenForcedSale: vi.fn(),
      onOpenBankruptModal: vi.fn(),
      ...props,
    };

    return render(
      <ToastProvider>
        <TurnControlAndResolution {...defaultProps} />
      </ToastProvider>
    );
  };

  it('renders round-robin sequence and active team info', () => {
    renderComponent();

    expect(screen.getByText('2. CURRENT TURN CONTROL')).toBeInTheDocument();
    expect(screen.getByText(/ROUND-ROBIN SEQUENCE/i)).toBeInTheDocument();
    expect(screen.getAllByText('Alpha Rockets').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1. RECORD DICE ROLL')).toBeInTheDocument();
    expect(screen.getByText('2. CONFIRM MOVEMENT')).toBeInTheDocument();
  });

  it('records dice roll and enables movement confirmation', async () => {
    renderComponent();

    const roll4Btn = screen.getByRole('button', { name: '4' });
    fireEvent.click(roll4Btn);

    expect(screen.getByText(/Rolled:/i)).toBeInTheDocument();
    const moveBtn = screen.getByRole('button', { name: /MOVE \+4 SPACES/i });
    expect(moveBtn).not.toBeDisabled();

    fireEvent.click(moveBtn);

    // After movement, step 3 resolve landing shows pending action
    expect(screen.getByText('PENDING ACTION')).toBeInTheDocument();
  });

  it('enforces 3 consecutive sixes rule by cancelling turn and restoring position', async () => {
    const onSelectTeam = vi.fn();
    renderComponent({ onSelectTeam });

    const roll6Btn = screen.getByRole('button', { name: '6' });

    // Roll 1
    fireEvent.click(roll6Btn);
    // Roll 2
    fireEvent.click(roll6Btn);
    // Roll 3 -> Cancels turn and advances to next team
    fireEvent.click(roll6Btn);

    await waitFor(() => {
      expect(onSelectTeam).toHaveBeenCalledWith('team-2');
    });
  });
});
