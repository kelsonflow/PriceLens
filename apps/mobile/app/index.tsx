import { Ionicons } from "@expo/vector-icons";
import { mockIdentification, mockOffers, rankOffers } from "@pricelens/shared";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = "home" | "confirm" | "results";

export default function HomeScreen() {
  const [step, setStep] = useState<Step>("home");
  const [productName, setProductName] = useState(mockIdentification.name);
  const [model, setModel] = useState(mockIdentification.model ?? "");
  const offers = useMemo(() => rankOffers(mockOffers), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Ionicons name="search" size={18} color="#fff" />
          </View>
          <Text style={styles.brand}>PriceLens</Text>
          <View style={styles.headerActions}>
            <Ionicons name="heart-outline" size={22} color="#19212a" />
            <Ionicons name="time-outline" size={22} color="#19212a" />
          </View>
        </View>

        {step === "home" && (
          <View>
            <Text style={styles.eyebrow}>Comparacao inteligente</Text>
            <Text style={styles.title}>Encontra o melhor preco com uma fotografia</Text>
            <Text style={styles.subtitle}>Fotografa um produto e compara ofertas de lojas confiaveis.</Text>
            <Image source={{ uri: mockIdentification.imageUrl }} style={styles.heroImage} />
            <Pressable style={styles.primaryButton} onPress={() => setStep("confirm")}>
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Tirar fotografia</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => setStep("confirm")}>
              <Ionicons name="image-outline" size={20} color="#19212a" />
              <Text style={styles.secondaryButtonText}>Escolher da galeria</Text>
            </Pressable>
            <View style={styles.searchInput}>
              <Ionicons name="search-outline" size={20} color="#5d6875" />
              <TextInput placeholder="Ou pesquisa pelo nome do produto" placeholderTextColor="#5d6875" style={styles.input} />
            </View>
          </View>
        )}

        {step === "confirm" && (
          <View>
            <Text style={styles.eyebrow}>Confirmacao</Text>
            <Text style={styles.sectionTitle}>Confirma o produto identificado</Text>
            <Image source={{ uri: mockIdentification.imageUrl }} style={styles.productImage} />
            <View style={styles.card}>
              <Text style={styles.label}>Nome do produto</Text>
              <TextInput value={productName} onChangeText={setProductName} style={styles.field} />
              <Text style={styles.label}>Modelo</Text>
              <TextInput value={model} onChangeText={setModel} style={styles.field} />
              <View style={styles.chips}>
                {mockIdentification.visibleFeatures.map((feature) => (
                  <Text key={feature} style={styles.chip}>
                    {feature}
                  </Text>
                ))}
              </View>
              <Pressable style={styles.primaryButton} onPress={() => setStep("results")}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Comparar precos</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === "results" && (
          <View>
            <Text style={styles.eyebrow}>Resultados</Text>
            <Text style={styles.sectionTitle}>{productName}</Text>
            <Text style={styles.subtitleSmall}>{model} · Portugal · EUR</Text>
            <View style={styles.warning}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#09624d" />
              <Text style={styles.warningText}>Os dados abaixo sao simulados ate serem ligadas APIs reais.</Text>
            </View>
            {offers.map((offer) => (
              <View key={offer.id} style={styles.offerCard}>
                <Image source={{ uri: offer.imageUrl }} style={styles.offerImage} />
                <View style={styles.offerInfo}>
                  <Text style={styles.mockBadge}>Dados simulados</Text>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <Text style={styles.offerStore}>{offer.storeName} · Match {offer.matchConfidence}%</Text>
                  <Text style={styles.price}>{offer.totalPrice.toFixed(2)} EUR</Text>
                  <Pressable style={styles.buyButton}>
                    <Text style={styles.buyButtonText}>Comprar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef3f5"
  },
  content: {
    padding: 18,
    gap: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#19212a"
  },
  brand: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#19212a"
  },
  headerActions: {
    flexDirection: "row",
    gap: 12
  },
  eyebrow: {
    color: "#09624d",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 10
  },
  title: {
    color: "#19212a",
    fontSize: 42,
    lineHeight: 42,
    fontWeight: "900"
  },
  sectionTitle: {
    color: "#19212a",
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "900"
  },
  subtitle: {
    color: "#5d6875",
    fontSize: 17,
    lineHeight: 26,
    marginTop: 14,
    marginBottom: 18
  },
  subtitleSmall: {
    color: "#5d6875",
    fontSize: 15,
    marginTop: 6,
    marginBottom: 14
  },
  heroImage: {
    width: "100%",
    height: 320,
    borderRadius: 8,
    marginBottom: 14
  },
  productImage: {
    width: "100%",
    height: 260,
    borderRadius: 8,
    marginTop: 18,
    marginBottom: 14
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: "#0f8a68",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe5ea",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  secondaryButtonText: {
    color: "#19212a",
    fontWeight: "800",
    fontSize: 16
  },
  searchInput: {
    minHeight: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dfe5ea",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 12
  },
  input: {
    flex: 1,
    color: "#19212a"
  },
  card: {
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe5ea",
    padding: 16,
    gap: 10
  },
  label: {
    color: "#5d6875",
    fontWeight: "800"
  },
  field: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dfe5ea",
    padding: 12,
    color: "#19212a"
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 6
  },
  chip: {
    borderRadius: 8,
    backgroundColor: "#f4f7f8",
    paddingHorizontal: 9,
    paddingVertical: 7,
    color: "#5d6875",
    fontWeight: "800"
  },
  warning: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 8,
    backgroundColor: "#ecf7f2",
    padding: 12,
    marginBottom: 12
  },
  warningText: {
    flex: 1,
    color: "#09624d",
    lineHeight: 20
  },
  offerCard: {
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe5ea",
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12
  },
  offerImage: {
    width: 100,
    height: 122,
    borderRadius: 8
  },
  offerInfo: {
    flex: 1
  },
  mockBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#eaf0ff",
    color: "#2767c6",
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "800"
  },
  offerTitle: {
    color: "#19212a",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8
  },
  offerStore: {
    color: "#5d6875",
    marginTop: 4
  },
  price: {
    color: "#19212a",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8
  },
  buyButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#0f8a68",
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 8
  },
  buyButtonText: {
    color: "#fff",
    fontWeight: "800"
  }
});

