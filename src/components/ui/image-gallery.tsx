import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mediaUrl } from '@/lib/media';
import { Text } from './text';
import { Font, Palette } from './theme';

/**
 * Băng ảnh vuốt ngang cho chi tiết sản phẩm — đồ cũ sống nhờ xem nhiều góc để
 * soi vết. Chấm tròn báo vị trí; chạm để mở xem toàn màn (lightbox nền tối,
 * vuốt qua từng ảnh). Một ảnh thì ẩn chấm và số đếm. Nền tối nên chữ đếm sáng.
 */
const W = Dimensions.get('window').width;

export function ImageGallery({ images, aspectRatio = 1 }: { images: string[]; aspectRatio?: number }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const insets = useSafeAreaInsets();

  const uris = images.map((p) => mediaUrl(p)).filter(Boolean) as string[];
  const single = uris.length <= 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / W));
  };

  if (uris.length === 0) {
    return (
      <View style={[styles.empty, { height: W * aspectRatio }]}>
        <Ionicons name="image-outline" size={30} color={Palette.inkFaint} />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={uris}
        keyExtractor={(u, i) => `${i}-${u}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <Pressable onPress={() => setLightbox(true)} accessibilityLabel="Xem ảnh to hơn">
            <Image source={item} style={{ width: W, height: W * aspectRatio }} contentFit="cover" transition={160} />
          </Pressable>
        )}
      />

      {!single ? (
        <>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {index + 1}/{uris.length}
            </Text>
          </View>
          <View style={styles.dots} pointerEvents="none">
            {uris.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        </>
      ) : null}

      <Modal visible={lightbox} transparent animationType="fade" onRequestClose={() => setLightbox(false)}>
        <View style={styles.lbRoot}>
          <FlatList
            data={uris}
            keyExtractor={(u, i) => `lb-${i}-${u}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={index}
            getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
            renderItem={({ item }) => (
              <View style={styles.lbPage}>
                <Image source={item} style={styles.lbImage} contentFit="contain" />
              </View>
            )}
          />
          <Pressable
            style={[styles.lbClose, { top: insets.top + 8 }]}
            hitSlop={10}
            onPress={() => setLightbox(false)}
            accessibilityLabel="Đóng">
            <Ionicons name="close" size={26} color={Palette.white} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { width: W, backgroundColor: Palette.surfaceSunken, alignItems: 'center', justifyContent: 'center' },
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(25,32,41,0.6)',
  },
  counterText: { fontFamily: Font.semibold, fontSize: 11.5, color: Palette.white, fontVariant: ['tabular-nums'] },
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { backgroundColor: Palette.white, width: 16 },
  lbRoot: { flex: 1, backgroundColor: '#000' },
  lbPage: { width: W, flex: 1, alignItems: 'center', justifyContent: 'center' },
  lbImage: { width: W, height: '100%' },
  lbClose: { position: 'absolute', right: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
