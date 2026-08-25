import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  const [workbooks, setWorkbooks] = useState(initialWorkbooks);
  const [showCreateWorkbook, setShowCreateWorkbook] = useState(false);
  const [newWorkbookName, setNewWorkbookName] = useState("");

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

  const createWorkbook = () => {
  const name = newWorkbookName.trim();

  if (!name) {
    Alert.alert("Workbook name required", "Please enter a workbook name.");
    return;
  }

  const newWorkbook: Workbook = {
    id: Date.now().toString(),
    name,
    red: 0,
    orange: 0,
    blue: 0,
    green: 0,
    hasUpdate: false,
  };

  setWorkbooks((current) => [...current, newWorkbook]);
  setNewWorkbookName("");
  setShowCreateWorkbook(false);
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
            onPress={() => setShowCreateWorkbook(true)}
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
                <View
                  style={[
                    styles.updateCircle,
                    !workbook.hasUpdate && styles.updateCircleHidden,
                  ]}
                />

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
      {showCreateWorkbook && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.createWorkbookBox,
              { backgroundColor: colors.card },
            ]}
          >
            <Text style={[styles.createWorkbookTitle, { color: colors.text }]}>
              New Workbook
            </Text>

            <TextInput
              style={[
                styles.workbookInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Workbook name"
              placeholderTextColor={colors.secondaryText}
              value={newWorkbookName}
              onChangeText={setNewWorkbookName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.iconBackground },
                ]}
                onPress={() => {
                  setNewWorkbookName("");
                  setShowCreateWorkbook(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.createButton]}
                onPress={createWorkbook}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
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
    transform: [{ translateY: -9 }],
  },

  updateCircle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#F4C430",
    marginRight: 9,
  },

  updateCircleHidden: {
    backgroundColor: "transparent",
  },

  workbookName: {
    fontSize: 21,
    fontWeight: "600",
    flexShrink: 1,
  },

  cardActions: {
    flexDirection: "row",
    gap: 7,
    transform: [{ translateY: -9 }],
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
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
    minWidth: 38,
},

statusCircle: {
  width: 18,
  height: 18,
  borderRadius: 9,
  marginRight: 5,
},

statusNumber: {
  fontSize: 13,
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
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  createWorkbookBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    padding: 22,
  },

  createWorkbookTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 18,
  },

  workbookInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },

  modalButton: {
    minWidth: 90,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  modalButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  createButton: {
    backgroundColor: "#1976D2",
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});