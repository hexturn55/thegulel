'use client';

import { useEffect, useState } from 'react';
import CoinWallet from '@/components/CoinWallet';

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionType = 'PURCHASE' | 'AD_REWARD' | 'EPISODE_UNLOCK' | 'SUBSCRIPTION' | 'BONUS';

interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  createdAt: string;
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const TX_BADGE: Record<TransactionType, { label: string; className: string }> = {
  PURCHASE:       { label: 'Purchase',   className: 'bg-green-500/20 text-green-400 border border-green-500/30'   },
  AD_REWARD:      { label: 'Ad Reward',  className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'     },
  EPISODE_UNLOCK: { label: 'Unlock',     className: 'bg-red-500/20 text-red-400 border border-red-500/30'        },
  SUBSCRIPTION:   { label: 'Sub',        className: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
  BONUS:          { label: 'Bonus',      className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Transaction History Component ────────────────────────────────────────────

function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    fetchTransactions(1, true);
  }, []);

  const fetchTransactions = async (pageNum: number, replace = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/transactions?page=${pageNum}&limit=${LIMIT}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions((prev) => replace ? data.transactions : [...prev, ...data.transactions]);
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-3 px-4 mt-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8 text-sm">No transactions yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const badge = TX_BADGE[tx.type] ?? TX_BADGE.BONUS;
        const isCredit = tx.amount > 0;

        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 rounded-xl px-4 py-3 transition"
          >
            {/* Date */}
            <div className="text-gray-500 text-xs w-16 flex-shrink-0 text-center leading-tight">
              {formatDate(tx.createdAt)}
            </div>

            {/* Badge */}
            <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium flex-shrink-0 ${badge.className}`}>
              {badge.label}
            </span>

            {/* Description */}
            <p className="flex-1 text-gray-400 text-xs truncate">
              {tx.description ?? badge.label}
            </p>

            {/* Amount */}
            <span className={`font-bold text-sm flex-shrink-0 ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
              {isCredit ? '+' : ''}{tx.amount}
            </span>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={() => fetchTransactions(page + 1)}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition disabled:opacity-50 mt-2"
        >
          {isLoading ? 'Loading…' : 'Load More'}
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Coin packages via existing component */}
      <CoinWallet />

      {/* Transaction history section */}
      <div className="px-4 pt-2 pb-6">
        <h2 className="text-white text-xl font-bold mb-4">Transaction History</h2>
        <TransactionHistory />
      </div>
    </div>
  );
}
