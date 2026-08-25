import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

type Status = "red" | "orange" | "blue" | "green";

type Workbook = {
  id: string;
  name: string;
  red: number;
  orange: number;
  blue: number;
  green: number;
  hasUpdate: boolean;
};

const initialWorkbooks: Workbook[] = [
  {
    id: "1",
    name: "Home",
    red: 2,
    orange: 3,
    blue: 4,
    green: 1,
    hasUpdate: true,
  },
  {
    id: "2",
    name: "Car",
    red: 0,
    orange: 2,
    blue: 3,
    green: 0,
    hasUpdate: false,
  },
  {
    id: "3",
    name: "Family",
    red: 1,
    orange: 1,
    blue: 2,
    green: 2,
    hasUpdate: true,
  },
];

export default function App() {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [workbooks] = useState(initialWorkbooks);

  const isDark =
    theme === "dark" ||
    (theme === "system" && systemScheme === "dark");

  const colors = useMemo(
    () => ({
      background: isDark ? "#111111" : "#F5F5F5",
      card: isDark ? "#1E1E1E" : "#FFFFFF",
      text: isDark ? "#FFFFFF" : "#171717",
      secondaryText: isDark ? "#AAAAAA" : "#6B6B6B",
      border: isDark ? "#333333" : "#E3E3E3",
      topBar: isDark ? "#181818" : "#FFFFFF",
      iconBackground: isDark ? "#292929" : "#F0F0F0",
    }),
    [isDark]
  );

  const openWorkbook = (workbook: Workbook) => {
    Alert.alert(workbook.name, "Workbook screen will be built next.");
  };

  const openSettings = () => {
    Alert.alert(
      "Settings",
      "Settings screen will be built in the next stages."
    );
  };

  const openSearch = () => {
    Alert.alert(
      "Search",
      "Search functionality will be added later."
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Permanent top bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.topBar,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          style={[styles.topIconButton, { backgroundColor: colors.iconBackground }]}
          onPress={openSettings}
        >
          <Text style={[styles.topIcon, { color: colors.text }]}>☰</Text>
        </Pressable>

        <View style={styles.userArea}>
          <Text style={[styles.userName, { color: colors.text }]}>
            Nikolay Stanev
          </Text>
          <Text style={[styles.screenTitle, { color: colors.secondaryText }]}>
            Workbooks
          </Text>
        </View>

        <Pressable
          style={[styles.topIconButton, { backgroundColor: colors.iconBackground }]}
          onPress={openSearch}
        >
          <Text style={[styles.topIcon, { color: colors.text }]}>⌕</Text>
        </Pressable>
      </View>

      {/* Workbook list */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <Text style={[styles.heading, { color: colors.text }]}>
            My Workbooks
          </Text>

          <Pressable
            style={styles.addButton}
            onPress={() =>
              Alert.alert(
                "New Workbook",
                "Workbook creation will be connected to Supabase later."
              )
            }
          >
            <Text style={styles.addButtonText}>＋</Text>
          </Pressable>
        </View>

        {workbooks.map((workbook) => (
          <Pressable
            key={workbook.id}
            onPress={() => openWorkbook(workbook)}
            style={({ pressed }) => [
              styles.workbookCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={styles.titleArea}>
                {workbook.hasUpdate && (
                  <View style={styles.updateCircle} />
                )}

                <Text
                  style={[styles.workbookName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {workbook.name}
                </Text>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  style={[
                    styles.smallAction,
                    { backgroundColor: colors.iconBackground },
                  ]}
                  onPress={(event) => {
                    event.stopPropagation();
                    Alert.alert(
                      "Share",
                      "Sharing will be connected later."
                    );
                  }}
                >
                  <Text style={[styles.actionText, { color: colors.text }]}>
                    ↗
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.smallAction,
                    { backgroundColor: colors.iconBackground },
                  ]}
                  onPress={(event) => {
                    event.stopPropagation();
                    Alert.alert(
                      "Workbook options",
                      "Archive/delete options will be connected later."
                    );
                  }}
                >
                  <Text style={[styles.actionText, { color: colors.text }]}>
                    ⋯
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Status indicators */}
            <View style={styles.statusRow}>
              <StatusIndicator
                color="#E53935"
                value={workbook.red}
                label="Overdue"
                textColor={colors.text}
              />

              <StatusIndicator
                color="#F39C12"
                value={workbook.orange}
                label="Due"
                textColor={colors.text}
              />

              <StatusIndicator
                color="#1976D2"
                value={workbook.blue}
                label="Upcoming"
                textColor={colors.text}
              />

              <StatusIndicator
                color="#43A047"
                value={workbook.green}
                label="Completed"
                textColor={colors.text}
              />
            </View>
          </Pressable>
        ))}

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusIndicator({
  color,
  value,
  label,
  textColor,
}: {
  color: string;
  value: number;
  label: string;
  textColor: string;
}) {
  return (
    <View style={styles.statusItem}>
      <View style={[styles.statusCircle, { backgroundColor: color }]} />

      <Text style={[styles.statusNumber, { color: textColor }]}>
        {value}
      </Text>

      <Text style={styles.accessibilityLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  topBar: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  topIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  topIcon: {
    fontSize: 24,
    fontWeight: "500",
  },

  userArea: {
    flex: 1,
    marginHorizontal: 14,
  },

  userName: {
    fontSize: 16,
    fontWeight: "600",
  },

  screenTitle: {
    fontSize: 13,
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  heading: {
    fontSize: 25,
    fontWeight: "700",
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "300",
    marginTop: -2,
  },

  workbookCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginBottom: 14,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  titleArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },

  updateCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F4C430",
    marginRight: 9,
  },

  workbookName: {
    fontSize: 21,
    fontWeight: "650",
    flexShrink: 1,
  },

  cardActions: {
    flexDirection: "row",
    gap: 7,
  },

  smallAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  actionText: {
    fontSize: 18,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },

  statusItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 38,
  },

  statusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginBottom: 5,
  },

  statusNumber: {
    fontSize: 15,
    fontWeight: "600",
  },

  accessibilityLabel: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
  },

  footerSpace: {
    height: 40,
  },
});
