import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { Font, Palette, Radius } from './theme';

/**
 * Lưới thêm ảnh khi đăng bán — đồ cũ cần nhiều ảnh (ảnh là yếu tố bán số 1).
 * Ảnh đầu tiên là ẢNH BÌA (hiện ở feed); chạm một ảnh khác để đưa lên làm bìa,
 * chạm ✕ để xoá, ô "＋" để chọn thêm (chọn nhiều một lần). Giữ URI cục bộ; nơi
 * gọi tự upload từng ảnh lúc đăng (uploadImage) rồi gửi mảng `images`.
 */
const COLS = 4;
const GAP = 8;

export function PhotoUploadGrid({
  value,
  onChange,
  max = 10,
}: {
  value: string[];
  onChange: (uris: string[]) => void;
  max?: number;
}) {
  const [width, setWidth] = useState(0);
  const tile = width > 0 ? (width - GAP * (COLS - 1)) / COLS : 0;
  const canAdd = value.length < max;

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: max - value.length,
      quality: 0.8,
    });
    if (res.canceled) return;
    const picked = res.assets.map((a) => a.uri);
    onChange([...value, ...picked].slice(0, max));
  };

  const remove = (uri: string) => onChange(value.filter((u) => u !== uri));
  const makeCover = (uri: string) => onChange([uri, ...value.filter((u) => u !== uri)]);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.grid}>
        {value.map((uri, i) => (
          <View key={uri} style={{ width: tile, height: tile }}>
            <Pressable
              style={styles.thumb}
              onPress={() => (i === 0 ? undefined : makeCover(uri))}
              accessibilityLabel={i === 0 ? 'Ảnh bìa' : 'Đặt làm ảnh bìa'}>
              <Image source={uri} style={styles.thumbImg} contentFit="cover" />
              {i === 0 ? (
                <View style={styles.coverTag}>
                  <Text style={styles.coverText}>Bìa</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.remove} hitSlop={6} onPress={() => remove(uri)} accessibilityLabel="Xoá ảnh">
              <Ionicons name="close" size={13} color={Palette.white} />
            </Pressable>
          </View>
        ))}

        {canAdd && tile > 0 ? (
          <Pressable style={[styles.add, { width: tile, height: tile }]} onPress={pick} accessibilityLabel="Thêm ảnh">
            <Ionicons name="add" size={26} color={Palette.inkFaint} />
            <Text style={styles.addText}>
              {value.length}/{max}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {value.length > 0 ? (
        <Text variant="caption" style={styles.hint}>
          Ảnh đầu là ảnh bìa. Chạm ảnh khác để đổi bìa.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  thumb: {
    flex: 1,
    borderRadius: Radius.control,
    overflow: 'hidden',
    backgroundColor: Palette.surfaceSunken,
  },
  thumbImg: { width: '100%', height: '100%' },
  coverTag: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    paddingVertical: 2,
    backgroundColor: 'rgba(25,32,41,0.62)',
    alignItems: 'center',
  },
  coverText: { fontFamily: Font.semibold, fontSize: 9.5, color: Palette.white },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    borderStyle: 'dashed',
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addText: { fontFamily: Font.medium, fontSize: 11, color: Palette.inkFaint },
  hint: { marginTop: 8 },
});
