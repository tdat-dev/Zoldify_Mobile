import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
  type Address,
} from '@/features/addresses/api';

function AddressCard({ item }: { item: Address }) {
  const del = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const full = [item.street, item.ward, item.district, item.province].filter(Boolean).join(', ');

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text variant="subheading">{item.recipient_name}</Text>
        <Text variant="bodyMuted" style={styles.phone}>{item.phone_number}</Text>
      </View>
      <Text variant="body" style={styles.addr}>{full}</Text>

      <View style={styles.badges}>
        {item.is_default ? (
          <View style={styles.defaultBadge}><Text style={styles.defaultText}>Mặc định</Text></View>
        ) : null}
        {item.label ? (
          <View style={styles.labelBadge}><Text style={styles.labelText}>{item.label}</Text></View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {!item.is_default ? (
          <Pressable hitSlop={6} onPress={() => setDefault.mutate(item.id)} disabled={setDefault.isPending}>
            <Text style={styles.actionLink}>Đặt mặc định</Text>
          </Pressable>
        ) : <View />}
        <View style={styles.actionRight}>
          <Pressable
            hitSlop={6}
            onPress={() => router.push({ pathname: '/addresses/[id]', params: { id: item.id } })}>
            <Text style={styles.actionLink}>Sửa</Text>
          </Pressable>
          <Pressable hitSlop={6} onPress={() => del.mutate(item.id)} disabled={del.isPending}>
            <Text style={styles.actionDanger}>Xoá</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** Sổ địa chỉ giao hàng — như "Địa chỉ của tôi" của Shopee. */
export default function AddressListScreen() {
  const insets = useSafeAreaInsets();
  const { data: list, isPending, isError, refetch } = useAddresses();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron onPress={back} />
        <Text variant="title">Địa chỉ của tôi</Text>
      </View>

      {isPending ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Palette.brand} /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Text variant="heading">Không tải được địa chỉ</Text>
          <View style={styles.cta}><Button title="Thử lại" onPress={() => refetch()} /></View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {(list ?? []).length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={44} color={Palette.inkFaint} />
              <Text variant="heading" style={styles.line}>Chưa có địa chỉ nào</Text>
              <Text variant="bodyMuted" style={styles.line}>
                Thêm địa chỉ để thanh toán nhanh hơn ở lần mua sau.
              </Text>
            </View>
          ) : (
            (list ?? []).map((a) => <AddressCard key={a.id} item={a} />)
          )}
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button title="Thêm địa chỉ mới" onPress={() => router.push('/addresses/new')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  cta: { alignSelf: 'stretch', paddingHorizontal: 24 },
  body: { padding: 12, gap: 12 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 64 },
  line: { textAlign: 'center' },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 14,
    gap: 8,
  },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  phone: {},
  addr: { color: Palette.ink },
  badges: { flexDirection: 'row', gap: 8 },
  defaultBadge: {
    borderRadius: Radius.control,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Palette.brandTint,
    borderWidth: 1,
    borderColor: Palette.brand,
  },
  defaultText: { fontFamily: Font.semibold, fontSize: 11.5, color: Palette.brand },
  labelBadge: {
    borderRadius: Radius.control,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Palette.surfaceSunken,
  },
  labelText: { fontFamily: Font.medium, fontSize: 11.5, color: Palette.inkMuted },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    paddingTop: 10,
    marginTop: 2,
  },
  actionRight: { flexDirection: 'row', gap: 18 },
  actionLink: { fontFamily: Font.semibold, fontSize: 13, color: Palette.brand },
  actionDanger: { fontFamily: Font.semibold, fontSize: 13, color: Palette.dangerFg },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
});
