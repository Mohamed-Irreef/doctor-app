import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { CheckCircle, XCircle, Info } from 'lucide-react-native';

type ModalType = 'success' | 'error' | 'confirm' | 'info';

interface ActionModalProps {
  visible: boolean;
  type?: ModalType;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const TYPE_CONFIG: Record<ModalType, { iconColor: string; bgColor: string }> = {
  success: { iconColor: Colors.success, bgColor: '#DCFCE7' },
  error:   { iconColor: Colors.error,   bgColor: '#FEF2F2' },
  confirm: { iconColor: Colors.primary, bgColor: '#DBEAFE' },
  info:    { iconColor: Colors.secondary, bgColor: '#CCFBF1' },
};

export default function ActionModal({
  visible, type = 'success', title, message,
  confirmLabel = 'OK', cancelLabel, onConfirm, onCancel,
}: ActionModalProps) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 200 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.7);
      opacity.setValue(0);
    }
  }, [visible]);

  const cfg = TYPE_CONFIG[type];

  const IconComponent = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={[styles.iconBg, { backgroundColor: cfg.bgColor }]}>
            <IconComponent color={cfg.iconColor} size={48} />
          </View>
          <Text style={[Typography.h3, styles.title]}>{title}</Text>
          {message && <Text style={[Typography.body2, styles.message]}>{message}</Text>}
          <View style={[styles.footer, cancelLabel ? styles.footerRow : null]}>
            {cancelLabel && onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.rowButton, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={[Typography.body1, styles.cancelText]}>{cancelLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, cancelLabel ? styles.rowButton : null, styles.confirmButton, { backgroundColor: cfg.iconColor }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[Typography.body1, styles.confirmText]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  footer: {
    width: '100%',
  },
  footerRow: {
    flexDirection: 'row',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  rowButton: {
    flex: 1,
    width: 'auto',
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
    marginRight: 8,
  },
  confirmButton: {},
  cancelText: { fontWeight: '600', color: Colors.text },
  confirmText: { fontWeight: '700', color: Colors.surface },
});
