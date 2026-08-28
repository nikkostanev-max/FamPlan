import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
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

type TaskStatus = "red" | "orange" | "blue" | "green";

type Task = {
  id: string;
  name: string;
  date?: string;
  location?: string;
  description?: string;
  repetition?: string;
  status: TaskStatus;
};

type Workbook = {
  id: string;
  name: string;
  color: string;
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
    color: "transparent",
    red: 2,
    orange: 3,
    blue: 4,
    green: 1,
    hasUpdate: true,
  },
  {
    id: "2",
    name: "Car",
    color: "transparent",
    red: 0,
    orange: 2,
    blue: 3,
    green: 0,
    hasUpdate: false,
  },
  {
    id: "3",
    name: "Family",
    color: "transparent",
    red: 1,
    orange: 1,
    blue: 2,
    green: 2,
    hasUpdate: true,
  },
];

const initialTasks: Record<string, Task[]> = {
  "1": [
    {
      id: "home-1",
      name: "Clean the kitchen",
      date: "2026-08-26",
      location: "Kitchen",
      description: "Clean the kitchen thoroughly.",
      repetition: "Every 7 days",
      status: "orange",
    },
    {
      id: "home-2",
      name: "Buy light bulbs",
      date: "2026-08-27",
      location: "Home Depot",
      description: "Buy replacement light bulbs.",
      status: "blue",
    },
    {
      id: "home-3",
      name: "Check mailbox",
      status: "orange",
    },
    {
      id: "home-4",
      name: "Pay electricity bill",
      date: "2026-08-25",
      location: "Online",
      description: "Pay the monthly electricity bill.",
      status: "red",
    },
  ],

  "2": [
    {
      id: "car-1",
      name: "Oil change",
      date: "2026-09-02",
      location: "Garage",
      description: "Change engine oil and filter.",
      repetition: "Every 6 months",
      status: "blue",
    },
    {
      id: "car-2",
      name: "Check tire pressure",
      date: "2026-08-26",
      location: "Garage",
      status: "orange",
    },
  ],

  "3": [
    {
      id: "family-1",
      name: "Family dinner",
      date: "2026-08-29",
      location: "Home",
      description: "Family dinner.",
      status: "blue",
    },
    {
      id: "family-2",
      name: "Call grandparents",
      status: "orange",
    },
    {
      id: "family-3",
      name: "School documents",
      date: "2026-08-25",
      location: "School",
      status: "red",
    },
  ],
};

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function parseTaskDate(date?: string) {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Date.parse(date);

  if (Number.isNaN(parsed)) {
    return Number.POSITIVE_INFINITY;
  }

  return parsed;
}

/*
 * Uses the device/browser locale and its normal short-date
 * convention instead of forcing one particular format.
 */
function formatTaskDate(date?: string) {
  if (!date) {
    return "—";
  }

  const parts = date.split("-");

  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const localDate = new Date(
      year,
      month - 1,
      day
    );

    if (!Number.isNaN(localDate.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
      }).format(localDate);
    }
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
  }).format(parsed);
}

