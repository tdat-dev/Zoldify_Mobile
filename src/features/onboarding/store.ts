import { create } from 'zustand';

/**
 * Bản nháp trong lúc đăng ký nhiều bước (email → tên/mật khẩu → OTP → passkey).
 * Giữ tạm trong RAM để các màn không phải truyền params lằng nhằng; gọi
 * reset() khi xong hoặc rời luồng. Không lưu xuống đĩa — mật khẩu chỉ ở đây
 * đến khi đăng nhập xong.
 */
interface Draft {
  email: string;
  fullName: string;
  password: string;
}

interface OnboardingState extends Draft {
  setDraft: (patch: Partial<Draft>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  email: '',
  fullName: '',
  password: '',
  setDraft: (patch) => set(patch),
  reset: () => set({ email: '', fullName: '', password: '' }),
}));
