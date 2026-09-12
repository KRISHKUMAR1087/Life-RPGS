'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Check,
  Lock,
  Loader2,
  ShoppingBag,
  Package,
  Star,
  Shield,
  Crown,
  BookOpen,
  Sword,
  Trees,
  Sparkles,
  Flame,
  Moon,
  Gem,
  Trophy,
  Skull,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import type { ShopItem, InventoryItem, Profile } from '@/lib/supabase';
import { RARITY_STYLES } from '@/lib/rpg';

type ShopProps = {
  shopItems: ShopItem[];
  inventory: InventoryItem[];
  profile: Profile;
  onBuy: (item: ShopItem) => Promise<void>;
  loading: boolean;
};

const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  Crown,
  Trees,
  Sparkles,
  BookOpen,
  Sword,
  Star,
  Flame,
  Gem,
  Moon,
  Trophy,
  Skull,
  Circle,
};

export default function Shop({ shopItems, inventory, profile, onBuy, loading }: ShopProps) {
  const [tab, setTab] = useState<'shop' | 'inventory'>('shop');
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const ownedIds = new Set(inventory.map((inv) => inv.item_id));

  async function handleBuy(item: ShopItem) {
    setBuyingId(item.id);
    try {
      await onBuy(item);
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div className="rpg-card p-5 sm:p-6 shadow-ios-md">
      {/* Header with gold balance */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-ios-sm">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-ink-200">Merchant</h2>
            <p className="text-xs text-ink-400 font-medium">Spend your hard-earned gold</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3 py-1.5 shadow-ios-sm">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-extrabold text-amber-500 tabular-nums">{profile.gold}</span>
        </div>
      </div>

      {/* iOS Segmented Control Tab Switcher */}
      <div className="flex p-1 bg-ink-850 rounded-2xl mb-5 border border-ink-800">
        <button
          type="button"
          onClick={() => setTab('shop')}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            tab === 'shop'
              ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-ios-sm'
              : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          Shop ({shopItems.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('inventory')}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            tab === 'inventory'
              ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-ios-sm'
              : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          Inventory ({inventory.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'shop' ? (
          <motion.div
            key="shop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="loading-skeleton h-36 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {shopItems.map((item) => {
                  const Icon = ICON_MAP[item.icon] ?? Circle;
                  const rarity = RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common;
                  const owned = ownedIds.has(item.id);
                  const canAfford = profile.gold >= item.price;
                  const isBuying = buyingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-ink-800 bg-ink-850 p-3.5 flex flex-col transition-all hover:scale-[1.02] shadow-ios-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-ink-900 border border-ink-800 flex items-center justify-center">
                          <Icon className={`w-5 h-5 ${rarity.color}`} />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-extrabold ${rarity.color}`}>
                          {item.rarity}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-ink-200 mb-0.5 truncate">{item.name}</h4>
                      <p className="text-[11px] text-ink-400 mb-3 flex-1 line-clamp-2 font-normal">{item.description}</p>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-extrabold text-amber-500">
                          <Coins className="w-3.5 h-3.5" />
                          {item.price}
                        </span>

                        {owned ? (
                          <span className="flex items-center gap-1 text-xs text-ios-green font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            Owned
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuy(item)}
                            disabled={!canAfford || isBuying}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl font-semibold transition-all ${
                              canAfford
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                                : 'bg-ink-900 border border-ink-800 text-ink-500 cursor-not-allowed'
                            }`}
                            aria-label={`Buy ${item.name} for ${item.price} gold`}
                          >
                            {isBuying ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : canAfford ? (
                              'Buy'
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                {item.price}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="inventory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {inventory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-ink-850 border border-ink-800 flex items-center justify-center mx-auto mb-3 shadow-ios-sm">
                  <Package className="w-7 h-7 text-ink-400" />
                </div>
                <p className="text-sm font-semibold text-ink-300">Your inventory is empty.</p>
                <p className="text-xs text-ink-500 mt-1 font-medium">Complete quests to earn gold, then buy items here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {inventory.map((inv) => {
                  const item = inv.shop_items;
                  if (!item) return null;
                  const Icon = ICON_MAP[item.icon] ?? Circle;
                  const rarity = RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common;
                  return (
                    <div
                      key={inv.id}
                      className="rounded-2xl border border-ink-800 bg-ink-850 p-3.5 shadow-ios-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-ink-900 border border-ink-800 flex items-center justify-center">
                          <Icon className={`w-5 h-5 ${rarity.color}`} />
                        </div>
                        {inv.equipped && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-ios-green">
                            Equipped
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-ink-200">{item.name}</h4>
                      <p className="text-[11px] text-ink-400 mt-0.5">{item.description}</p>
                      <p className={`text-[10px] uppercase tracking-wider font-extrabold ${rarity.color} mt-2`}>
                        {item.rarity}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
