import { Alert, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Asset, requestPermissionsAsync } from 'expo-media-library';

type PhotoViewerProps = { filePath: string | null; onClose: () => void };

export function PhotoViewer({ filePath, onClose }: PhotoViewerProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const dragY = useSharedValue(0);
  const pinch = Gesture.Pinch()
    .onStart((event) => {
      startScale.value = scale.value;
      originX.value = (event.focalX - width / 2 - translateX.value) / scale.value;
      originY.value = (event.focalY - height / 2 - translateY.value) / scale.value;
    })
    .onUpdate((event) => {
      const nextScale = Math.min(4, Math.max(1, startScale.value * event.scale));
      scale.value = nextScale;
      translateX.value = event.focalX - width / 2 - originX.value * nextScale;
      translateY.value = event.focalY - height / 2 - originY.value * nextScale;
    })
    .onEnd(() => {
      scale.value = withTiming(1);
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
    });
  const pan = Gesture.Pan().onUpdate((event) => { dragY.value = Math.max(0, event.translationY); }).onEnd(() => { if (dragY.value > 120) runOnJS(onClose)(); dragY.value = withTiming(0); });
  const gesture = Gesture.Simultaneous(pinch, pan);
  const imageStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value + dragY.value }, { scale: scale.value }] }));

  async function savePhoto() {
    if (!filePath) return;
    try {
      await requestPermissionsAsync(true);
      await Asset.create(filePath);
      Alert.alert('Saved to Photos', 'This photo is now available in your iPhone Photos library.');
    } catch (error) {
      Alert.alert('Unable to save photo', error instanceof Error ? error.message : 'Please check Photos permission and try again.');
    }
  }

  return (
    <Modal animationType="fade" presentationStyle="fullScreen" visible={filePath !== null} onRequestClose={onClose}>
      <View style={styles.screen}>
        <GestureHandlerRootView style={styles.gestureRoot}>
          <View style={styles.imageStage}>
            {filePath ? <GestureDetector gesture={gesture}><Animated.Image resizeMode="contain" source={{ uri: filePath }} style={[styles.image, imageStyle]} /></GestureDetector> : null}
          </View>
        </GestureHandlerRootView>
        <Pressable accessibilityLabel="Close photo" accessibilityRole="button" hitSlop={12} onPress={onClose} style={[styles.closeButton, { top: insets.top + 8 }]}>
          <Text style={styles.closeButtonText}>X</Text>
        </Pressable>
        <Pressable accessibilityLabel="Download photo to Photos" accessibilityRole="button" onPress={() => void savePhoto()} style={[styles.saveButton, { top: insets.top + 8 }]}><Text style={styles.saveButtonText}>↓</Text></Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#171512', flex: 1 },
  gestureRoot: { flex: 1 },
  imageStage: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  image: { height: '100%', width: '100%' },
  closeButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 20, elevation: 99, height: 40, justifyContent: 'center', left: 16, position: 'absolute', width: 40, zIndex: 99 },
  closeButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  saveButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 20, elevation: 99, height: 40, justifyContent: 'center', position: 'absolute', right: 16, width: 40, zIndex: 99 },
  saveButtonText: { color: '#FFFFFF', fontSize: 25, fontWeight: '700', lineHeight: 28 },
});
