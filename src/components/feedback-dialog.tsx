import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type FeedbackAction = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'destructive' | 'secondary';
};

type FeedbackDialogProps = {
  actions: FeedbackAction[];
  message: string;
  title: string;
  visible: boolean;
};

export function FeedbackDialog({ actions, message, title, visible }: FeedbackDialogProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.mark} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={[styles.actions, actions.length === 1 && styles.singleAction]}>
            {actions.map((action) => {
              const tone = action.tone ?? 'primary';
              const actionToneStyle =
                tone === 'destructive'
                  ? styles.actionDestructive
                  : tone === 'secondary'
                    ? styles.actionSecondary
                    : styles.actionPrimary;
              const labelToneStyle =
                tone === 'destructive'
                  ? styles.labelDestructive
                  : tone === 'secondary'
                    ? styles.labelSecondary
                    : styles.labelPrimary;

              return (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  onPress={action.onPress}
                  style={({ pressed }) => [
                    styles.action,
                    actionToneStyle,
                    pressed && styles.actionPressed,
                  ]}>
                  <Text style={[styles.actionLabel, labelToneStyle]}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(36, 35, 31, 0.38)', flex: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FDFCF9', borderRadius: 24, maxWidth: 380, padding: 24, shadowColor: '#24231F', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 28, width: '100%' },
  mark: { alignSelf: 'center', backgroundColor: '#A6513F', borderRadius: 3, height: 5, marginBottom: 20, width: 38 },
  title: { color: '#24231F', fontSize: 21, fontWeight: '700', textAlign: 'center' },
  message: { color: '#77736B', fontSize: 16, lineHeight: 23, marginTop: 10, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 26 },
  singleAction: { justifyContent: 'center' },
  action: { alignItems: 'center', borderRadius: 14, flex: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 14 },
  actionPrimary: { backgroundColor: '#A6513F' },
  actionDestructive: { backgroundColor: '#FBE9E6' },
  actionSecondary: { backgroundColor: '#F0ECE4' },
  actionPressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  actionLabel: { fontSize: 15, fontWeight: '700' },
  labelPrimary: { color: '#FFFFFF' },
  labelDestructive: { color: '#B53324' },
  labelSecondary: { color: '#57524A' },
});
