'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  KeyRound,
  Trash2,
  Edit3,
  Mail,
  Calendar,
  Sparkles,
  Crown,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  X,
  Coins,
  Flame,
  Trophy,
  Star,
  ShieldAlert,
  Save,
  Globe,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { InventoryItem } from '@/lib/supabase';
import {
  getRankTitle,
  formatUsername,
  COUNTRIES,
  getCountry,
} from '@/lib/rpg';
import { soundManager } from '@/lib/audio';

type ProfilePageProps = {
  inventory?: InventoryItem[];
  showToast: (message: string, type: 'success' | 'error') => void;
};

export default function ProfilePage({ inventory = [], showToast }: ProfilePageProps) {
  const { user, profile, isDemo, updatePassword, sendPasswordResetEmail, updateProfileBio, deleteAccount } =
    useAuth();

  const cleanUsername = formatUsername(profile?.username);

  // Bio & Profile Settings State
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [usernameInput, setUsernameInput] = useState(cleanUsername);
  const [bioInput, setBioInput] = useState(profile?.bio || '');
  const [countryInput, setCountryInput] = useState(profile?.country || 'US');
  const [isPublicInput, setIsPublicInput] = useState(profile?.is_public !== false);
  const [savingBio, setSavingBio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  if (!profile) return null;

  const isDemoMode = isDemo || user?.id === 'demo-hero';
  const rankTitle = getRankTitle(profile.level);
  const userCountry = getCountry(profile.country);

  async function handleTogglePrivacy(isPublic: boolean) {
    soundManager.playClick();
    const res = await updateProfileBio({ is_public: isPublic });
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(`Profile set to ${isPublic ? 'Public' : 'Private'}!`, 'success');
    }
  }

  // Equipped items
  const equippedItems = inventory.filter((i) => i.equipped && i.shop_items);
  const equippedFrame = equippedItems.find((i) => i.shop_items?.type === 'avatar_frame');
  const equippedTitle = equippedItems.find((i) => i.shop_items?.type === 'title');
  const equippedBadge = equippedItems.find((i) => i.shop_items?.type === 'badge');

  const frameBorderClass = equippedFrame?.shop_items?.name.includes('Golden')
    ? 'ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.4)]'
    : equippedFrame?.shop_items?.name.includes('Mythic')
    ? 'ring-4 ring-violet2-400 shadow-[0_0_25px_rgba(167,139,250,0.4)]'
    : equippedFrame?.shop_items?.name.includes('Iron')
    ? 'ring-4 ring-ink-500'
    : 'border-2 border-white/20';

  // Format Join Date
  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently Joined';

  const shareableUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${cleanUsername}` : `/p/${cleanUsername}`;

  function handleCopyShareLink() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      soundManager.playClick();
      showToast('Public profile URL copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    }
  }

  // Handle Save Bio & Settings
  async function handleSaveBio(e: React.FormEvent) {
    e.preventDefault();
    if (!usernameInput.trim()) {
      showToast('Username cannot be empty.', 'error');
      return;
    }

    setSavingBio(true);
    soundManager.playClick();
    const res = await updateProfileBio({
      username: usernameInput.trim(),
      bio: bioInput.trim(),
      country: countryInput,
      is_public: isPublicInput,
    });
    setSavingBio(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Profile bio updated successfully!', 'success');
      setIsEditingBio(false);
    }
  }

  // Handle Password Reset / Update
  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setUpdatingPassword(true);
    soundManager.playClick();
    const res = await updatePassword(newPassword);
    setUpdatingPassword(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Password successfully updated!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  // Handle Send Password Reset Email
  async function handleSendResetEmail() {
    setSendingResetEmail(true);
    soundManager.playClick();
    const res = await sendPasswordResetEmail();
    setSendingResetEmail(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(`Password reset link sent to ${user?.email || 'your email'}!`, 'success');
    }
  }

  // Handle Delete Account
  async function handleDeleteAccountConfirm() {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type DELETE to confirm account deletion.', 'error');
      return;
    }

    setDeletingAccount(true);
    soundManager.playClick();
    const res = await deleteAccount();
    setDeletingAccount(false);

    if (res.error) {
      showToast(res.error, 'error');
      setShowDeleteModal(false);
    } else {
      showToast('Account data successfully deleted.', 'success');
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Header Hero Card with Bio & Adventurer Meta */}
      <div className="rpg-card p-6 sm:p-8 border border-ink-800 bg-ink-900 rounded-3xl shadow-ios-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar Badge */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-ios-md transition-all ${frameBorderClass}`}
              >
                <span className="text-3xl sm:text-4xl font-heading font-extrabold text-white select-none">
                  {cleanUsername.charAt(0).toUpperCase() || 'H'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-white dark:border-ink-950 shadow-ios-sm">
                {profile.level}
              </div>
            </div>

            {/* User Meta Data */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-ink-100">
                  {cleanUsername}
                </h1>
                {equippedBadge && (
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {equippedBadge.shop_items?.name}
                  </span>
                )}
                {isDemoMode && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    LOCAL DEMO MODE
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-amber-500 font-semibold flex items-center gap-1.5">
                <Crown className="w-4 h-4" />
                {equippedTitle?.shop_items?.name ? equippedTitle.shop_items.name : rankTitle}
              </p>

              {/* Email, Country & Join Date */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-400 pt-1">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-ink-800 border border-ink-700 text-ink-200 font-semibold">
                  <span className="text-sm">{userCountry.flag}</span>
                  <span>{userCountry.name}</span>
                </span>

                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                  profile.is_public !== false
                    ? 'bg-emerald2-500/10 text-emerald2-400 border-emerald2-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {profile.is_public !== false ? (
                    <>
                      <Globe className="w-3.5 h-3.5" /> Public Profile
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Private Profile
                    </>
                  )}
                </span>

                {user?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-ink-500" />
                    {user.email}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-ink-500" />
                  Joined {joinDate}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Bio Button */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setUsernameInput(cleanUsername);
              setBioInput(profile.bio || '');
              setCountryInput(profile.country || 'US');
              setIsPublicInput(profile.is_public !== false);
              setIsEditingBio((prev) => !prev);
            }}
            className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-2 transition-all focus-ring shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            {isEditingBio ? 'Close Bio Editor' : 'Edit Bio & Settings'}
          </button>
        </div>

        {/* Sharable Link Card */}
        <div className="mt-6 p-4 rounded-2xl bg-ink-850/60 border border-ink-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-ink-200 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              Sharable Profile Link
            </div>
            <p className="text-xs text-ink-400">
              {profile.is_public !== false
                ? 'Anyone with this link can view your public hero stats and badges.'
                : 'Your profile is currently Private. Switch to Public in settings to enable sharing.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              className="px-3 py-1.5 rounded-xl bg-ink-950 border border-ink-750 text-ink-300 text-xs font-mono w-48 sm:w-60 truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-ink-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition-all shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Bio Display Description */}
        {!isEditingBio && (
          <div className="mt-4 pt-4 border-t border-ink-800/80">
            <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1">Adventurer Bio</h3>
            <p className="text-sm text-ink-200 leading-relaxed italic bg-ink-850/40 p-3.5 rounded-2xl border border-ink-800/60">
              &quot;{profile.bio || 'No adventurer bio written yet. Click Edit Bio & Settings above to set your motto!'}&quot;
            </p>
          </div>
        )}

        {/* Edit Bio Form Drawer */}
        <AnimatePresence>
          {isEditingBio && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveBio}
              className="mt-6 pt-5 border-t border-ink-800/80 space-y-4"
            >
              <h3 className="text-sm font-bold text-ink-200 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" /> Edit Profile & Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-300 mb-1">Hero Display Name</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Hero Name"
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-850 border border-ink-750 text-ink-100 text-sm focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-300 mb-1">Country / Realm Origin</label>
                  <select
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-850 border border-ink-750 text-ink-100 text-sm focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Public vs Private Privacy Toggle */}
              <div className="p-4 rounded-2xl bg-ink-850 border border-ink-750 space-y-2">
                <label className="block text-xs font-bold text-ink-200 uppercase tracking-wider">
                  Profile Privacy Visibility
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublicInput(true)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isPublicInput
                        ? 'border-emerald2-500/60 bg-emerald2-500/15 text-emerald2-300'
                        : 'border-ink-750 bg-ink-900 text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    🌐 Public Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublicInput(false)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      !isPublicInput
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                        : 'border-ink-750 bg-ink-900 text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    🔒 Private Profile
                  </button>
                </div>
                <p className="text-[11px] text-ink-400 italic">
                  {isPublicInput
                    ? 'Public: Anyone with your sharable link can view your hero profile and stats.'
                    : 'Private: Your profile link will show a private notice to other users.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">
                  Adventurer Bio / Motto (Max 200 characters)
                </label>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Share your epic story, life goals, or hero motto..."
                  className="w-full px-3.5 py-2 rounded-xl bg-ink-850 border border-ink-750 text-ink-100 text-sm focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingBio(false)}
                  className="px-4 py-2 rounded-xl border border-ink-750 bg-ink-800 text-ink-300 hover:text-ink-100 text-xs font-bold transition-all focus-ring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBio}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-ink-950 font-bold text-xs hover:from-amber-400 hover:to-amber-500 transition-all focus-ring shadow-ios-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingBio ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Quick Adventurer Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rpg-card p-4 border border-ink-800 bg-ink-900 rounded-2xl text-center shadow-ios-sm">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-400 mb-1">
            <Coins className="w-4 h-4 text-amber-500" /> Current Gold
          </div>
          <p className="text-xl font-extrabold text-amber-500 tabular-nums">{profile.gold}</p>
        </div>

        <div className="rpg-card p-4 border border-ink-800 bg-ink-900 rounded-2xl text-center shadow-ios-sm">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-400 mb-1">
            <Flame className="w-4 h-4 text-flame-500" /> Current Streak
          </div>
          <p className="text-xl font-extrabold text-flame-500 tabular-nums">{profile.streak} Days</p>
        </div>

        <div className="rpg-card p-4 border border-ink-800 bg-ink-900 rounded-2xl text-center shadow-ios-sm">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-400 mb-1">
            <Trophy className="w-4 h-4 text-azure-500" /> Best Streak
          </div>
          <p className="text-xl font-extrabold text-azure-500 tabular-nums">{profile.longest_streak} Days</p>
        </div>

        <div className="rpg-card p-4 border border-ink-800 bg-ink-900 rounded-2xl text-center shadow-ios-sm">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-400 mb-1">
            <Star className="w-4 h-4 text-amber-400" /> Total XP
          </div>
          <p className="text-xl font-extrabold text-amber-400 tabular-nums">{profile.total_xp.toLocaleString()}</p>
        </div>
      </div>

      {/* Profile Privacy & Public Visibility Settings Card */}
      <div className="rpg-card p-6 sm:p-7 border border-amber-500/30 bg-ink-900 rounded-3xl shadow-ios-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              {profile.is_public !== false ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink-100 flex items-center gap-2">
                Profile Visibility & Privacy Mode
              </h2>
              <p className="text-xs text-ink-400">
                Choose whether your adventurer profile and stats are public or private
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-ink-950 p-1.5 rounded-2xl border border-ink-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleTogglePrivacy(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                profile.is_public !== false
                  ? 'bg-emerald2-500/20 text-emerald2-300 border border-emerald2-500/40 shadow-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Public Mode
            </button>
            <button
              type="button"
              onClick={() => handleTogglePrivacy(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                profile.is_public === false
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Private Mode
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-950/70 border border-ink-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-ink-200 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${profile.is_public !== false ? 'bg-emerald2-400 animate-pulse' : 'bg-amber-400'}`} />
              Status: {profile.is_public !== false ? 'Public Adventurer Profile' : 'Private Hero Profile'}
            </div>
            <p className="text-xs text-ink-400">
              {profile.is_public !== false
                ? 'Your hero profile is visible to other adventurers via your custom link and on leaderboards.'
                : 'Your profile details are hidden from public view. Other users visiting your link will see a private notice.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Reset Password & Security Section */}
      <div className="rpg-card p-6 sm:p-8 border border-ink-800 bg-ink-900 rounded-3xl shadow-ios-md space-y-6">
        <div className="flex items-center justify-between border-b border-ink-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink-100">Security & Password</h2>
              <p className="text-xs text-ink-400">Update your password or request a reset email</p>
            </div>
          </div>
          <KeyRound className="w-5 h-5 text-ink-500" />
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-ink-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100 text-sm focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
                <Lock className="w-4 h-4 text-ink-500 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-ink-400 hover:text-ink-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-ink-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-ink-850 border border-ink-750 text-ink-100 text-sm focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
                <Lock className="w-4 h-4 text-ink-500 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-ink-400 hover:text-ink-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleSendResetEmail}
              disabled={sendingResetEmail}
              className="px-4 py-2 rounded-xl border border-ink-750 bg-ink-850 text-ink-300 hover:text-ink-100 text-xs font-bold transition-all focus-ring flex items-center justify-center gap-2"
            >
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              {sendingResetEmail ? 'Sending...' : 'Send Password Reset Email'}
            </button>

            <button
              type="submit"
              disabled={updatingPassword || !newPassword}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-ink-950 font-bold text-xs hover:bg-amber-400 transition-all focus-ring shadow-ios-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Delete Account Danger Zone */}
      <div className="rpg-card p-6 sm:p-8 border border-flame-500/30 bg-flame-500/5 rounded-3xl shadow-ios-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-flame-500/15 border border-flame-500/40 flex items-center justify-center text-flame-500 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-flame-400">Danger Zone: Account Deletion</h2>
            <p className="text-xs text-ink-400">Permanently erase your character, stats, items, and quest history</p>
          </div>
        </div>

        <p className="text-xs text-ink-300 leading-relaxed">
          Once deleted, your hero profile cannot be recovered. All accumulated gold, level progress, unlocked shop equipment, and quest logs will be permanently deleted.
        </p>

        <div className="pt-2 flex justify-start">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setDeleteConfirmText('');
              setShowDeleteModal(true);
            }}
            className="px-4 py-2.5 rounded-xl border border-flame-500/50 bg-flame-500/20 text-flame-400 hover:bg-flame-500/30 text-xs font-bold flex items-center gap-2 transition-all focus-ring shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Hero Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-ink-900 border border-flame-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-flame-500 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Confirm Account Deletion</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 rounded-lg text-ink-400 hover:text-ink-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-ink-300">
                This action is irreversible. To confirm deletion, type <strong className="text-flame-400">DELETE</strong> in the box below:
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="w-full px-3.5 py-2 rounded-xl bg-ink-950 border border-flame-500/40 text-flame-300 text-sm focus:outline-none focus:ring-1 focus:ring-flame-500"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl border border-ink-750 bg-ink-800 text-ink-300 hover:text-ink-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                  onClick={handleDeleteAccountConfirm}
                  className="px-4 py-2 rounded-xl bg-flame-600 hover:bg-flame-500 text-white font-bold text-xs transition-all disabled:opacity-40 shadow-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingAccount ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
