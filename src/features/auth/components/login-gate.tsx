import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Palette } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import { loginPromptFor } from '@/features/auth/guest-access';
import { TabPlaceholder } from '@/features/shared/tab-placeholder';

/**
 * Cổng đăng nhập cho route cần tài khoản, gắn một lần ở `screenLayout` của
 * navigator nên mọi đường vào (deep link, push, nút trong app) đều qua đây.
 *
 * Khách thì màn thật KHÔNG được dựng: query của nó không chạy, nên không còn
 * cảnh link zoldify://orders/1 hay zoldify://sales quay vòng mãi. Phiên hết
 * giữa chừng thì màn đang mở cũng đổi thành lời mời này.
 */
function LoginGate({
  routeName,
  inTabs,
  children,
}: {
  routeName: string;
  inTabs?: boolean;
  children: ReactElement;
}) {
  const status = useAuthStore((s) => s.status);
  const prompt = loginPromptFor(routeName);

  if (!prompt || status === 'signedIn') return children;
  // Chưa biết là ai: splash còn che màn, đợi đọc xong phiên chứ không mời nhầm.
  if (status === 'hydrating') return <View style={styles.wait} />;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <TabPlaceholder title={prompt.title} note={prompt.note} onBack={inTabs ? undefined : back} />;
}

interface LayoutArgs {
  route: { name: string };
  children: ReactElement;
}

/** `screenLayout` cho Stack: màn đẩy chồng, có nút quay lại. */
export function stackLoginGate({ route, children }: LayoutArgs) {
  return <LoginGate routeName={route.name}>{children}</LoginGate>;
}

/** `screenLayout` cho Tabs: tab không có nút quay lại. */
export function tabLoginGate({ route, children }: LayoutArgs) {
  return (
    <LoginGate routeName={route.name} inTabs>
      {children}
    </LoginGate>
  );
}

const styles = StyleSheet.create({
  wait: { flex: 1, backgroundColor: Palette.surfacePage },
});
