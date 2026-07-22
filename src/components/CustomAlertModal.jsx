// src/components/CustomAlertModal.jsx
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function CustomAlertModal({
  visible,
  title,
  message,
  icon = 'heart',
  iconColor = '#FF007F',
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  onClose,
  isDanger = false,
}) {
  const { theme, isDark } = useTheme();

  const handleConfirm = onConfirm || onClose;
  const handleCancel = onCancel || onClose || handleConfirm;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel || onConfirm}>
      <View style={styles.backdrop}>
        <View style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1C1433' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
          }
        ]}>
          <View style={[
            styles.iconCircle,
            { backgroundColor: isDanger ? 'rgba(255, 55, 95, 0.15)' : 'rgba(255, 0, 127, 0.15)', borderColor: iconColor }
          ]}>
            <Ionicons name={icon} size={28} color={iconColor} />
          </View>

          {!!title && <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>}
          {!!message && <Text style={[styles.message, { color: theme.textSec }]}>{message}</Text>}

          <View style={styles.buttonRow}>
            {!!cancelText && (
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelTxt, { color: theme.textSec }]}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={handleConfirm} activeOpacity={0.8}>
              <LinearGradient
                colors={isDanger ? ['#FF375F', '#D00040'] : ['#FF007F', '#B5179E']}
                style={styles.grad}
              >
                <Text style={styles.confirmTxt}>{confirmText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelTxt: {
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {},
  grad: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
