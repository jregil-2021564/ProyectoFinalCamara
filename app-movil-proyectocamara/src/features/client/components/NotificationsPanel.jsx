// src/features/client/components/NotificationsPanel.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useClientApi } from "../hooks/useClientApi";
import { pickArray } from "../../../shared/utils/pickArray";
import { formatMoney } from "../../../shared/utils/formatMoney";
import { getFineAmount, getFineDescription } from "../utils/fineAmount";
import { COLORS, FONT_SIZE, SPACING, SHADOWS } from "../../../shared/constants/theme";

const NotificationsPanel = ({ visible, onClose }) => {
  const { getFines, getRechargeHistory } = useClientApi();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setLoading(true);
    const [finesRes, histRes] = await Promise.all([getFines(), getRechargeHistory()]);

    const fines = finesRes.success ? pickArray(finesRes.data) : [];
    const history = histRes.success ? pickArray(histRes.data) : [];

    const finePaidItems = fines
      .filter((f) => f.pagada === true || (f.estado || f.status) === "PAGADA")
      .map((f) => ({
        id: `fine-${f._id || f.id}`,
        type: "fine",
        title: "Multa pagada",
        subtitle: getFineDescription(f),
        amount: getFineAmount(f),
        date: f.fecha,
      }));

    const rechargeItems = history.map((r) => ({
      id: `recharge-${r._id || r.id}`,
      type: "recharge",
      title: "Recarga realizada",
      subtitle: r.tarjeta || r.alias || "Tarjeta",
      amount: r.monto,
      date: r.fecha,
    }));

    const merged = [...finePaidItems, ...rechargeItems].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    setItems(merged);
    setLoading(false);
  }, [getFines, getRechargeHistory]);

  useEffect(() => {
    if (visible) {
      load();
      slideAnim.setValue(0);
      Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const translateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [340, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.panelWrap, { transform: [{ translateX }] }]}>
          <Pressable style={styles.panel} onPress={() => {}}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Notificaciones</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={COLORS.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
              {loading ? (
                <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
              ) : items.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <MaterialIcons name="notifications-none" size={40} color={COLORS.textLight} />
                  <Text style={styles.emptyText}>Sin notificaciones por ahora</Text>
                </View>
              ) : (
                items.map((item, index) => {
                  const isFine = item.type === "fine";
                  return (
                    <NotificationRow key={item.id} item={item} isFine={isFine} delay={index * 60} />
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const NotificationRow = ({ item, isFine, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 320, delay, useNativeDriver: true }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: isFine ? `${COLORS.success}1A` : `${COLORS.primary}1A` }]}>
          <MaterialIcons
            name={isFine ? "check-circle" : "add-card"}
            size={18}
            color={isFine ? COLORS.success : COLORS.primary}
          />
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
          {item.date ? (
            <Text style={styles.rowDate}>
              {new Date(item.date).toLocaleString("es-GT", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          ) : null}
        </View>
        <Text style={styles.rowAmount}>{formatMoney(item.amount)}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  panelWrap: {},
  panel: {
    width: 340,
    maxWidth: "88%",
    height: "100%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  headerTitle: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
  },
  list: {
    padding: SPACING.md,
  },
  spinner: {
    marginTop: SPACING.xl,
  },
  emptyWrap: {
    alignItems: "center",
    marginTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.text,
  },
  rowSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 1,
  },
  rowDate: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.text,
  },
});

export default NotificationsPanel;
