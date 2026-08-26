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

type TaskStatus = "red" | "orange" | "blue" | "green";

type Task = {
  id: string;
  name: string;
  date?: string;
  location?: string;
  status: TaskStatus;
};

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

const initialTasks: Record<string, Task[]> = {
  "1": [
    {
      id: "home-1",
      name: "Clean the kitchen",
      date: "2026-08-26",
      location: "Kitchen",
      status: "orange",
    },
    {
      id: "home-2",
      name: "Buy light bulbs",
      date: "2026-08-27",
      location: "Home Depot",
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
      status: "red",
    },
  ],

  "2": [
    {
      id: "car-1",
      name: "Oil change",
      date: "2026-09-02",
      location: "Garage",
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

function formatTaskDate(date?: string) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

export default function App() {
  const systemScheme = useColorScheme();

  const [theme, setTheme] =
    useState<"system" | "light" | "dark">("system");

  const [workbooks, setWorkbooks] =
    useState<Workbook[]>(initialWorkbooks);

  const [tasksByWorkbook, setTasksByWorkbook] =
    useState<Record<string, Task[]>>(initialTasks);

  const [selectedWorkbookId, setSelectedWorkbookId] =
    useState<string | null>(null);

  const [showCreateWorkbook, setShowCreateWorkbook] =
    useState(false);

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

  const openWorkbook = (workbook: Workbook) => {
    setSelectedWorkbookId(workbook.id);

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
      setWorkbookError(
        "Workbook name is required."
      );
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
      setTaskError(
        "Task name is required."
      );
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

      {/* TOP BAR */}
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
        {/* Settings */}
        <Pressable
          style={[
            styles.topIconButton,
            {
              backgroundColor:
                colors.iconBackground,
            },
          ]}
          onPress={openSettings}
        >
          <Text
            style={[
              styles.settingsIcon,
              {
                color: colors.text,
              },
            ]}
          >
            ☰
          </Text>
        </Pressable>

        {/* Home */}
        <Pressable
          style={[
            styles.topIconButton,
            {
              backgroundColor:
                colors.iconBackground,
            },
          ]}
          onPress={goHome}
        >
          <Text
            style={[
              styles.homeIcon,
              {
                color: colors.text,
              },
            ]}
          >
            ⌂
          </Text>
        </Pressable>

        {/* Username */}
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

        {/* Search */}
        <Pressable
          style={[
            styles.topIconButton,
            {
              backgroundColor:
                colors.iconBackground,
            },
          ]}
          onPress={openSearch}
        >
          <Text
            style={[
              styles.searchIcon,
              {
                color: colors.text,
              },
            ]}
          >
            ⌕
          </Text>
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

            {/* New Workbook */}
            <Pressable
              style={
                styles.addButton
              }
              onPress={() => {
                setWorkbookError("");
                setNewWorkbookName("");
                setShowCreateWorkbook(true);
              }}
            >
              <Text
                style={
                  styles.addButtonText
                }
              >
                ＋
              </Text>
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
                    colors.card,
                  borderColor:
                    colors.border,
                  opacity:
                    pressed ? 0.75 : 1,
                },
              ]}
            >
              <View
                style={
                  styles.cardHeader
                }
              >
                <View
                  style={
                    styles.titleArea
                  }
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
                  {/* Share */}
                  <Pressable
                    style={[
                      styles.smallAction,
                      {
                        backgroundColor:
                          colors.iconBackground,
                      },
                    ]}
                    onPress={() =>
                      Alert.alert(
                        "Share",
                        "Sharing will be connected later."
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.actionText,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      ↗
                    </Text>
                  </Pressable>

                  {/* Options */}
                  <Pressable
                    style={[
                      styles.smallAction,
                      {
                        backgroundColor:
                          colors.iconBackground,
                      },
                    ]}
                    onPress={() =>
                      Alert.alert(
                        "Workbook options",
                        "Archive/delete options will be connected later."
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.actionText,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      ⋯
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View
                style={
                  styles.statusRow
                }
              >
                <StatusIndicator
                  color="#E53935"
                  value={workbook.red}
                  label="Overdue"
                  textColor={
                    colors.text
                  }
                />

                <StatusIndicator
                  color="#F39C12"
                  value={workbook.orange}
                  label="Due"
                  textColor={
                    colors.text
                  }
                />

                <StatusIndicator
                  color="#1976D2"
                  value={workbook.blue}
                  label="Upcoming"
                  textColor={
                    colors.text
                  }
                />

                <StatusIndicator
                  color="#43A047"
                  value={workbook.green}
                  label="Completed"
                  textColor={
                    colors.text
                  }
                />
              </View>
            </Pressable>
          ))}

          <View
            style={
              styles.footerSpace
            }
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
          {/* Workbook title */}
          <View
            style={
              styles.workbookScreenHeader
            }
          >
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
                    backgroundColor:
                      colors.iconBackground,
                  },
                ]}
                onPress={() =>
                  Alert.alert(
                    "Share",
                    "Sharing will be connected later."
                  )
                }
              >
                <Text
                  style={[
                    styles.actionText,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  ↗
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.smallAction,
                  {
                    backgroundColor:
                      colors.iconBackground,
                  },
                ]}
                onPress={() =>
                  Alert.alert(
                    "Workbook options",
                    "Workbook settings will be added later."
                  )
                }
              >
                <Text
                  style={[
                    styles.actionText,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  ⋯
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Location tabs */}
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

          {/* Task list */}
          <ScrollView
            style={
              styles.taskScroll
            }
            contentContainerStyle={
              styles.taskList
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            {selectedTasks.length === 0 && (
              <View
                style={
                  styles.emptyTasks
                }
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
                      Alert.alert(
                        task.name,
                        "Task details will be built next."
                      )
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

          {/* New Task */}
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
            <Text
              style={
                styles.workbookAddButtonText
              }
            >
              ＋
            </Text>
          </Pressable>
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
              value={
                newWorkbookName
              }
              onChangeText={(text) => {
                setNewWorkbookName(
                  text
                );
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
                  setNewWorkbookName(
                    ""
                  );
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
                value={
                  newTaskLocation
                }
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
                    setShowCreateTask(
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

  topBar: {
    height: 76,
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
    marginTop: -7,
  },

  searchIcon: {
    fontSize: 28,
    fontWeight: "400",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 28,
    marginTop: -5,
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
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  headingRow: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    minHeight: 32,
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
    marginTop: -2,
  },

  workbookCard: {
    borderRadius: 18,
    borderWidth: 1,
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
    justifyContent:
      "space-between",
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
  },

  updateCircleHidden: {
    backgroundColor:
      "transparent",
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
    justifyContent:
      "center",
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

  /* Workbook screen */

  workbookScreen: {
    flex: 1,
  },

  workbookScreenHeader: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
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
    backgroundColor:
      "#1976D2",
    borderColor:
      "#1976D2",
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
    justifyContent:
      "flex-start",
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
    backgroundColor:
      "#1976D2",
    alignItems: "center",
    justifyContent: "center",
  },

  workbookAddButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "300",
    marginTop: -2,
  },

  /* Modals */

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
    justifyContent:
      "flex-end",
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
    backgroundColor:
      "#1976D2",
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});