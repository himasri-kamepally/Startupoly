import React, { useState, useEffect } from 'react';
import {
  AdminRoomSnapshot,
  rpcAdminAdjust,
  rpcAdminAddBusiness,
  rpcAdminSetBusinessLevel,
} from '../../../data/rpc';
import {
  getBoardSpace,
  calculateMovement,
  REAL_BONUS_CARDS,
  REAL_CRISIS_CARDS,
  WILDCARD_CHALLENGES,
  BoardSpace,
} from '../../../domain/board';
import {
  PersistedMatchState,
  loadMatchState,
  saveMatchState,
  getNextActiveTeamId,
} from '../../../domain/matchState';
import {
  OFFICIAL_BUSINESSES,
  startReward,
  rentFor,
  landingCvFor,
  upgradeCost,
  upgradeCvGain,
} from '../../../domain/economy';
import { Level } from '../../../domain/types';
import { PixelButton, PixelCard, useToast } from '../../../ui';

export interface TurnControlAndResolutionProps {
  snapshot: AdminRoomSnapshot;
  selectedTeamId?: string;
  onSelectTeam: (id: string) => void;
  disabled?: boolean;
  isTimeExpired?: boolean;
  onRefetch: () => Promise<void>;
  onOpenForcedSale: (teamId: string, shortfall?: number) => void;
  onOpenBankruptModal?: (mode: 'declare' | 'undo') => void;
}

