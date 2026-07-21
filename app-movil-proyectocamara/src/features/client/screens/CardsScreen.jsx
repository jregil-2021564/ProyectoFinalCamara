// src/features/client/screens/CardsScreen.jsx
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useForm } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientHeader from "../components/ClientHeader";
import SectionCard from "../components/SectionCard";
import CardVisual from "../components/CardVisual";
import CardDetailModal from "../components/CardDetailModal";
import { EmptyState } from "../../../shared/components/common/Common";
import Toast, { useToast } from "../../../shared/components/common/Toast";
import Input from "../../../shared/components/common/Input";
import Button from "../../../shared/components/common/Button";
import { useClientApi } from "../hooks/useClientApi";
import { pickArray } from "../../../shared/utils/pickArray";
import { COLORS, FONT_SIZE, SPACING } from "../../../shared/constants/theme";

const CardsScreen = () => {
  const { getCards, addCard, deleteCard, verifyCard, loading } = useClientApi();
  const [cards, setCards] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState("list"); // list | add | verify
  const [formError, setFormError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const toast = useToast();

  const addForm = useForm({
    defaultValues: {
      numeroTarjeta: "",
      fechaVencimiento: "",
      cvv: "",
      nombreTitular: "",
      alias: "",
    },
  });
  const verifyForm = useForm({ defaultValues: { token: "" } });

  const load = useCallback(async () => {
    const res = await getCards();
    if (res.success) setCards(pickArray(res.data));
  }, [getCards]);

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onSubmitAdd = async (values) => {
    setFormError(null);
    const result = await addCard({ ...values, tipoTarjeta: "CREDITO" });
    if (result.success) {
      setMode("verify");
    } else {
      setFormError(result.message);
    }
  };

  const onSubmitVerify = async ({ token }) => {
    setFormError(null);
    const result = await verifyCard(token);
    if (result.success) {
      verifyForm.reset();
      addForm.reset();
      setMode("list");
      load();
      toast.show("¡Tarjeta verificada con éxito!", "success");
    } else {
      setFormError(result.message);
    }
  };

  const confirmDelete = (card) => {
    Alert.alert(
      "Eliminar tarjeta",
      `¿Seguro que quieres eliminar ${card.alias || "esta tarjeta"}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const result = await deleteCard(card.id || card._id);
            if (result.success) {
              setSelectedCard(null);
              load();
              toast.show("Tarjeta eliminada", "info");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <Toast {...toast.props} />
      <ClientHeader title="Tarjetas" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {mode === "list" ? (
          <>
            <SectionCard
              icon="credit-card"
              title="Mis Tarjetas"
              delay={0}
              actions={[
                { label: "Verificar código", icon: "verified", onPress: () => setMode("verify") },
                { label: "Agregar", icon: "add", onPress: () => setMode("add") },
              ]}
            >
              {loading && cards.length === 0 ? (
                <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
              ) : cards.length === 0 ? (
                <EmptyState
                  icon="credit-card-off"
                  title="Sin tarjetas registradas"
                  message="Agrega una tarjeta y verifica el código que llegará a tu correo."
                />
              ) : null}
            </SectionCard>

            {cards.map((card, index) => (
              <CardVisual
                key={card.id || card._id}
                card={card}
                delay={index * 100}
                onPress={() => setSelectedCard(card)}
              />
            ))}
          </>
        ) : null}

        {mode === "add" ? (
          <SectionCard icon="add-card" title="Agregar tarjeta" delay={0}>
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <Input
              label="Número de tarjeta"
              placeholder="5500 0000 0000 0004"
              keyboardType="number-pad"
              value={addForm.watch("numeroTarjeta")}
              onChangeText={(v) => addForm.setValue("numeroTarjeta", v)}
              style={styles.input}
            />
            <Input
              label="Fecha de vencimiento (MM/AA)"
              placeholder="12/29"
              value={addForm.watch("fechaVencimiento")}
              onChangeText={(v) => addForm.setValue("fechaVencimiento", v)}
              style={styles.input}
            />
            <Input
              label="CVV"
              placeholder="123"
              keyboardType="number-pad"
              secureTextEntry
              value={addForm.watch("cvv")}
              onChangeText={(v) => addForm.setValue("cvv", v)}
              style={styles.input}
            />
            <Input
              label="Nombre del titular"
              placeholder="Joab Regil"
              value={addForm.watch("nombreTitular")}
              onChangeText={(v) => addForm.setValue("nombreTitular", v)}
              style={styles.input}
            />
            <Input
              label="Alias (opcional)"
              placeholder="Mi Visa"
              value={addForm.watch("alias")}
              onChangeText={(v) => addForm.setValue("alias", v)}
              style={styles.input}
            />

            <Button
              title="Agregar tarjeta"
              onPress={addForm.handleSubmit(onSubmitAdd)}
              loading={loading}
              style={styles.submitButton}
            />
            <Pressable onPress={() => setMode("list")} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </SectionCard>
        ) : null}

        {mode === "verify" ? (
          <SectionCard icon="verified" title="Verificar tarjeta" delay={0}>
            <Text style={styles.helperText}>
              Ingresa el código que te enviamos por correo para verificar tu tarjeta.
            </Text>
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <Input
              label="Código"
              placeholder="701114"
              keyboardType="number-pad"
              value={verifyForm.watch("token")}
              onChangeText={(v) => verifyForm.setValue("token", v)}
              style={styles.input}
            />
            <Button
              title="Verificar"
              onPress={verifyForm.handleSubmit(onSubmitVerify)}
              loading={loading}
              style={styles.submitButton}
            />
            <Pressable onPress={() => setMode("list")} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </SectionCard>
        ) : null}
      </ScrollView>

      <CardDetailModal
        visible={!!selectedCard}
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onDelete={() => confirmDelete(selectedCard)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  spinner: {
    marginVertical: SPACING.lg,
  },
  input: {
    marginBottom: 0,
  },
  helperText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  formError: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  cancelLink: {
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  cancelText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
  },
});

export default CardsScreen;