export default function App() {
  const systemScheme = useColorScheme();

  const [theme] =
    useState<"system" | "light" | "dark">("system");

  const [workbooks, setWorkbooks] =
    useState<Workbook[]>(initialWorkbooks);

  const [tasksByWorkbook, setTasksByWorkbook] =
    useState<Record<string, Task[]>>(initialTasks);

  const [selectedWorkbookId, setSelectedWorkbookId] =
    useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] =
    useState<string | null>(null);

  const [showCreateWorkbook, setShowCreateWorkbook] =
    useState(false);

  const [showColorPicker, setShowColorPicker] =
    useState(false);

  const [colorPickerWorkbookId, setColorPickerWorkbookId] =
    useState<string | null>(null);

  const [newWorkbookName, setNewWorkbookName] =
    useState("");

  const [workbookError, setWorkbookError] =
    useState("");

  const [showCreateTask, setShowCreateTask] =
    useState(false);

  const [newTaskName, setNewTaskName] =
    useState("");

  const [newTaskDate, setNewTaskDate] =
    useState("");

  const [newTaskLocation, setNewTaskLocation] =
    useState("");

  const [taskError, setTaskError] =
    useState("");

  const isDark =
    theme === "dark" ||
    (theme === "system" && systemScheme === "dark");

  const colors = useMemo(
    () => ({
      background: isDark ? "#111111" : "#F5F5F5",
      card: isDark ? "#1E1E1E" : "#FFFFFF",
      text: isDark ? "#FFFFFF" : "#171717",
      secondaryText: isDark ? "#AAAAAA" : "#6B6B6B",
      border: isDark ? "#3A3A3A" : "#D0D0D0",
      separator: isDark ? "#3A3A3A" : "#D8D8D8",
      topBar: isDark ? "#181818" : "#FFFFFF",
      iconBackground: isDark ? "#292929" : "#F0F0F0",
      inputBackground: isDark ? "#252525" : "#FAFAFA",
      error: isDark ? "#FF8A80" : "#C62828",
    }),
    [isDark]
  );

  const selectedWorkbook =
    workbooks.find(
      (workbook) => workbook.id === selectedWorkbookId
    ) ?? null;

  const selectedTasks = useMemo(() => {
    if (!selectedWorkbookId) {
      return [];
    }

    return [...(tasksByWorkbook[selectedWorkbookId] ?? [])].sort(
      (a, b) => parseTaskDate(a.date) - parseTaskDate(b.date)
    );
  }, [selectedWorkbookId, tasksByWorkbook]);

  const selectedTask = useMemo(() => {
    if (!selectedWorkbookId || !selectedTaskId) {
      return null;
    }

    return (
      tasksByWorkbook[selectedWorkbookId]?.find(
        (task) => task.id === selectedTaskId
      ) ?? null
    );
  }, [
    selectedWorkbookId,
    selectedTaskId,
    tasksByWorkbook,
  ]);

  const openWorkbook = (workbook: Workbook) => {
    setSelectedWorkbookId(workbook.id);
    setSelectedTaskId(null);

    setWorkbooks((current) => {
      const selected = current.find(
        (item) => item.id === workbook.id
      );

      if (!selected) {
        return current;
      }

      return [
        selected,
        ...current.filter(
          (item) => item.id !== workbook.id
        ),
      ];
    });
  };

  const goHome = () => {
    setSelectedWorkbookId(null);
    setSelectedTaskId(null);
  };
  const changeWorkbookColor = (
    workbookId: string,
    color: string
  ) => {
    setWorkbooks((current) =>
      current.map((workbook) =>
        workbook.id === workbookId
          ? {
              ...workbook,
              color,
            }
          : workbook
      )
    );
  };
  const goBackToWorkbook = () => {
    setSelectedTaskId(null);
  };

  const openTask = (task: Task) => {
    setSelectedTaskId(task.id);
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
      setWorkbookError("Workbook name is required.");
      return;
    }

    const duplicateExists = workbooks.some(
      (workbook) =>
        normalizeName(workbook.name) ===
        normalizeName(name)
    );

    if (duplicateExists) {
      setWorkbookError(
        "A workbook with this name already exists."
      );
      return;
    }

    const newId = Date.now().toString();

    const newWorkbook: Workbook = {
      id: newId,
      name,
      color: "transparent",
      red: 0,
      orange: 0,
      blue: 0,
      green: 0,
      hasUpdate: false,
    };

    setWorkbooks((current) => [
      newWorkbook,
      ...current,
    ]);

    setTasksByWorkbook((current) => ({
      ...current,
      [newId]: [],
    }));

    setNewWorkbookName("");
    setWorkbookError("");
    setShowCreateWorkbook(false);
  };

  const createTask = () => {
    if (!selectedWorkbookId) {
      return;
    }

    const name = newTaskName.trim();

    if (!name) {
      setTaskError("Task name is required.");
      return;
    }

    const currentTasks =
      tasksByWorkbook[selectedWorkbookId] ?? [];

    const duplicateExists = currentTasks.some(
      (task) =>
        normalizeName(task.name) ===
        normalizeName(name)
    );

    if (duplicateExists) {
      setTaskError(
        "A task with this name already exists."
      );
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      name,
      date: newTaskDate.trim() || undefined,
      location:
        newTaskLocation.trim() || undefined,
      status: "orange",
    };

    setTasksByWorkbook((current) => ({
      ...current,
      [selectedWorkbookId]: [
        ...(current[selectedWorkbookId] ?? []),
        task,
      ],
    }));

    setNewTaskName("");
    setNewTaskDate("");
    setNewTaskLocation("");
    setTaskError("");
    setShowCreateTask(false);
  };

  /*
   * TASK DETAILS
   * The same permanent top bar is displayed here.
   */

  if (selectedTask && selectedWorkbook) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <StatusBar
          barStyle={
            isDark
              ? "light-content"
              : "dark-content"
          }
        />

        <View
          style={[
            styles.topBar,
            {
              backgroundColor:
                colors.topBar,
              borderBottomColor:
                colors.border,
            },
          ]}
        >
          <Pressable
            style={[
              styles.topIconButton,
              {
                backgroundColor: "transparent",
              },
            ]}
            onPress={openSettings}
          >
            <Ionicons
              name="settings-outline"
              size={23}
              color={colors.text}
            />
          </Pressable>

          <Pressable
            style={[
              styles.topIconButton,
              {
                backgroundColor: "transparent",
              },
            ]}
            onPress={goHome}
          >
            <Ionicons
              name="home-outline"
              size={22}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.userArea}>
            <Text
              style={[
                styles.userName,
                {
                  color: colors.text,
                },
              ]}
            >
              Nikolay Stanev
            </Text>
          </View>

          <Pressable
            style={[
              styles.topIconButton,
              {
                backgroundColor: "transparent",
              },
            ]}
            onPress={openSearch}
          >
            <Ionicons
              name="search-outline"
              size={22}
             color={colors.text}
            />
          </Pressable>
        </View>

        <View
          style={[
            styles.detailsNavigation,
            {
              borderBottomColor:
                colors.separator,
            },
          ]}
        >
          <Pressable
            style={[
              styles.detailsBackButton,
              {
                backgroundColor: "transparent",
              },
            ]}
            onPress={goBackToWorkbook}
          >
            <Ionicons
              name="arrow-back-outline"
              size={23}
              color={colors.text}
            />
          </Pressable>

          <Text
            style={[
              styles.detailsNavigationTitle,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {selectedWorkbook.name}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={
            styles.detailsContent
          }
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[
              styles.detailsTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {selectedTask.name}
          </Text>

          <DetailSection
            title="Location"
            value={
              selectedTask.location ??
              "Unallocated"
            }
            colors={colors}
            italic={!selectedTask.location}
          />

          <DetailSection
            title="Due date"
            value={formatTaskDate(
              selectedTask.date
            )}
            colors={colors}
          />

          <DetailSection
            title="Description"
            value={
              selectedTask.description ??
              "No description"
            }
            colors={colors}
          />

          <DetailSection
            title="Repetition"
            value={
              selectedTask.repetition ??
              "No repetition"
            }
            colors={colors}
          />

          <View
            style={[
              styles.detailSection,
              {
                borderTopColor:
                  colors.separator,
              },
            ]}
          >
            <Text
              style={[
                styles.detailSectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Completion History
            </Text>

            <Text
              style={[
                styles.historyPlaceholder,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              No completion history yet.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <StatusBar
        barStyle={
          isDark
            ? "light-content"
            : "dark-content"
        }
      />

      {/* PERMANENT TOP BAR */}

      <View
        style={[
          styles.topBar,
          {
            backgroundColor:
              colors.topBar,
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <Pressable
          style={[
            styles.topIconButton,
            {
                backgroundColor: "transparent",
            },
          ]}
          onPress={openSettings}
        >
          <Ionicons
            name="settings-outline"
            size={23}
            color={colors.text}
          />
        </Pressable>

          <Pressable
            style={[
              styles.topIconButton,
              {
                backgroundColor: "transparent",
              },
            ]}
            onPress={goHome}
          >
          <Ionicons
            name="home-outline"
            size={22}
            color={colors.text}
          />
        </Pressable>

        <View style={styles.userArea}>
          <Text
            style={[
              styles.userName,
              {
                color: colors.text,
              },
            ]}
          >
            Nikolay Stanev
          </Text>
        </View>

        <Pressable
          style={[
            styles.topIconButton,
            {
              backgroundColor: "transparent",
            },
          ]}
          onPress={openSearch}
        >
          <Ionicons
            name="search-outline"
            size={22}
            color={colors.text}
          />
        </Pressable>
      </View>

      {/* HOME SCREEN */}

      {!selectedWorkbook && (
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headingRow}>
            <Text
              style={[
                styles.heading,
                {
                  color: colors.text,
                },
              ]}
            >
              My Workbooks
            </Text>

            <Pressable
              style={styles.addButton}
              onPress={() => {
                setWorkbookError("");
                setNewWorkbookName("");
                setShowCreateWorkbook(
                  true
                );
              }}
            >
              <Ionicons
                name="add"
                size={23}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {workbooks.map((workbook) => (
            <Pressable
              key={workbook.id}
              onPress={() =>
                openWorkbook(workbook)
              }
              style={({ pressed }) => [
                styles.workbookCard,
                {
                  backgroundColor:
                    workbook.color,
                  borderColor:
                    colors.border,
                  opacity:
                    pressed ? 0.75 : 1,
                },
              ]}
            >
              <View
                style={styles.cardHeader}
              >
                <View
                  style={styles.titleArea}
                >
                  <View
                    style={[
                      styles.updateCircle,
                      !workbook.hasUpdate &&
                        styles.updateCircleHidden,
                    ]}
                  />

                  <Text
                    style={[
                      styles.workbookName,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {workbook.name}
                  </Text>
                </View>

                <View
                  style={
                    styles.cardActions
                  }
                >
                  <Pressable
                    style={[
                      styles.smallAction,
                      {
                        backgroundColor: "transparent",
                      },
                    ]}
                    onPress={() =>
                      Alert.alert(
                        "Share",
                        "Sharing will be connected later."
                      )
                    }
                  >
                    <Ionicons
                      name="share-outline"
                      size={20}
                      color={colors.text}
                    />
                  </Pressable>

                  <Pressable
                    style={[
                      styles.smallAction,
                      {
                        backgroundColor: "transparent",
                      },
                    ]}
                    onPress={() => {
                      setColorPickerWorkbookId(workbook.id);
                      setShowColorPicker(true);
                    }}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={20}
                      color={colors.text}
                    />
                  </Pressable>
                </View>
              </View>

              <View
                style={styles.statusRow}
              >
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

          <View
            style={styles.footerSpace}
          />
        </ScrollView>
      )}

      {/* WORKBOOK SCREEN */}

      {selectedWorkbook && (
        <View
          style={[
            styles.workbookScreen,
            {
              backgroundColor:
                colors.background,
            },
          ]}
        >
          <View
            style={
              styles.workbookScreenHeader
            }
          >
            <Pressable
              style={[
                styles.workbookBackButton,
                {
                  backgroundColor: "transparent",
                },
              ]}
              onPress={goHome}
            >
              <Ionicons
                name="arrow-back-outline"
                size={23}
                color={colors.text}
              />
            </Pressable>
            <Text
              style={[
                styles.workbookScreenTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {selectedWorkbook.name}
            </Text>

            <View
              style={
                styles.workbookHeaderActions
              }
            >
              <Pressable
                style={[
                  styles.smallAction,
                  {
                    backgroundColor: "transparent",
                  },
                ]}
                onPress={() =>
                  Alert.alert(
                    "Share",
                    "Sharing will be connected later."
                  )
                }
              >
                <Ionicons
                  name="share-outline"
                  size={20}
                  color={colors.text}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.smallAction,
                  {
                    backgroundColor: "transparent",
                  },
                ]}
                onPress={() =>
                  Alert.alert(
                    "Workbook options",
                    "Archive/delete options will be connected later."
                  )
                }
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={20}
                  color={colors.text}
                />                   
              </Pressable>
            </View>
          </View>

          <View
            style={[
              styles.locationTabsWrapper,
              {
                borderBottomColor:
                  colors.separator,
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.locationTabs
              }
            >
              <View
                style={[
                  styles.locationTab,
                  styles.locationTabActive,
                ]}
              >
                <Text
                  style={
                    styles.locationTabActiveText
                  }
                >
                  All
                </Text>
              </View>

              <View
                style={[
                  styles.locationTab,
                  {
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.locationTabText,
                    {
                      color:
                        colors.secondaryText,
                    },
                  ]}
                >
                  Home
                </Text>
              </View>

              <View
                style={[
                  styles.locationTab,
                  {
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.locationTabText,
                    {
                      color:
                        colors.secondaryText,
                    },
                  ]}
                >
                  Garage
                </Text>
              </View>

              <View
                style={[
                  styles.locationTab,
                  {
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.locationTabText,
                    {
                      color:
                        colors.secondaryText,
                    },
                  ]}
                >
                  Online
                </Text>
              </View>

              <View
                style={[
                  styles.locationTab,
                  {
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.locationTabText,
                    {
                      color:
                        colors.secondaryText,
                    },
                  ]}
                >
                  Unallocated
                </Text>
              </View>
            </ScrollView>
          </View>

          <ScrollView
            style={styles.taskScroll}
            contentContainerStyle={
              styles.taskList
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            {selectedTasks.length === 0 && (
              <View
                style={styles.emptyTasks}
              >
                <Text
                  style={[
                    styles.emptyTasksTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  No tasks yet
                </Text>

                <Text
                  style={[
                    styles.emptyTasksText,
                    {
                      color:
                        colors.secondaryText,
                    },
                  ]}
                >
                  Add your first task
                  using the + button
                  below.
                </Text>
              </View>
            )}

            {selectedTasks.map(
              (task, index) => (
                <React.Fragment
                  key={task.id}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.taskRow,
                      {
                        opacity:
                          pressed
                            ? 0.65
                            : 1,
                      },
                    ]}
                    onPress={() =>
                      openTask(task)
                    }
                  >
                    <StatusDot
                      status={
                        task.status
                      }
                    />

                    <Text
                      style={[
                        styles.taskName,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {task.name}
                    </Text>

                    <Text
                      style={[
                        styles.taskDate,
                        {
                          color:
                            colors.secondaryText,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {formatTaskDate(
                        task.date
                      )}
                    </Text>

                    <Text
                      style={[
                        styles.taskLocation,
                        {
                          color:
                            colors.secondaryText,
                        },
                        !task.location &&
                          styles.unallocatedText,
                      ]}
                      numberOfLines={1}
                    >
                      {task.location ??
                        "Unallocated"}
                    </Text>
                  </Pressable>

                  {index <
                    selectedTasks.length -
                      1 && (
                    <View
                      style={[
                        styles.taskSeparator,
                        {
                          backgroundColor:
                            colors.separator,
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
              )
            )}
          </ScrollView>

          <Pressable
            style={
              styles.workbookAddButton
            }
            onPress={() => {
              setTaskError("");
              setNewTaskName("");
              setNewTaskDate("");
              setNewTaskLocation("");
              setShowCreateTask(true);
            }}
          >
            <Ionicons
              name="add"
              size={23}
              color="#FFFFFF"
            />                
          </Pressable>
        </View>
      )}

      {/* WORKBOOK COLOR PICKER */}

      {showColorPicker && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.colorPickerBox,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <Text
              style={[
                styles.colorPickerTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Workbook color
            </Text>

            <View style={styles.colorPickerGrid}>
              <View style={styles.colorPickerRow}>
                <Pressable
                  style={styles.colorChoice}
                  onPress={() => {
                    if (colorPickerWorkbookId) {
                      changeWorkbookColor(
                        colorPickerWorkbookId,
                        "transparent"
                      );
                    }
                    setShowColorPicker(false);
                    setColorPickerWorkbookId(null);
                  }}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      styles.noColorCircle,
                      {
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.noColorLine,
                        {
                          backgroundColor:
                            colors.secondaryText,
                        },
                      ]}
                    />
                  </View>
                </Pressable>

                {[
                  "#B8D4F2",
                  "#B9DCC3",
                  "#F2C99F",
                  "#D2BDE8",
                ].map((color) => (
                  <Pressable
                    key={color}
                    style={styles.colorChoice}
                    onPress={() => {
                      if (colorPickerWorkbookId) {
                        changeWorkbookColor(
                          colorPickerWorkbookId,
                          color
                        );
                      }
                      setShowColorPicker(false);
                      setColorPickerWorkbookId(null);
                    }}
                  >
                    <View
                      style={[
                        styles.colorCircle,
                        {
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>

              <View style={styles.colorPickerRow}>
                {[
                  "#E8B6B6",
                  "#E6BFD0",
                  "#D0BBA6",
                  "#C5C9CE",
                  "#C2D6D0",
                ].map((color) => (
                  <Pressable
                    key={color}
                    style={styles.colorChoice}
                    onPress={() => {
                      if (colorPickerWorkbookId) {
                        changeWorkbookColor(
                          colorPickerWorkbookId,
                          color
                        );
                      }
                      setShowColorPicker(false);
                      setColorPickerWorkbookId(null);
                    }}
                  >
                    <View
                      style={[
                        styles.colorCircle,
                        {
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              style={[
                styles.colorPickerCancel,
                {
                  backgroundColor: colors.iconBackground,
                },
              ]}
              onPress={() => {
                setShowColorPicker(false);
                setColorPickerWorkbookId(null);
              }}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* CREATE WORKBOOK */}

      {showCreateWorkbook && (
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={[
              styles.createWorkbookBox,
              {
                backgroundColor:
                  colors.card,
              },
            ]}
          >
            <Text
              style={[
                styles.createWorkbookTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              New Workbook
            </Text>

            <TextInput
              style={[
                styles.workbookInput,
                {
                  color:
                    colors.text,
                  borderColor:
                    colors.border,
                  backgroundColor:
                    colors.inputBackground,
                },
              ]}
              placeholder="Workbook name"
              placeholderTextColor={
                colors.secondaryText
              }
              value={newWorkbookName}
              onChangeText={(text) => {
                setNewWorkbookName(text);
                setWorkbookError("");
              }}
              autoFocus
            />

            {workbookError !== "" && (
              <Text
                style={[
                  styles.errorText,
                  {
                    color:
                      colors.error,
                  },
                ]}
              >
                {workbookError}
              </Text>
            )}

            <View
              style={
                styles.modalButtons
              }
            >
              <Pressable
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      colors.iconBackground,
                  },
                ]}
                onPress={() => {
                  setNewWorkbookName("");
                  setWorkbookError("");
                  setShowCreateWorkbook(
                    false
                  );
                }}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  styles.createButton,
                ]}
                onPress={
                  createWorkbook
                }
              >
                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  Create
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* CREATE TASK */}

      {showCreateTask &&
        selectedWorkbook && (
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={[
                styles.createWorkbookBox,
                {
                  backgroundColor:
                    colors.card,
                },
              ]}
            >
              <Text
                style={[
                  styles.createWorkbookTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                New Task
              </Text>

              <TextInput
                style={[
                  styles.workbookInput,
                  {
                    color:
                      colors.text,
                    borderColor:
                      colors.border,
                    backgroundColor:
                      colors.inputBackground,
                  },
                ]}
                placeholder="Task name"
                placeholderTextColor={
                  colors.secondaryText
                }
                value={newTaskName}
                onChangeText={(text) => {
                  setNewTaskName(text);
                  setTaskError("");
                }}
                autoFocus
              />

              {taskError !== "" && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color:
                        colors.error,
                    },
                  ]}
                >
                  {taskError}
                </Text>
              )}

              <TextInput
                style={[
                  styles.workbookInput,
                  styles.additionalInput,
                  {
                    color:
                      colors.text,
                    borderColor:
                      colors.border,
                    backgroundColor:
                      colors.inputBackground,
                  },
                ]}
                placeholder="Due date (optional)"
                placeholderTextColor={
                  colors.secondaryText
                }
                value={newTaskDate}
                onChangeText={
                  setNewTaskDate
                }
              />

              <TextInput
                style={[
                  styles.workbookInput,
                  styles.additionalInput,
                  {
                    color:
                      colors.text,
                    borderColor:
                      colors.border,
                    backgroundColor:
                      colors.inputBackground,
                  },
                ]}
                placeholder="Location (optional)"
                placeholderTextColor={
                  colors.secondaryText
                }
                value={newTaskLocation}
                onChangeText={
                  setNewTaskLocation
                }
              />

              <View
                style={
                  styles.modalButtons
                }
              >
                <Pressable
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor:
                        colors.iconBackground,
                    },
                  ]}
                  onPress={() => {
                    setNewTaskName("");
                    setNewTaskDate("");
                    setNewTaskLocation("");
                    setTaskError("");
                    setShowCreateTask(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modalButton,
                    styles.createButton,
                  ]}
                  onPress={
                    createTask
                  }
                >
                  <Text
                    style={
                      styles.createButtonText
                    }
                  >
                    Create
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
    </SafeAreaView>
  );
}

function DetailSection({
  title,
  value,
  colors,
  italic = false,
}: {
  title: string;
  value: string;
  colors: {
    text: string;
    secondaryText: string;
    separator: string;
  };
  italic?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailSection,
        {
          borderTopColor:
            colors.separator,
        },
      ]}
    >
      <Text
        style={[
          styles.detailSectionTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.detailSectionValue,
          {
            color:
              colors.secondaryText,
          },
          italic &&
            styles.detailItalic,
        ]}
      >
        {value}
      </Text>
    </View>
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
      <View
        style={[
          styles.statusCircle,
          {
            backgroundColor:
              color,
          },
        ]}
      />

      <Text
        style={[
          styles.statusNumber,
          {
            color:
              textColor,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          styles.accessibilityLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function StatusDot({
  status,
}: {
  status: TaskStatus;
}) {
  const color =
    status === "red"
      ? "#E53935"
      : status === "orange"
      ? "#F39C12"
      : status === "blue"
      ? "#1976D2"
      : "#43A047";

  return (
    <View
      style={[
        styles.taskStatusDot,
        {
          backgroundColor:
            color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  /* PERMANENT TOP BAR */

  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  topIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  settingsIcon: {
    fontSize: 22,
    fontWeight: "500",
    textAlign: "center",
    includeFontPadding: false,
  },

  homeIcon: {
    fontSize: 24,
    fontWeight: "500",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 24,
    marginTop: 0,
  },

  searchIcon: {
    fontSize: 28,
    fontWeight: "400",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 28,
    marginTop: 0,
  },

  userArea: {
    flex: 1,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
    marginHorizontal: 7,
  },

  userName: {
    fontSize: 16,
    fontWeight: "600",
    fontStyle: "italic",
  },

  /* HOME */

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  headingRow: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 26,
  },

  heading: {
    fontSize: 25,
    fontWeight: "700",
    textAlign: "center",
  },

  addButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
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
    marginTop: 0,
  },

  workbookCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
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
    transform: [
      {
        translateY: -9,
      },
    ],
  },

  updateCircle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#F4C430",
    marginRight: 9,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.25)",
  },

  updateCircleHidden: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },

  workbookName: {
    fontSize: 21,
    fontWeight: "600",
    flexShrink: 1,
  },

  cardActions: {
    flexDirection: "row",
    gap: 7,
    transform: [
      {
        translateY: -9,
      },
    ],
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
    textAlign: "center",
    includeFontPadding: false,
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
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.25)",
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

  /* WORKBOOK */

  workbookScreen: {
    flex: 1,
  },
  workbookBackButton: {
    position: "absolute",
    left: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  workbookScreenHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
  },

  workbookScreenTitle: {
    flex: 1,
    fontSize: 25,
    fontWeight: "700",
    textAlign: "center",
  },

  workbookHeaderActions: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    gap: 7,
  },

  locationTabsWrapper: {
    borderBottomWidth: 1,
  },

  locationTabs: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },

  locationTab: {
    height: 29,
    paddingHorizontal: 11,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  locationTabActive: {
    backgroundColor: "#1976D2",
    borderColor: "#1976D2",
  },

  locationTabText: {
    fontSize: 12,
  },

  locationTabActiveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  taskScroll: {
    flex: 1,
  },

  taskList: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 80,
  },

  taskRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },

  taskStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.25)",
  },

  taskName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "400",
    marginRight: 10,
  },

  taskDate: {
    width: 92,
    fontSize: 13,
    marginRight: 10,
  },

  taskLocation: {
    width: 100,
    fontSize: 13,
  },

  unallocatedText: {
    fontStyle: "italic",
  },

  taskSeparator: {
    height:
      StyleSheet.hairlineWidth,
    marginHorizontal: -4,
  },

  emptyTasks: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 30,
    paddingHorizontal: 30,
  },

  emptyTasksTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  emptyTasksText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },

  workbookAddButton: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
  },

  workbookAddButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "300",
    marginTop: 0,
  },

  /* TASK DETAILS */

  detailsNavigation: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  detailsBackButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  backIcon: {
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 32,
    textAlign: "center",
    includeFontPadding: false,
    marginTop: 0,
  },

  detailsNavigationTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },

  detailsContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  detailsTitle: {
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 14,
  },

  detailSection: {
    borderTopWidth:
      StyleSheet.hairlineWidth,
    paddingVertical: 5,
  },

  detailSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 5,
  },

  detailSectionValue: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: "right",
  },

  detailItalic: {
    fontStyle: "italic",
  },

  historyPlaceholder: {
    fontSize: 15,
    lineHeight: 21,
  },

  /* WORKBOOK COLOR PICKER */

  colorPickerBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    padding: 22,
  },

  colorPickerTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 18,
  },

  colorPickerGrid: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
  },

  colorPickerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },

  colorChoice: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.18)",
  },

  noColorCircle: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  noColorLine: {
    position: "absolute",
    width: 34,
    height: 1.5,
    transform: [{ rotate: "-45deg" }],
  },

  colorPickerCancel: {
    alignSelf: "center",
    minWidth: 90,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 20,
  },

  /* MODALS */

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      "rgba(0, 0, 0, 0.35)",
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

  additionalInput: {
    marginTop: 10,
  },

  errorText: {
    fontSize: 13,
    marginTop: 7,
    marginLeft: 2,
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