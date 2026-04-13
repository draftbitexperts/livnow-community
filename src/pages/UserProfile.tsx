import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type ChangeEvent,
} from 'react';
import { UserCircle, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BottomToast, type BottomToastPayload } from '@/components/BottomToast';

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

const formLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
};

const formInputStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  height: 48,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  padding: 16,
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
};

const sectionHeaderStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 20,
  lineHeight: '24px',
  letterSpacing: '0%',
  color: '#323234',
};

const primaryButtonStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 16,
  lineHeight: '22px',
  letterSpacing: '0%',
  color: '#FFFFFF',
  backgroundColor: '#307584',
  borderRadius: 9999,
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 24,
  paddingRight: 24,
  minHeight: 48,
};

const secondaryOutlineButtonStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 16,
  lineHeight: '22px',
  color: '#307584',
  backgroundColor: '#EAF1F3',
  border: '1px solid #83ACB5',
  borderRadius: 9999,
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 24,
  paddingRight: 24,
  minHeight: 48,
};

export default function UserProfile() {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<BottomToastPayload | null>(null);

  const [passwordConfirmOpen, setPasswordConfirmOpen] = useState(false);
  const [passwordFieldsVisible, setPasswordFieldsVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loadFromUser = useCallback(() => {
    if (!user) return;
    setFullName(user.name?.trim() || '');
    setEmail(user.email?.trim() || '');
    setAvatarPreview(user.avatarDataUrl?.trim() || null);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadFromUser();
  }, [user, authLoading, loadFromUser]);

  const showToast = (payload: BottomToastPayload) => setToast(payload);

  const handleSaveProfile = () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      updateProfile({ name: fullName.trim() });
      showToast({ message: 'Profile updated.', variant: 'success' });
    } catch (e) {
      showToast({
        message: e instanceof Error ? e.message : 'Could not update profile.',
        variant: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (file.size > MAX_AVATAR_BYTES) {
      showToast({ message: 'File must be 4 MB or smaller.', variant: 'error' });
      return;
    }
    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      setUploadingAvatar(false);
      if (!dataUrl) {
        showToast({ message: 'Could not read image.', variant: 'error' });
        return;
      }
      try {
        updateProfile({ avatarDataUrl: dataUrl });
        setAvatarPreview(dataUrl);
        showToast({ message: 'Profile photo updated.', variant: 'success' });
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : 'Upload failed.',
          variant: 'error',
        });
      }
    };
    reader.onerror = () => {
      setUploadingAvatar(false);
      showToast({ message: 'Could not read image.', variant: 'error' });
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    setSavingPassword(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      showToast({
        message: 'Password change is not available until authentication is connected to the server.',
        variant: 'error',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full min-w-0">
      <div
        className="flex flex-col gap-6 md:gap-8 rounded-2xl border border-gray-100 bg-white p-4 md:p-8 shadow-sm"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex flex-col items-center lg:items-start shrink-0 w-full lg:w-[240px]">
            <h3 className="font-source-sans-3 mb-3 self-start w-full" style={sectionHeaderStyle}>
              Profile picture
            </h3>
            <div
              className="relative flex items-center justify-center rounded-2xl overflow-hidden bg-[#EAF1F3] border border-gray-200/80"
              style={{ width: 'min(100%, 220px)', aspectRatio: '1' }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="text-[#83ACB5]" size={96} strokeWidth={1.25} aria-hidden />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarFile}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar || authLoading}
              className="mt-4 w-full max-w-[220px] font-source-sans-3 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={secondaryOutlineButtonStyle}
            >
              {uploadingAvatar ? 'Uploading…' : 'Upload'}
            </button>
            <p className="mt-2 text-xs text-gray-500 font-source-sans-3 text-center lg:text-left">
              Max file size: 4 MB
            </p>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-8">
            <section>
              <h3 className="font-source-sans-3 mb-4" style={sectionHeaderStyle}>
                My Information
              </h3>
              {authLoading && (
                <p className="mb-4 text-sm text-gray-500 font-source-sans-3" role="status">
                  Loading profile…
                </p>
              )}
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={authLoading}
                    className="outline-none focus:ring-2 focus:ring-[#307584]/40 disabled:opacity-60"
                    style={formInputStyle}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="outline-none bg-gray-50 cursor-not-allowed disabled:opacity-80"
                    style={formInputStyle}
                    autoComplete="email"
                  />
                  <p className="mt-1 text-sm text-gray-500 font-source-sans-3">
                    Email cannot be changed.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end max-w-xl">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile || authLoading}
                  className="font-source-sans-3 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={primaryButtonStyle}
                >
                  {savingProfile ? 'Saving…' : 'Update Profile'}
                </button>
              </div>
            </section>

            <section className="border-t border-gray-100 pt-8">
              <h3 className="font-source-sans-3 mb-4" style={sectionHeaderStyle}>
                Change Password
              </h3>
              {!passwordFieldsVisible ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPasswordConfirmOpen(true)}
                    className="font-source-sans-3 transition-opacity hover:opacity-90"
                    style={secondaryOutlineButtonStyle}
                  >
                    Change password
                  </button>
                  <p className="mt-2 text-sm text-gray-500 font-source-sans-3">
                    You’ll confirm before entering your current and new passwords.
                  </p>
                </>
              ) : (
                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Old Password
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="outline-none focus:ring-2 focus:ring-[#307584]/40"
                      style={formInputStyle}
                      autoComplete="current-password"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="outline-none focus:ring-2 focus:ring-[#307584]/40"
                      style={formInputStyle}
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="outline-none focus:ring-2 focus:ring-[#307584]/40"
                      style={formInputStyle}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordFieldsVisible(false);
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="font-source-sans-3 transition-opacity hover:opacity-90"
                      style={{
                        ...secondaryOutlineButtonStyle,
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (newPassword !== confirmPassword) {
                          showToast({
                            message: 'New password and confirmation do not match.',
                            variant: 'error',
                          });
                          return;
                        }
                        if (newPassword.length < 8) {
                          showToast({
                            message: 'New password must be at least 8 characters.',
                            variant: 'error',
                          });
                          return;
                        }
                        void handleChangePassword();
                      }}
                      disabled={savingPassword}
                      className="font-source-sans-3 transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={primaryButtonStyle}
                    >
                      {savingPassword ? 'Saving…' : 'Change Password'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {passwordConfirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPasswordConfirmOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwd-confirm-title"
            className="relative z-[90] w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-xl p-6"
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <h2
                id="pwd-confirm-title"
                className="font-source-sans-3 text-lg font-semibold text-[#323234] pr-6"
              >
                Change password?
              </h2>
              <button
                type="button"
                onClick={() => setPasswordConfirmOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 shrink-0"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 font-source-sans-3 mb-6">
              You’ll need your current password. Continue to enter your old and new passwords?
            </p>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPasswordConfirmOpen(false)}
                className="font-source-sans-3 transition-opacity hover:opacity-90"
                style={{
                  ...secondaryOutlineButtonStyle,
                  backgroundColor: '#FFFFFF',
                }}
              >
                No, cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordConfirmOpen(false);
                  setPasswordFieldsVisible(true);
                }}
                className="font-source-sans-3 transition-opacity hover:opacity-90"
                style={primaryButtonStyle}
              >
                Yes, continue
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <BottomToast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