export const TurnControlAndResolution: React.FC<TurnControlAndResolutionProps> = ({
  snapshot,
  selectedTeamId: _selectedTeamId,
  onSelectTeam,
  disabled = false,
  isTimeExpired = false,
  onRefetch,
  onOpenForcedSale,
  onOpenBankruptModal: _onOpenBankruptModal,
}) => {
  const { successToast, errorToast } = useToast();

  // Match / Turn state from localStorage & snapshot
  const [matchState, setMatchState] = useState<PersistedMatchState>(() =>
    loadMatchState(snapshot.room.id, snapshot.teams)
  );

  // Sync state whenever teams or room status changes
  useEffect(() => {
    setMatchState((_prev) => {
      const loaded = loadMatchState(snapshot.room.id, snapshot.teams);
      const validActive = snapshot.teams.some((t) => t.id === loaded.activeTeamId)
        ? loaded.activeTeamId
        : snapshot.teams[0]?.id || '';
      return {
        ...loaded,
        activeTeamId: validActive,
      };
    });
  }, [snapshot.room.id, snapshot.teams]);

  const activeTeam =
    snapshot.teams.find((t) => t.id === matchState.activeTeamId) || snapshot.teams[0];

  const currentPos = activeTeam ? matchState.positions[activeTeam.id] ?? 0 : 0;
  const currentSpace = getBoardSpace(currentPos);

  // Selected card / target team for resolution panels
  const [selectedBonusCardId, setSelectedBonusCardId] = useState<number>(1);
  const [selectedCrisisCardId, setSelectedCrisisCardId] = useState<number>(1);
  const [luckyBreakRoll, setLuckyBreakRoll] = useState<number>(1);
  const [wildcardIdx, setWildcardIdx] = useState<number>(0);
  const [stealTargetTeamId, setStealTargetTeamId] = useState<string>(() => {
    const other = snapshot.teams.find((t) => t.id !== activeTeam?.id && !t.is_bankrupt);
    return other?.id || '';
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Update localStorage when matchState changes
  const updateMatchState = (updater: (prev: PersistedMatchState) => PersistedMatchState) => {
    setMatchState((prev) => {
      const next = updater(prev);
      saveMatchState(next);
      return next;
    });
  };

  const isCurrentTeamSkipped = Boolean(activeTeam && matchState.skippedTurns[activeTeam.id]);

  // Acknowledge Skip & pass turn
  const handleAcknowledgeSkip = () => {
    if (!activeTeam) return;
    const bankruptSet = new Set(snapshot.teams.filter((t) => t.is_bankrupt).map((t) => t.id));
    const nextTeamId = getNextActiveTeamId(activeTeam.id, matchState.turnOrder, bankruptSet);

    const nextTeam = snapshot.teams.find((t) => t.id === nextTeamId);

    updateMatchState((prev) => ({
      ...prev,
      skippedTurns: {
        ...prev.skippedTurns,
        [activeTeam.id]: false,
        [`slot-${activeTeam.slot}`]: false,
      },
      activeTeamId: nextTeamId,
      activeTeamSlot: nextTeam?.slot ?? 1,
      currentRoll: null,
      rollHistory: [],
      consecutiveSixes: 0,
      turnStep: 'ROLL',
      landingResolved: false,
      extraRollGranted: false,
      pendingResolution: null,
      preTurnSnapshot: null,
    }));
    onSelectTeam(nextTeamId);
    successToast(`Skipped ${activeTeam.name}'s turn. Now up: ${snapshot.teams.find((t) => t.id === nextTeamId)?.name}`);
  };

  // 1. Record Dice Roll (1..6)
  const handleRollDice = (roll: number) => {
    if (disabled || isTimeExpired || !activeTeam || isCurrentTeamSkipped) return;

    // Rulebook Section 11: Roll determines card drawn
    setSelectedBonusCardId(roll);
    setSelectedCrisisCardId(roll);

    const newRollHistory = [...matchState.rollHistory, roll];
    const isSix = roll === 6;
    const newConsecutiveSixes = isSix ? matchState.consecutiveSixes + 1 : 0;

    // RULE: Three consecutive 6s cancels the entire turn and restores starting position!
    if (newConsecutiveSixes >= 3) {
      errorToast(`Three consecutive 6s! ${activeTeam.name}'s turn is cancelled.`);
      const restoredPos = matchState.preTurnSnapshot?.position ?? currentPos;

      const bankruptSet = new Set(snapshot.teams.filter((t) => t.is_bankrupt).map((t) => t.id));
      const nextTeamId = getNextActiveTeamId(activeTeam.id, matchState.turnOrder, bankruptSet);

      updateMatchState((prev) => ({
        ...prev,
        currentRoll: null,
        rollHistory: [],
        consecutiveSixes: 0,
        positions: {
          ...prev.positions,
          [activeTeam.id]: restoredPos,
        },
        turnStep: 'ROLL',
        landingResolved: false,
        extraRollGranted: false,
        pendingResolution: null,
        preTurnSnapshot: null,
        activeTeamId: nextTeamId,
      }));

      onSelectTeam(nextTeamId);
      return;
    }

    // Save pre-turn snapshot if first roll in this turn
    const preSnapshot =
      matchState.preTurnSnapshot || {
        teamId: activeTeam.id,
        position: currentPos,
        cash: activeTeam.cash,
        cv: activeTeam.cv,
      };

    updateMatchState((prev) => ({
      ...prev,
      currentRoll: roll,
      rollHistory: newRollHistory,
      consecutiveSixes: newConsecutiveSixes,
      preTurnSnapshot: preSnapshot,
      turnStep: 'ROLL',
      landingResolved: false,
    }));
  };

  // 2. Confirm Movement
  const handleConfirmMovement = () => {
    if (disabled || isTimeExpired || !activeTeam || matchState.currentRoll === null) return;

    const roll = matchState.currentRoll;
    const { newPos, passedStart } = calculateMovement(currentPos, roll);

    updateMatchState((prev) => ({
      ...prev,
      positions: {
        ...prev.positions,
        [activeTeam.id]: newPos,
        [`slot-${activeTeam.slot}`]: newPos,
      },
      turnStep: 'RESOLVE',
      landingResolved: false,
      extraRollGranted: roll === 6,
      pendingResolution: {
        spaceIndex: newPos,
        passedStart,
      },
    }));

    if (passedStart && newPos !== 0) {
      successToast(`${activeTeam.name} passed START! Remember to collect START lap reward.`);
    }
  };

  // 3. Mark Landing Resolved
  const markLandingComplete = () => {
    updateMatchState((prev) => ({
      ...prev,
      landingResolved: true,
      turnStep: 'DONE',
    }));
  };

  // 4. End Turn (or Take Extra Roll)
  const handleEndTurn = () => {
    if (disabled || !activeTeam || !matchState.landingResolved) return;

    // If extra roll is granted (rolled a 6), start next roll for the same team
    if (matchState.extraRollGranted) {
      successToast(`Roll of 6 bonus! ${activeTeam.name} takes an extra roll.`);
      updateMatchState((prev) => ({
        ...prev,
        currentRoll: null,
        turnStep: 'ROLL',
        landingResolved: false,
        extraRollGranted: false,
        pendingResolution: null,
      }));
      return;
    }

    // Advance to next active team in round-robin sequence
    const bankruptSet = new Set(snapshot.teams.filter((t) => t.is_bankrupt).map((t) => t.id));
    const nextTeamId = getNextActiveTeamId(activeTeam.id, matchState.turnOrder, bankruptSet);

    const nextTeam = snapshot.teams.find((t) => t.id === nextTeamId);

    updateMatchState((prev) => ({
      ...prev,
      activeTeamId: nextTeamId,
      activeTeamSlot: nextTeam?.slot ?? 1,
      currentRoll: null,
      rollHistory: [],
      consecutiveSixes: 0,
      turnStep: 'ROLL',
      landingResolved: false,
      extraRollGranted: false,
      pendingResolution: null,
      preTurnSnapshot: null,
    }));

    onSelectTeam(nextTeamId);
  };

  // Quick action resolutions
  const handleBuyBusiness = async (space: BoardSpace) => {
    if (!activeTeam || !space.businessKey || isSubmitting) return;

    const catalogBiz = OFFICIAL_BUSINESSES.find((b) => b.key === space.businessKey);
    if (!catalogBiz) return;

    if (activeTeam.businesses.length >= 3) {
      errorToast(`${activeTeam.name} already holds maximum 3 businesses.`);
      return;
    }

    if (activeTeam.cash < catalogBiz.cost) {
      errorToast(`Insufficient cash: ${activeTeam.name} has ₹${activeTeam.cash}, needs ₹${catalogBiz.cost}.`);
      onOpenForcedSale(activeTeam.id, catalogBiz.cost - activeTeam.cash);
      return;
    }

    try {
      setIsSubmitting(true);
      await rpcAdminAddBusiness({
        team_id: activeTeam.id,
        business_key: space.businessKey,
        apply_purchase: true,
        expected_version: activeTeam.version,
        note: `${activeTeam.name} bought ${space.name} for ₹${catalogBiz.cost}`,
      });
      successToast(`${activeTeam.name} acquired ${space.name}!`);
      markLandingComplete();
      await onRefetch();
    } catch (err: any) {
      errorToast(err.message || 'Failed to buy business.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclinePurchase = (space: BoardSpace) => {
    successToast(`${activeTeam.name} declined purchase of ${space.name}.`);
    markLandingComplete();
  };

  const handlePayRent = async (space: BoardSpace) => {
    if (!activeTeam || !space.businessKey || isSubmitting) return;

    // Find owner of this business
    const owner = snapshot.teams.find((t) =>
      t.businesses.some((b) => b.business_key === space.businessKey)
    );
    if (!owner || owner.id === activeTeam.id) return;

    const ownedBiz = owner.businesses.find((b) => b.business_key === space.businessKey);
    const catalogBiz = OFFICIAL_BUSINESSES.find((b) => b.key === space.businessKey);
    const level = (ownedBiz?.level ?? 0) as Level;

    const rent = catalogBiz ? rentFor(catalogBiz, level) : 100;
    const ownerCv = catalogBiz ? landingCvFor(catalogBiz, level) : 100;

    if (activeTeam.cash < rent) {
      const shortfall = rent - activeTeam.cash;
      errorToast(`Insufficient cash! Shortfall of ₹${shortfall}. Forced sale required.`);
      onOpenForcedSale(activeTeam.id, shortfall);
      return;
    }

    try {
      setIsSubmitting(true);
      const changes = [
        {
          team_id: activeTeam.id,
          cash_delta: -rent,
          cv_delta: 0,
          expected_version: activeTeam.version,
        },
        {
          team_id: owner.id,
          cash_delta: rent,
          cv_delta: ownerCv,
          expected_version: owner.version,
        },
      ];

      await rpcAdminAdjust({
        changes,
        label: 'RENT',
        note: `${activeTeam.name} paid ₹${rent} rent to ${owner.name}`,
      });

      successToast(`Rent paid: ₹${rent} to ${owner.name}! Owner earned +${ownerCv} CV.`);
      markLandingComplete();
      await onRefetch();
    } catch (err: any) {
      errorToast(err.message || 'Failed to record rent payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpgradeOnLanding = async (space: BoardSpace) => {
    if (!activeTeam || !space.businessKey || isSubmitting) return;

    const ownedBiz = activeTeam.businesses.find((b) => b.business_key === space.businessKey);
    const catalogBiz = OFFICIAL_BUSINESSES.find((b) => b.key === space.businessKey);
    if (!ownedBiz || !catalogBiz) return;

    const currentLevel = (ownedBiz.level ?? 0) as Level;
    if (currentLevel >= 2) return;

    const cost = upgradeCost(catalogBiz, currentLevel);
    const cvGain = upgradeCvGain(catalogBiz, currentLevel);

    if (activeTeam.cash < cost) {
      const shortfall = cost - activeTeam.cash;
      errorToast(`Insufficient cash: needs ₹${cost}. Shortfall: ₹${shortfall}`);
      onOpenForcedSale(activeTeam.id, shortfall);
      return;
    }

    try {
      setIsSubmitting(true);
      await rpcAdminSetBusinessLevel({
        team_id: activeTeam.id,
        business_key: space.businessKey,
        new_level: currentLevel + 1,
        apply_upgrade: true,
        expected_version: activeTeam.version,
        request_id: crypto.randomUUID(),
        note: `${activeTeam.name} upgraded ${catalogBiz.name} to Level ${currentLevel + 1} (−₹${cost}, +${cvGain} CV)`,
      });
      successToast(`Upgraded ${catalogBiz.name} to Level ${currentLevel + 1}!`);
      markLandingComplete();
      await onRefetch();
    } catch (err: any) {
      errorToast(err.message || 'Failed to upgrade business.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectStart = async () => {
    if (!activeTeam || isSubmitting) return;

    const reward = startReward(activeTeam.businesses.length);

    try {
      setIsSubmitting(true);
      await rpcAdminAdjust({
        changes: [
          {
            team_id: activeTeam.id,
            cash_delta: reward.cash,
            cv_delta: reward.cv,
            expected_version: activeTeam.version,
          },
        ],
        label: 'START_LAP',
        note: `${activeTeam.name} passed START: +₹${reward.cash} cash, +${reward.cv} CV`,
      });

      successToast(`Collected START reward: +₹${reward.cash} cash, +${reward.cv} CV!`);
      markLandingComplete();
      await onRefetch();
    } catch (err: any) {
      errorToast(err.message || 'Failed to collect START reward.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyBonusCard = async (cardId: number) => {
    if (!activeTeam || isSubmitting) return;

    const card = REAL_BONUS_CARDS.find((c) => c.id === cardId);
    if (!card) return;

    let cashDelta = card.cashDelta;
    let cvDelta = card.cvDelta;

    if (cardId === 4) {
      // Premium Deal: Cash equal to purchase cost of most expensive owned business
      cashDelta = activeTeam.businesses.reduce((acc, b) => Math.max(acc, b.cost), 0);
    } else if (cardId === 5) {
      // Founder Bonus: ₹100 × number of businesses owned
      cashDelta = 100 * activeTeam.businesses.length;
    } else if (cardId === 6) {
      // Lucky Break: Roll again; receive ₹100 × number rolled (reward roll only)
      cashDelta = 100 * luckyBreakRoll;
    }

    try {
      setIsSubmitting(true);
      await rpcAdminAdjust({
        changes: [
          {
            team_id: activeTeam.id,
            cash_delta: cashDelta,
            cv_delta: cvDelta,
            expected_version: activeTeam.version,
          },
        ],
        label: `BONUS_CARD_${cardId}`,
        note: `${activeTeam.name} drew Bonus #${cardId} (${card.title}): +₹${cashDelta} cash${cvDelta > 0 ? `, +${cvDelta} CV` : ''}`,
      });

      successToast(`Applied Bonus #${cardId}: ${card.title}!`);
      markLandingComplete();
      await onRefetch();
    } catch (err: any) {
      errorToast(err.message || 'Failed to apply Bonus card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyCrisisCard = async (cardId: number) => {
    if (!activeTeam || isSubmitting) return;

    const card = REAL_CRISIS_CARDS.find((c) => c.id === cardId);
    if (!card) return;

    let cashDelta = card.cashDelta;
    let cvDelta = card.cvDelta;

    if (cardId === 4) {
      // Burn Rate Spike: −₹100 Cash for every Business owned
      cashDelta = -100 * activeTeam.businesses.length;
    } else if (cardId === 5) {
      // Bad PR: −200 Company Value + −₹100 Cash
      cashDelta = -100;
      cvDelta = -200;
    }

    if (cashDelta < 0 && activeTeam.cash < Math.abs(cashDelta)) {
      const shortfall = Math.abs(cashDelta) - activeTeam.cash;
      errorToast(`Crisis shortfall of ₹${shortfall}! Forced sale required.`);
      onOpenForcedSale(activeTeam.id, shortfall);
      return;
    }

    try {
      setIsSubmitting(true);
      await rpcAdminAdjust({
        changes: [
          {
            team_id: activeTeam.id,
            cash_delta: cashDelta,
            cv_delta: cvDelta,
            expected_version: activeTeam.version,
          },
        ],
        label: `CRISIS_CARD_${cardId}`,
        note: `${activeTeam.name} drew Crisis #${cardId} (${card.title}): ${cashDelta !== 0 ? `−₹${Math.abs(cashDelta)} cash` : ''}${cvDelta !== 0 ? `, ${cvDelta} CV` : ''}`,
      });

      successToast(`Applied Crisis #${cardId}: ${card.title}!`);
      markLandingComplete();
      await onRefetch();
    } catch (err: any) {
      errorToast(err.message || 'Failed to apply Crisis card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePitchOutcome = async (success: boolean) => {
    if (!activeTeam || isSubmitting) return;

    if (activeTeam.businesses.length === 0) {
      successToast(`${activeTeam.name} owns 0 businesses: Pitch action skipped with no penalty.`);
      markLandingComplete();
      return;
    }

    if (success) {
      try {
        setIsSubmitting(true);
        await rpcAdminAdjust({
          changes: [
            {
              team_id: activeTeam.id,
              cash_delta: 0,
              cv_delta: 0,
              expected_version: activeTeam.version,
            },
          ],
          label: 'PITCH_COMPLETE',
          note: `${activeTeam.name} completed pitch to investors successfully`,
        });
        successToast(`${activeTeam.name} completed pitch! (No penalty)`);
        markLandingComplete();
        await onRefetch();
      } catch (err: any) {
        errorToast(err.message || 'Failed to record pitch completion.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      updateMatchState((prev) => ({
        ...prev,
        skippedTurns: {
          ...prev.skippedTurns,
          [activeTeam.id]: true,
          [`slot-${activeTeam.slot}`]: true,
        },
      }));
      successToast(`${activeTeam.name} failed/refused pitch: next turn skipped.`);
      markLandingComplete();
    }
  };

  const handleLoseFeature = async () => {
    if (!activeTeam || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await rpcAdminAdjust({
        changes: [
          {
            team_id: activeTeam.id,
            cash_delta: 0,
            cv_delta: -200,
            expected_version: activeTeam.version,
          },
        ],
        label: 'LOSE_FEATURE',
        note: `${activeTeam.name} lost feature: −200 CV`,
      });
      successToast(`${activeTeam.name} lost feature (−200 CV)!`);
      markLandingComplete();
      await onRefetch();
    } catch (err: any) {
      errorToast(err.message || 'Failed to record lose feature.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStealTalent = async () => {
    if (!activeTeam || !stealTargetTeamId || isSubmitting) return;

    const target = snapshot.teams.find((t) => t.id === stealTargetTeamId);
    if (!target) return;

    const amount = Math.min(100, Math.max(0, target.cash));

    try {
      setIsSubmitting(true);
      const changes = [
        {
          team_id: activeTeam.id,
          cash_delta: amount,
          cv_delta: 0,
          expected_version: activeTeam.version,
        },
      ];
      if (amount > 0) {
        changes.push({
          team_id: target.id,
          cash_delta: -amount,
          cv_delta: 0,
          expected_version: target.version,
        });
      }

      await rpcAdminAdjust({
        changes,
        label: 'STEAL_TALENT',
        note:
          amount > 0
            ? `${activeTeam.name} stole ₹${amount} from ${target.name}`
            : `${activeTeam.name} targeted ${target.name} for Steal Talent, but target held ₹0`,
      });
      successToast(amount > 0 ? `Stole ₹${amount} from ${target.name}!` : `Target ${target.name} had ₹0!`);
      markLandingComplete();
      await onRefetch();
    } catch (err: any) {
      errorToast(err.message || 'Failed to execute steal talent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeTeam) {
    return (
      <div className="bg-[#102040] text-white border-4 border-[#102040] p-6 text-center shadow-[4px_4px_0px_#102040]">
        <span className="font-pixel text-xs text-[#FFCC00]">NO ACTIVE TEAMS CONFIGURED</span>
      </div>
    );
  }

  // Determine owner of current space if it is a business
  const isBusinessSpace = currentSpace.type === 'BUSINESS' && currentSpace.businessKey;
  const businessOwner = isBusinessSpace
    ? snapshot.teams.find((t) =>
        t.businesses.some((b) => b.business_key === currentSpace.businessKey)
      )
    : null;
  const isOwnedByCurrentTeam = businessOwner?.id === activeTeam.id;
  const isOwnedByOtherTeam = businessOwner && businessOwner.id !== activeTeam.id;

  const currentOwnedBiz = isOwnedByCurrentTeam
    ? activeTeam.businesses.find((b) => b.business_key === currentSpace.businessKey)
    : null;
  const catalogCurrentBiz = currentSpace.businessKey
    ? OFFICIAL_BUSINESSES.find((b) => b.key === currentSpace.businessKey)
    : null;
  const currentBizLevel = (currentOwnedBiz?.level ?? 0) as Level;
  const canUpgradeCurrentBiz = isOwnedByCurrentTeam && currentBizLevel < 2;
  const upgradeCostAmount =
    catalogCurrentBiz && canUpgradeCurrentBiz ? upgradeCost(catalogCurrentBiz, currentBizLevel) : 0;
  const upgradeCvGainAmount =
    catalogCurrentBiz && canUpgradeCurrentBiz ? upgradeCvGain(catalogCurrentBiz, currentBizLevel) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ============================================================== */}
      {/* SECTION B.2: CURRENT TURN CONTROL                              */}
      {/* ============================================================== */}
      <PixelCard
        title="2. CURRENT TURN CONTROL"
        headerBg="navy"
        headerRight={
          <span className="font-mono text-[10px] text-[#94A3B8]">
            ROUND-ROBIN SEQUENCE (24-SPACE BOARD)
          </span>
        }
      >
        <div className="flex flex-col gap-4">
          {/* If Active Team's turn is skipped */}
          {isCurrentTeamSkipped && (
            <div className="bg-[#7F1D1D] border-2 border-[#EF4444] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠</span>
                <div>
                  <span className="font-pixel text-xs text-white block">
                    TURN SKIPPED: {activeTeam.name.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs text-[#FCA5A5]">
                    Carried over penalty from failing/refusing an Action B pitch.
                  </span>
                </div>
              </div>
              <PixelButton variant="primary" size="sm" onClick={handleAcknowledgeSkip}>
                ACKNOWLEDGE SKIP & PASS TURN →
              </PixelButton>
            </div>
          )}

          {/* Active Team Identity & Round-Robin Strip */}
          <div className="bg-[#0B132B] border-2 border-[#1E294B] p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[2px_2px_0px_#050810]">
            <div className="flex items-center gap-3">
              <span
                className="w-6 h-6 border-2 border-white shadow-[2px_2px_0px_#000] flex-shrink-0"
                style={{ backgroundColor: activeTeam.color }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[10px] text-[#00F0FF] uppercase tracking-wider">
                    SLOT #{activeTeam.slot}
                  </span>
                  <span className="bg-[#22C55E] text-[#0A101D] font-pixel text-[9px] px-1.5 py-0.5 font-bold uppercase anim-pulse-dot">
                    UP NOW
                  </span>
                </div>
                <h3 className="font-pixel text-sm sm:text-base text-white tracking-wide">
                  {activeTeam.name}
                </h3>
              </div>
            </div>

            {/* Current Board Position Badge */}
            <div className="bg-[#162544] border-2 border-[#38BDF8] px-3.5 py-2 flex items-center gap-2 shadow-[2px_2px_0px_#000]">
              <span className="font-pixel text-[10px] text-[#94A3B8] uppercase">POSITION:</span>
              <span className="font-pixel text-xs text-[#FFCC00]">
                SPACE #{currentPos} of 24: {currentSpace.name}
              </span>
            </div>
          </div>

          {/* Round-Robin Turn Sequence Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="font-pixel text-[10px] text-[#64748B] uppercase whitespace-nowrap">
              TURN ORDER:
            </span>
            {snapshot.teams.map((t) => {
              const isUp = t.id === activeTeam.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    updateMatchState((prev) => ({ ...prev, activeTeamId: t.id, activeTeamSlot: t.slot }));
                    onSelectTeam(t.id);
                  }}
                  className={`
                    font-pixel text-[10px] px-2.5 py-1.5 border-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer
                    ${
                      isUp
                        ? 'bg-[#FFCC00] text-[#0A101D] border-[#102040] shadow-[2px_2px_0px_#000] font-bold'
                        : t.is_bankrupt
                        ? 'bg-[#1E293B] text-[#64748B] border-[#334155] line-through opacity-60'
                        : 'bg-[#1E294B] text-white border-[#334155] hover:bg-[#2A3B66]'
                    }
                  `}
                >
                  <span className="w-2.5 h-2.5 border border-white" style={{ backgroundColor: t.color }} />
                  <span>#{t.slot} {t.name}</span>
                  {isUp && <span className="text-[9px]">★</span>}
                </button>
              );
            })}
          </div>

          {/* 4-Step Operator Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#131E38] border-2 border-[#1E294B] p-3 shadow-[2px_2px_0px_#050810]">
            {/* Step 1: Record Dice Roll */}
            <div className="flex flex-col gap-1.5 border-b sm:border-b-0 sm:border-r border-[#1E294B] pb-2 sm:pb-0 sm:pr-3">
              <span className="font-pixel text-[10px] text-[#00F0FF] uppercase">
                1. RECORD DICE ROLL
              </span>
              <div className="grid grid-cols-6 gap-1">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleRollDice(num)}
                    disabled={disabled || isTimeExpired || isCurrentTeamSkipped}
                    className={`
                      font-pixel text-xs py-2 border-2 transition-all cursor-pointer font-bold
                      ${
                        matchState.currentRoll === num
                          ? 'bg-[#FFCC00] text-[#0A101D] border-white shadow-[0_0_8px_#FFCC00]'
                          : 'bg-[#1E294B] text-white border-[#334155] hover:bg-[#38BDF8] hover:text-[#0A101D]'
                      }
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {matchState.currentRoll !== null && (
                <span className="font-mono text-[10px] text-[#38BDF8] block">
                  Rolled: <strong>{matchState.currentRoll}</strong>
                  {matchState.currentRoll === 6 && ' (Extra roll granted after resolution!)'}
                </span>
              )}
            </div>

            {/* Step 2: Confirm Movement */}
            <div className="flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-[#1E294B] pb-2 sm:pb-0 sm:pr-3">
              <span className="font-pixel text-[10px] text-[#00F0FF] uppercase">
                2. CONFIRM MOVEMENT
              </span>
              <PixelButton
                variant={matchState.currentRoll !== null ? 'primary' : 'secondary'}
                size="sm"
                fullWidth
                disabled={matchState.currentRoll === null || disabled || isTimeExpired || isCurrentTeamSkipped}
                onClick={handleConfirmMovement}
              >
                MOVE +{matchState.currentRoll || 0} SPACES
              </PixelButton>
            </div>

            {/* Step 3: Resolve Landing */}
            <div className="flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-[#1E294B] pb-2 sm:pb-0 sm:pr-3">
              <span className="font-pixel text-[10px] text-[#00F0FF] uppercase">
                3. RESOLVE LANDING
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 border border-white ${
                    matchState.landingResolved ? 'bg-[#22C55E]' : 'bg-[#EF4444] animate-pulse'
                  }`}
                />
                <span className="font-pixel text-[10px] text-white">
                  {matchState.landingResolved ? 'LANDING RESOLVED' : 'PENDING ACTION'}
                </span>
              </div>
            </div>

            {/* Step 4: End Turn */}
            <div className="flex flex-col justify-between">
              <span className="font-pixel text-[10px] text-[#00F0FF] uppercase">
                4. END TURN
              </span>
              <PixelButton
                variant={matchState.landingResolved ? 'primary' : 'ghost'}
                size="sm"
                fullWidth
                disabled={!matchState.landingResolved || disabled || isTimeExpired}
                onClick={handleEndTurn}
              >
                {matchState.extraRollGranted ? 'TAKE EXTRA ROLL (ROLLED 6)' : 'END TURN →'}
              </PixelButton>
            </div>
          </div>
        </div>
      </PixelCard>

      {/* ============================================================== */}
      {/* SECTION B.3: LANDING RESOLUTION PANEL                          */}
      {/* ============================================================== */}
      <PixelCard
        title={`3. LANDING RESOLUTION: SPACE #${currentPos} — ${currentSpace.name.toUpperCase()}`}
        headerBg="navy"
        headerRight={
          <span className="font-mono text-[10px] text-[#FFCC00]">
            TYPE: {currentSpace.type}
          </span>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs text-[#CBD5E1] bg-[#162544] p-2.5 border border-[#1E294B]">
            ℹ {currentSpace.description}
          </p>

          {/* Resolution Options by Space Type */}
          <div className="flex flex-col gap-3">
            {/* 1. START SPACE or Passed START */}
            {(currentSpace.type === 'START' || matchState.pendingResolution?.passedStart) && (
              <div className="bg-[#102040] border-2 border-[#22C55E] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000]">
                <div>
                  <span className="font-pixel text-xs text-[#22C55E] block font-bold">
                    ★ START LAP REWARD
                  </span>
                  <span className="font-mono text-xs text-[#CBD5E1]">
                    +₹200 Cash. Portfolio bonus: {activeTeam.businesses.length >= 3 ? '+500 CV (3 businesses held)' : activeTeam.businesses.length === 2 ? '+200 CV (2 businesses held)' : '0 CV (< 2 businesses)'}.
                  </span>
                </div>
                <PixelButton
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || disabled}
                  onClick={handleCollectStart}
                >
                  COLLECT START REWARD
                </PixelButton>
              </div>
            )}

            {/* 2. UNOWNED BUSINESS */}
            {isBusinessSpace && !businessOwner && (
              <div className="bg-[#102040] border-2 border-[#FFCC00] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000]">
                <div>
                  <span className="font-pixel text-xs text-[#FFCC00] block font-bold">
                    UNOWNED BUSINESS: {currentSpace.name}
                  </span>
                  <span className="font-mono text-xs text-[#CBD5E1]">
                    Cost: ₹{catalogCurrentBiz?.cost || 200} | Initial CV: +{catalogCurrentBiz?.initial_cv || 150} | Holdings: {activeTeam.businesses.length}/3
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PixelButton
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting || disabled || activeTeam.businesses.length >= 3}
                    onClick={() => handleBuyBusiness(currentSpace)}
                  >
                    BUY BUSINESS
                  </PixelButton>
                  <PixelButton
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting || disabled}
                    onClick={() => handleDeclinePurchase(currentSpace)}
                  >
                    DECLINE
                  </PixelButton>
                </div>
              </div>
            )}

            {/* 3. OWNED BUSINESS BY OTHER TEAM (Rent Payment) */}
            {isBusinessSpace && isOwnedByOtherTeam && businessOwner && (
              <div className="bg-[#102040] border-2 border-[#EF4444] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000]">
                <div>
                  <span className="font-pixel text-xs text-[#EF4444] block font-bold">
                    OWNED BY {businessOwner.name.toUpperCase()} (SLOT #{businessOwner.slot})
                  </span>
                  <span className="font-mono text-xs text-[#CBD5E1]">
                    Rent rate: {catalogCurrentBiz ? rentFor(catalogCurrentBiz, (businessOwner.businesses.find(b => b.business_key === currentSpace.businessKey)?.level ?? 0) as Level) : 100} cash. Owner earns rent + landing CV.
                  </span>
                </div>
                <PixelButton
                  variant="danger"
                  size="sm"
                  disabled={isSubmitting || disabled}
                  onClick={() => handlePayRent(currentSpace)}
                >
                  RECORD RENT PAYMENT
                </PixelButton>
              </div>
            )}

            {/* 4. OWNED BUSINESS BY CURRENT TEAM (Self-Upgrade) */}
            {isBusinessSpace && isOwnedByCurrentTeam && (
              <div className="bg-[#102040] border-2 border-[#38BDF8] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000]">
                <div>
                  <span className="font-pixel text-xs text-[#38BDF8] block font-bold">
                    OWNED BY {activeTeam.name.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs text-[#CBD5E1]">
                    Current Level: {currentBizLevel} of 2.
                    {canUpgradeCurrentBiz && ` Upgrade to Level ${currentBizLevel + 1}: Cost ₹${upgradeCostAmount} (+${upgradeCvGainAmount} CV).`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {canUpgradeCurrentBiz && (
                    <PixelButton
                      variant="primary"
                      size="sm"
                      disabled={isSubmitting || disabled}
                      onClick={() => handleUpgradeOnLanding(currentSpace)}
                    >
                      UPGRADE (₹{upgradeCostAmount})
                    </PixelButton>
                  )}
                  <PixelButton
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting || disabled}
                    onClick={markLandingComplete}
                  >
                    COMPLETE LANDING
                  </PixelButton>
                </div>
              </div>
            )}

            {/* 5. BONUS CARD SPACE */}
            {currentSpace.type === 'BONUS' && (
              <div className="bg-[#102040] border-2 border-[#22C55E] p-3 flex flex-col gap-3 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xs text-[#22C55E] font-bold">
                    DRAW BONUS CARD (DICE ROLL DETERMINES CARD: #{selectedBonusCardId})
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">
                    Roll #{matchState.currentRoll || 1}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {REAL_BONUS_CARDS.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedBonusCardId(card.id)}
                      className={`
                        text-left p-2 border-2 transition-all cursor-pointer flex flex-col gap-1
                        ${
                          selectedBonusCardId === card.id
                            ? 'bg-[#1E3A8A] border-[#38BDF8] shadow-[0_0_6px_#38BDF8]'
                            : 'bg-[#162544] border-[#1E294B] hover:bg-[#1E294B]'
                        }
                      `}
                    >
                      <span className="font-pixel text-[10px] text-[#FFCC00]">
                        #{card.id} {card.title}
                      </span>
                      <span className="font-mono text-[10px] text-white">
                        {card.effectText}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Extra Lucky Break Roll Input if Card 6 is selected */}
                {selectedBonusCardId === 6 && (
                  <div className="bg-[#131E38] p-2 border border-[#1E294B] flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[#FFCC00]">
                      Lucky Break Reward Roll (does not move token):
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setLuckyBreakRoll(num)}
                          className={`px-2 py-1 font-pixel text-xs border ${
                            luckyBreakRoll === num
                              ? 'bg-[#FFCC00] text-[#102040] border-white font-bold'
                              : 'bg-[#162544] text-white border-[#1E294B]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <PixelButton
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting || disabled}
                    onClick={() => handleApplyBonusCard(selectedBonusCardId)}
                  >
                    APPLY SELECTED BONUS CARD
                  </PixelButton>
                </div>
              </div>
            )}

            {/* 6. CRISIS CARD SPACE */}
            {currentSpace.type === 'CRISIS' && (
              <div className="bg-[#102040] border-2 border-[#EF4444] p-3 flex flex-col gap-3 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xs text-[#EF4444] font-bold">
                    DRAW CRISIS CARD (DICE ROLL DETERMINES CARD: #{selectedCrisisCardId})
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">
                    Roll #{matchState.currentRoll || 1}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {REAL_CRISIS_CARDS.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedCrisisCardId(card.id)}
                      className={`
                        text-left p-2 border-2 transition-all cursor-pointer flex flex-col gap-1
                        ${
                          selectedCrisisCardId === card.id
                            ? 'bg-[#7F1D1D] border-[#EF4444] shadow-[0_0_6px_#EF4444]'
                            : 'bg-[#162544] border-[#1E294B] hover:bg-[#1E294B]'
                        }
                      `}
                    >
                      <span className="font-pixel text-[10px] text-[#FFCC00]">
                        #{card.id} {card.title}
                      </span>
                      <span className="font-mono text-[10px] text-white">
                        {card.effectText}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end pt-1">
                  <PixelButton
                    variant="danger"
                    size="sm"
                    disabled={isSubmitting || disabled}
                    onClick={() => handleApplyCrisisCard(selectedCrisisCardId)}
                  >
                    APPLY SELECTED CRISIS CARD
                  </PixelButton>
                </div>
              </div>
            )}

            {/* 7. ACTION B: PITCH TO INVESTORS */}
            {currentSpace.type === 'ACTION_B' && (
              <div className="bg-[#102040] border-2 border-[#FFCC00] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000]">
                <div>
                  <span className="font-pixel text-xs text-[#FFCC00] block font-bold">
                    ACTION B: 30-SECOND FOUNDER PITCH
                  </span>
                  <span className="font-mono text-xs text-[#CBD5E1]">
                    {activeTeam.businesses.length === 0
                      ? 'Team owns 0 businesses: Action is skipped entirely with no penalty.'
                      : `Team must pitch one of their owned businesses. Success = no penalty. Refuse/fail = skip next turn.`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeTeam.businesses.length === 0 ? (
                    <PixelButton
                      variant="primary"
                      size="sm"
                      disabled={isSubmitting || disabled}
                      onClick={() => handlePitchOutcome(true)}
                    >
                      SKIP ACTION (0 BUSINESSES)
                    </PixelButton>
                  ) : (
                    <>
                      <PixelButton
                        variant="primary"
                        size="sm"
                        disabled={isSubmitting || disabled}
                        onClick={() => handlePitchOutcome(true)}
                      >
                        PITCH SUCCESSFUL (NO PENALTY)
                      </PixelButton>
                      <PixelButton
                        variant="danger"
                        size="sm"
                        disabled={isSubmitting || disabled}
                        onClick={() => handlePitchOutcome(false)}
                      >
                        PITCH FAILED (SKIP NEXT TURN)
                      </PixelButton>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 8. ACTION C: LOSE THE FEATURE */}
            {currentSpace.type === 'ACTION_C' && (
              <div className="bg-[#102040] border-2 border-[#EF4444] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000]">
                <div>
                  <span className="font-pixel text-xs text-[#EF4444] block font-bold">
                    ACTION C: LOSE THE FEATURE
                  </span>
                  <span className="font-mono text-xs text-[#CBD5E1]">
                    Tech debt penalty: apply −200 Company Value (never below zero).
                  </span>
                </div>
                <PixelButton
                  variant="danger"
                  size="sm"
                  disabled={isSubmitting || disabled}
                  onClick={handleLoseFeature}
                >
                  APPLY −200 CV
                </PixelButton>
              </div>
            )}

            {/* 9. ACTION D: STEAL TALENT */}
            {currentSpace.type === 'ACTION_D' && (
              <div className="bg-[#102040] border-2 border-[#38BDF8] p-3 flex flex-col gap-3 shadow-[2px_2px_0px_#000]">
                <span className="font-pixel text-xs text-[#38BDF8] font-bold">
                  ACTION D: STEAL TALENT (TAKE UP TO ₹100 CASH)
                </span>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-[10px] text-[#94A3B8]">TARGET:</span>
                    <select
                      value={stealTargetTeamId}
                      onChange={(e) => setStealTargetTeamId(e.target.value)}
                      className="bg-[#162544] text-white border-2 border-[#1E294B] px-3 py-1 font-mono text-xs cursor-pointer"
                    >
                      {snapshot.teams
                        .filter((t) => t.id !== activeTeam.id && !t.is_bankrupt)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            #{t.slot} {t.name} (₹{t.cash} Cash)
                          </option>
                        ))}
                    </select>
                  </div>
                  <PixelButton
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting || disabled || !stealTargetTeamId}
                    onClick={handleStealTalent}
                  >
                    TRANSFER UP TO ₹100
                  </PixelButton>
                </div>
              </div>
            )}

            {/* 10. WILDCARD */}
            {currentSpace.type === 'WILDCARD' && (
              <div className="bg-[#102040] border-2 border-[#A855F7] p-3 flex flex-col gap-3 shadow-[2px_2px_0px_#000]">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xs text-[#A855F7] font-bold">
                    WILDCARD CHIT CHALLENGE
                  </span>
                  <button
                    type="button"
                    onClick={() => setWildcardIdx((prev) => (prev + 1) % WILDCARD_CHALLENGES.length)}
                    className="font-pixel text-[9px] text-[#FFCC00] underline cursor-pointer"
                  >
                    DRAW ANOTHER CHIT ⟳
                  </button>
                </div>
                <div className="bg-[#162544] p-3 border border-[#1E294B]">
                  <span className="font-mono text-xs text-white">
                    🎯 "{WILDCARD_CHALLENGES[wildcardIdx]}"
                  </span>
                </div>
                <div className="flex justify-end pt-1">
                  <PixelButton
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting || disabled}
                    onClick={markLandingComplete}
                  >
                    CHALLENGE COMPLETED (MARK RESOLVED)
                  </PixelButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </PixelCard>
    </div>
  );
};
