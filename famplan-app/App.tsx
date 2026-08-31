import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from "react-native";

type TaskStatus = "red" | "orange" | "blue" | "green";

type TaskHistoryRecord = {
  date: string;
  report: string;
};

type Task = {
  id: string;
  name: string;
  date?: string;
  location?: string;
  description?: string;
  repetition?: string;
  prewarning?: string;
  repeatValue?: string;
  repeatUnit?: "days" | "weeks" | "months" | "years";
  reminderDate?: string;
  reminderTime?: string;
  reminderDaily?: boolean;
  status: TaskStatus;
  history?: TaskHistoryRecord[];
  hasUpdate?: boolean;
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
      history: [
        {
          date: "2026-08-28",
          report: "Kitchen cleaned completely.",
        },
        {
          date: "2026-08-20",
          report: "Cleaned kitchen and checked supplies.",
        },
      ],
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

function calculateNextDue(
  date?: string,
  repeatValue?: string,
  repeatUnit?: "days" | "weeks" | "months" | "years"
) {
  if (!date || !repeatValue) {
    return "";
  }

  const amount = Number(repeatValue);
  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  const parts = date.split("-").map(Number);
  if (
    parts.length !== 3 ||
    parts.some((part) => !Number.isFinite(part))
  ) {
    return "";
  }

  const [year, month, day] = parts;
  const nextDate = new Date(year, month - 1, day);

  if (
    nextDate.getFullYear() !== year ||
    nextDate.getMonth() !== month - 1 ||
    nextDate.getDate() !== day
  ) {
    return "";
  }

  if (repeatUnit === "days") {
    nextDate.setDate(nextDate.getDate() + amount);
  } else if (repeatUnit === "weeks") {
    nextDate.setDate(nextDate.getDate() + amount * 7);
  } else if (repeatUnit === "months") {
    const originalDay = nextDate.getDate();
    nextDate.setDate(1);
    nextDate.setMonth(nextDate.getMonth() + amount);
    const lastDay = new Date(
      nextDate.getFullYear(),
      nextDate.getMonth() + 1,
      0
    ).getDate();
    nextDate.setDate(Math.min(originalDay, lastDay));
  } else if (repeatUnit === "years") {
    const originalMonth = nextDate.getMonth();
    const originalDay = nextDate.getDate();
    nextDate.setDate(1);
    nextDate.setFullYear(nextDate.getFullYear() + amount);
    nextDate.setMonth(originalMonth);
    const lastDay = new Date(
      nextDate.getFullYear(),
      originalMonth + 1,
      0
    ).getDate();
    nextDate.setDate(Math.min(originalDay, lastDay));
  }

  return nextDate.toLocaleDateString();
}

const FLOATING_WINDOW_MAX_HEIGHT =
  Math.floor(Dimensions.get("window").height * 0.80);

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
  const [selectedLocation, setSelectedLocation] =
    useState<string>("All");

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
  const [showNewTaskDatePicker, setShowNewTaskDatePicker] =
    useState(false);
  const [showNewTaskReminderDatePicker, setShowNewTaskReminderDatePicker] =
    useState(false);

  const [newTaskLocation, setNewTaskLocation] =
    useState("");

  const [newTaskPrewarning, setNewTaskPrewarning] = useState("");
  const [newTaskRepeatValue, setNewTaskRepeatValue] = useState("");
  const [newTaskRepeatUnit, setNewTaskRepeatUnit] =
    useState<"days" | "weeks" | "months" | "years">("months");
  const [newTaskReminderDate, setNewTaskReminderDate] = useState("");
  const [newTaskReminderTime, setNewTaskReminderTime] = useState("");
  const [showNewTaskReminderTimePicker, setShowNewTaskReminderTimePicker] =
    useState(false);
  const [newTaskReminderDaily, setNewTaskReminderDaily] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDescriptionHeight, setNewTaskDescriptionHeight] =
    useState(72);
  const [newTaskContentHeight, setNewTaskContentHeight] =
    useState(0);

  const [isEditingTask, setIsEditingTask] =
    useState(false);
  const [showTaskHistory, setShowTaskHistory] =
    useState(false);
  const [showTaskRecord, setShowTaskRecord] =
    useState(false);
  const [selectedHistoryRecord, setSelectedHistoryRecord] =
    useState<TaskHistoryRecord | null>(null);
  const [showRecordEdit, setShowRecordEdit] = useState(false);
  const [recordEditDate, setRecordEditDate] = useState("");
  const [recordEditReport, setRecordEditReport] = useState("");
  const [recordEditDateError, setRecordEditDateError] = useState("");
  const [showRecordEditDatePicker, setShowRecordEditDatePicker] =
    useState(false);
  const [showCompleteTask, setShowCompleteTask] =
    useState(false);
  const [completionDate, setCompletionDate] =
    useState("");
  const [completionReport, setCompletionReport] =
    useState("");
  const [completionDateError, setCompletionDateError] =
    useState("");
  const [showCompletionDatePicker, setShowCompletionDatePicker] =
    useState(false);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskLocation, setEditTaskLocation] = useState("");
  const [editTaskDate, setEditTaskDate] = useState("");
  const [showEditTaskDatePicker, setShowEditTaskDatePicker] =
    useState(false);
  const [editTaskPrewarning, setEditTaskPrewarning] = useState("");
  const [editPrewarningError, setEditPrewarningError] = useState("");
  const [newPrewarningError, setNewPrewarningError] = useState("");
  const [editTaskRepeatValue, setEditTaskRepeatValue] = useState("");
  const [editTaskRepeatUnit, setEditTaskRepeatUnit] =
    useState<"days" | "weeks" | "months" | "years">("months");
  const [editTaskReminderDate, setEditTaskReminderDate] = useState("");
  const [showEditTaskReminderDatePicker, setShowEditTaskReminderDatePicker] =
    useState(false);
  const [editTaskReminderTime, setEditTaskReminderTime] = useState("");
  const [showEditTaskReminderTimePicker, setShowEditTaskReminderTimePicker] =
    useState(false);
  const [editTaskReminderDaily, setEditTaskReminderDaily] = useState(false);
  const [editTaskDescription, setEditTaskDescription] = useState("");

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

  const workbookTasks = useMemo(() => {
    if (!selectedWorkbookId) {
      return [];
    }

    return tasksByWorkbook[selectedWorkbookId] ?? [];
  }, [selectedWorkbookId, tasksByWorkbook]);

  const workbookLocations = useMemo(() => {
    const locationData = new Map<
      string,
      { label: string; count: number; order: number }
    >();
    let order = 0;

    workbookTasks.forEach((task) => {
      const location = task.location?.trim();
      const key = location ? location.toLowerCase() : "__unallocated__";
      const label = location || "Unallocated";
      const existing = locationData.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        locationData.set(key, {
          label,
          count: 1,
          order: order++,
        });
      }
    });

    const sortedLocations = [...locationData.values()].sort(
      (a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return a.order - b.order;
      }
    );

    const unallocated = locationData.get("__unallocated__");

    return {
      locations: sortedLocations
        .filter((item) => item.label !== "Unallocated")
        .map((item) => item.label),
      hasUnallocated: Boolean(unallocated),
      unallocatedCount: unallocated?.count ?? 0,
      sortedLocations,
    };
  }, [workbookTasks]);

  const selectedTasks = useMemo(() => {
    const filtered =
      selectedLocation === "All"
        ? workbookTasks
        : selectedLocation === "Unallocated"
          ? workbookTasks.filter(
              (task) => !task.location?.trim()
            )
          : workbookTasks.filter(
              (task) =>
                task.location?.trim().toLowerCase() ===
                selectedLocation.toLowerCase()
            );

    const statusPriority: Record<TaskStatus, number> = {
      red: 0,
      orange: 1,
      blue: 2,
      green: 3,
    };

    return [...filtered].sort((a, b) => {
      const updatePriority =
        Number(Boolean(b.hasUpdate)) -
        Number(Boolean(a.hasUpdate));

      if (updatePriority !== 0) return updatePriority;

      const statusDifference =
        statusPriority[a.status] - statusPriority[b.status];

      if (statusDifference !== 0) return statusDifference;

      return parseTaskDate(a.date) - parseTaskDate(b.date);
    });
  }, [workbookTasks, selectedLocation]);


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
    setSelectedLocation("All");

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
    setIsEditingTask(false);

    if (task.hasUpdate && selectedWorkbookId) {
      setTasksByWorkbook((current) => ({
        ...current,
        [selectedWorkbookId]: (current[selectedWorkbookId] ?? []).map(
          (item) =>
            item.id === task.id
              ? { ...item, hasUpdate: false }
              : item
        ),
      }));
    }
    setEditTaskName(task.name);
    setEditTaskLocation(task.location ?? "");
    setEditTaskDate(task.date ?? "");
    setEditTaskPrewarning(task.prewarning ?? "");
    setEditPrewarningError("");
    setEditTaskRepeatValue(task.repeatValue ?? "");
    setEditTaskRepeatUnit(task.repeatUnit ?? "months");
    setEditTaskReminderDate(task.reminderDate ?? "");
    setEditTaskReminderTime(task.reminderTime ?? "");
    setEditTaskReminderDaily(task.reminderDaily ?? false);
    setEditTaskDescription(task.description ?? "");
  };

  const cancelTaskEdit = () => {
    if (selectedTask) {
      setEditTaskName(selectedTask.name);
      setEditTaskLocation(selectedTask.location ?? "");
      setEditTaskDate(selectedTask.date ?? "");
      setEditTaskPrewarning(selectedTask.prewarning ?? "");
      setEditPrewarningError("");
      setEditTaskRepeatValue(selectedTask.repeatValue ?? "");
      setEditTaskRepeatUnit(selectedTask.repeatUnit ?? "months");
      setEditTaskReminderDate(selectedTask.reminderDate ?? "");
      setEditTaskReminderTime(selectedTask.reminderTime ?? "");
      setEditTaskReminderDaily(selectedTask.reminderDaily ?? false);
      setEditTaskDescription(selectedTask.description ?? "");
    }
    setIsEditingTask(false);
  };

  const saveTaskEdit = () => {
    if (!selectedWorkbookId || !selectedTaskId) {
      return;
    }

    const name = editTaskName.trim();

    if (!name) {
      Alert.alert("Task name", "Task name is required.");
      return;
    }

    if (!isValidPrewarning(editTaskPrewarning)) {
      setEditPrewarningError("Prewarning not less than 1 day");
      return;
    }

    setEditPrewarningError("");

    setTasksByWorkbook((current) => ({
      ...current,
      [selectedWorkbookId]: (current[selectedWorkbookId] ?? []).map(
        (task) =>
          task.id === selectedTaskId
            ? {
                ...task,
                name,
                location: editTaskLocation.trim() || undefined,
                date: editTaskDate.trim() || undefined,
                prewarning: editTaskPrewarning.trim() || undefined,
                repeatValue: editTaskRepeatValue.trim() || undefined,
                repeatUnit:
                  editTaskRepeatValue.trim()
                    ? editTaskRepeatUnit
                    : undefined,
                reminderDate:
                  editTaskReminderDate.trim() || undefined,
                reminderTime:
                  editTaskReminderTime.trim() || undefined,
                reminderDaily:
                  editTaskReminderDate.trim() ||
                  editTaskReminderTime.trim()
                    ? editTaskReminderDaily
                    : undefined,
                description:
                  editTaskDescription.trim() || undefined,
              }
            : task
      ),
    }));

    setIsEditingTask(false);
  };

  const openCompleteTask = () => {
    const today = new Date();
    const localToday =
      `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;

    setCompletionDate(localToday);
    setCompletionReport("");
    setCompletionDateError("");
    setShowCompleteTask(true);
  };

  const validateCompletionDate = () => {
    const value = completionDate.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setCompletionDateError(
        "Enter a valid date in YYYY-MM-DD format."
      );
      return false;
    }

    const [year, month, day] = value
      .split("-")
      .map(Number);

    const enteredDate = new Date(
      year,
      month - 1,
      day
    );

    if (
      enteredDate.getFullYear() !== year ||
      enteredDate.getMonth() !== month - 1 ||
      enteredDate.getDate() !== day
    ) {
      setCompletionDateError("Enter a valid date.");
      return false;
    }

    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (enteredDate > today) {
      setCompletionDateError(
        "Date of completion cannot be in the future."
      );
      return false;
    }

    setCompletionDateError("");
    return true;
  };

  const completeSelectedTask = () => {
    if (!selectedWorkbookId || !selectedTaskId || !selectedTask) {
      return;
    }

    if (!validateCompletionDate()) {
      return;
    }

    const completionDateValue = completionDate.trim();
    const completionRecord: TaskHistoryRecord = {
      date: completionDateValue,
      report: completionReport.trim(),
    };

    const repeatValue = selectedTask.repeatValue?.trim() ?? "";
    const repeatUnit = selectedTask.repeatUnit;
    const nextDue = calculateNextDue(
      completionDateValue,
      repeatValue,
      repeatUnit
    );

    const isRepeating =
      repeatValue !== "" &&
      !!repeatUnit &&
      nextDue !== "";

    if (isRepeating) {
      const newTaskId = Date.now().toString();
      const newTask: Task = {
        ...selectedTask,
        id: newTaskId,
        date: nextDue,
        history: [
          ...(selectedTask.history ?? []),
          completionRecord,
        ],
      };

      setTasksByWorkbook((current) => ({
        ...current,
        [selectedWorkbookId]: [
          ...(current[selectedWorkbookId] ?? [])
            .filter((task) => task.id !== selectedTaskId),
          newTask,
        ],
      }));

      setSelectedTaskId(newTaskId);
    } else {
      setTasksByWorkbook((current) => ({
        ...current,
        [selectedWorkbookId]: (
          current[selectedWorkbookId] ?? []
        ).filter((task) => task.id !== selectedTaskId),
      }));

      setSelectedTaskId(null);
    }

    setShowCompleteTask(false);
    setIsEditingTask(false);
    setSelectedTaskId(null);
  };

  const closeCompleteTask = () => {
    setShowCompleteTask(false);
  };

  const openTaskHistory = () => {
    setShowTaskHistory(true);
  };

  const closeTaskHistory = () => {
    setShowTaskHistory(false);
  };

  const openTaskRecord = (record: TaskHistoryRecord) => {
    setSelectedHistoryRecord(record);
    setShowTaskRecord(true);
  };

  const closeTaskRecord = () => {
    setShowTaskRecord(false);
    setSelectedHistoryRecord(null);
  };

  const openRecordEdit = () => {
    if (!selectedHistoryRecord) return;
    setRecordEditDate(selectedHistoryRecord.date);
    setRecordEditReport(selectedHistoryRecord.report);
    setRecordEditDateError("");
    setShowRecordEdit(true);
  };

  const closeRecordEdit = () => {
    setShowRecordEdit(false);
    setRecordEditDateError("");
  };

  const saveRecordEdit = () => {
    if (!selectedWorkbookId || !selectedTaskId || !selectedHistoryRecord) return;

    const value = recordEditDate.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setRecordEditDateError("Enter a valid date in YYYY-MM-DD format.");
      return;
    }

    const [year, month, day] = value.split("-").map(Number);
    const enteredDate = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (
      enteredDate.getFullYear() !== year ||
      enteredDate.getMonth() !== month - 1 ||
      enteredDate.getDate() !== day
    ) {
      setRecordEditDateError("Enter a valid date.");
      return;
    }

    if (enteredDate > today) {
      setRecordEditDateError("Date of completion cannot be in the future.");
      return;
    }

    const oldRecord = selectedHistoryRecord;

    setTasksByWorkbook((current) => ({
      ...current,
      [selectedWorkbookId]: (current[selectedWorkbookId] ?? []).map((task) =>
        task.id !== selectedTaskId
          ? task
          : {
              ...task,
              history: (task.history ?? []).map((record) =>
                record === oldRecord
                  ? { date: value, report: recordEditReport.trim() }
                  : record
              ),
            }
      ),
    }));

    setSelectedHistoryRecord({
      date: value,
      report: recordEditReport.trim(),
    });
    setShowRecordEdit(false);
    setRecordEditDateError("");
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

  const getStoredTimeValue = (value?: string) => {
    const now = new Date();

    if (value && /^\d{2}:\d{2}$/.test(value)) {
      const [hour, minute] = value.split(":").map(Number);

      if (
        hour >= 0 &&
        hour <= 23 &&
        minute >= 0 &&
        minute <= 59
      ) {
        now.setHours(hour, minute, 0, 0);
      }
    }

    return now;
  };

  const formatTimeForStorage = (date: Date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;

  const getStoredDateValue = (value?: string) => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(year, month - 1, day);

      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    return new Date();
  };

  const getNewTaskDateValue = () => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(newTaskDate)) {
      const [year, month, day] = newTaskDate
        .split("-")
        .map(Number);
      const date = new Date(year, month - 1, day);

      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    return new Date();
  };

  const formatDateForStorage = (date: Date) =>
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const getNextDuePreview = () => {
    return calculateNextDue(
      newTaskDate,
      newTaskRepeatValue,
      newTaskRepeatUnit
    );
  };

  const resetNewTaskForm = () => {
    setNewTaskName("");
    setNewTaskDate("");
    setShowNewTaskDatePicker(false);
    setNewTaskLocation("");
    setNewTaskPrewarning("");
    setNewTaskRepeatValue("");
    setNewTaskRepeatUnit("months");
    setNewTaskReminderDate("");
    setNewTaskReminderTime("");
    setNewTaskReminderDaily(false);
    setNewTaskDescription("");
    setNewTaskDescriptionHeight(72);
    setNewTaskContentHeight(0);
    setTaskError("");
    setNewPrewarningError("");
  };

  const isValidPrewarning = (value: string) => {
    const trimmed = value.trim();

    if (trimmed === "") {
      return true;
    }

    return /^\d+$/.test(trimmed) && Number(trimmed) >= 1;
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

    if (!isValidPrewarning(newTaskPrewarning)) {
      setNewPrewarningError("Prewarning not less than 1 day");
      return;
    }

    setNewPrewarningError("");

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
      prewarning:
        newTaskPrewarning.trim() || undefined,
      repeatValue:
        newTaskRepeatValue.trim() || undefined,
      repeatUnit:
        newTaskRepeatValue.trim()
          ? newTaskRepeatUnit
          : undefined,
      reminderDate:
        newTaskReminderDate.trim() || undefined,
      reminderTime:
        newTaskReminderTime.trim() || undefined,
      reminderDaily:
        newTaskReminderDate.trim() ||
        newTaskReminderTime.trim()
          ? newTaskReminderDaily
          : undefined,
      description:
        newTaskDescription.trim() || undefined,
      status: "orange",
    };

    setTasksByWorkbook((current) => ({
      ...current,
      [selectedWorkbookId]: [
        ...(current[selectedWorkbookId] ?? []),
        task,
      ],
    }));

    resetNewTaskForm();
    setShowCreateTask(false);
  };


  const renderTaskDetailsWindow = () => {
    if (!selectedTask || !selectedWorkbook) {
      return null;
    }

    const displayName = isEditingTask
      ? editTaskName
      : selectedTask.name;
    const displayLocation = isEditingTask
      ? editTaskLocation
      : selectedTask.location ?? "";
    const displayDate = isEditingTask
      ? editTaskDate
      : selectedTask.date ?? "";
    const displayPrewarning = isEditingTask
      ? editTaskPrewarning
      : selectedTask.prewarning ?? "";
    const displayRepeatValue = isEditingTask
      ? editTaskRepeatValue
      : selectedTask.repeatValue ?? "";
    const displayRepeatUnit = isEditingTask
      ? editTaskRepeatUnit
      : selectedTask.repeatUnit ?? "months";
    const displayDescription = isEditingTask
      ? editTaskDescription
      : selectedTask.description ?? "";
    const displayReminderDate = isEditingTask
      ? editTaskReminderDate
      : selectedTask.reminderDate ?? "";
    const displayReminderTime = isEditingTask
      ? editTaskReminderTime
      : selectedTask.reminderTime ?? "";
    const displayReminderDaily = isEditingTask
      ? editTaskReminderDaily
      : selectedTask.reminderDaily ?? false;

    const nextDue = calculateNextDue(
      displayDate,
      displayRepeatValue,
      displayRepeatUnit
    );

    const descriptionLines = Math.max(
      1,
      Math.ceil((displayDescription || "").length / 42)
    );
    const nameLines = Math.max(1, Math.ceil(displayName.length / 34));
    const locationLines = Math.max(
      1,
      Math.ceil(displayLocation.length / 24)
    );

    const taskInformationHeight =
      330 +
      Math.max(nameLines - 1, 0) * 20 +
      Math.max(locationLines - 1, 0) * 20 +
      Math.min(descriptionLines, 10) * 20;

    const readOnlyTaskWindowHeight = Math.min(
      FLOATING_WINDOW_MAX_HEIGHT,
      Math.max(390, taskInformationHeight)
    );

    return (
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={[
                styles.createTaskBox,
                styles.taskDetailsWindow,
                {
                  backgroundColor: colors.card,
                  height: isEditingTask
                    ? FLOATING_WINDOW_MAX_HEIGHT
                    : readOnlyTaskWindowHeight,
                },
              ]}
            >
              <View
                style={[
                  styles.taskModalHeader,
                  { borderBottomColor: colors.separator },
                ]}
              >
                <Text
                  style={[
                    styles.createWorkbookTitle,
                    {
                      color: colors.text,
                      marginBottom: 0,
                    },
                  ]}
                >
                  {isEditingTask ? "Edit Task" : "Task"}
                </Text>

                <View style={styles.taskHeaderActions}>
                  {!isEditingTask && (
                    <>
                      <Pressable
                        style={styles.taskHeaderIconButton}
                        onPress={() => setIsEditingTask(true)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={21}
                          color={colors.text}
                        />
                      </Pressable>

                      <Pressable
                        style={styles.taskHeaderIconButton}
                        onPress={openTaskHistory}
                      >
                        <Ionicons
                          name="time-outline"
                          size={21}
                          color={colors.text}
                        />
                      </Pressable>

                      <View style={styles.taskHeaderActionSpacer} />
                    </>
                  )}

                  <Pressable
                    style={styles.taskCloseButtonSmall}
                    onPress={
                      isEditingTask
                        ? cancelTaskEdit
                        : goBackToWorkbook
                    }
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                style={styles.taskDetailsScroll}
                contentContainerStyle={styles.createTaskScrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
              >
                {isEditingTask ? (
                  <>
                    <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                      Task name *
                    </Text>
                    <TextInput
                      style={[
                        styles.workbookInput,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.inputBackground,
                        },
                      ]}
                      value={editTaskName}
                      onChangeText={setEditTaskName}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                      Location
                    </Text>
                    <TextInput
                      style={[
                        styles.workbookInput,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.inputBackground,
                        },
                      ]}
                      placeholder="Location (optional)"
                      placeholderTextColor={colors.secondaryText}
                      value={editTaskLocation}
                      onChangeText={setEditTaskLocation}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                      Due date
                    </Text>
                    <Pressable
                      style={[
                        styles.workbookInput,
                        styles.newTaskDatePickerField,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.inputBackground,
                        },
                      ]}
                      onPress={() =>
                        setShowEditTaskDatePicker((current) => !current)
                      }
                    >
                      <Text
                        style={[
                          styles.newTaskDatePickerText,
                          {
                            color: editTaskDate
                              ? colors.text
                              : colors.secondaryText,
                          },
                        ]}
                      >
                        {editTaskDate
                          ? formatTaskDate(editTaskDate)
                          : "Select date (optional)"}
                      </Text>
                      <Ionicons
                        name="calendar-outline"
                        size={19}
                        color={colors.secondaryText}
                      />
                    </Pressable>
                    {showEditTaskDatePicker && (
                      <View
                        style={[
                          styles.newTaskDatePickerContainer,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.inputBackground,
                          },
                        ]}
                      >
                        <DateTimePicker
                          value={getStoredDateValue(editTaskDate)}
                          mode="date"
                          display={Platform.OS === "ios" ? "inline" : "calendar"}
                          onChange={(event, date) => {
                            if (Platform.OS === "android") {
                              setShowEditTaskDatePicker(false);
                            }
                            if (date) {
                              setEditTaskDate(formatDateForStorage(date));
                            }
                          }}
                        />
                        <View style={styles.datePickerActionRow}>
                          <Pressable
                            style={styles.newTaskDateDoneButton}
                            onPress={() => setEditTaskDate("")}
                          >
                            <Text
                              style={[
                                styles.newTaskDateDoneText,
                                { color: colors.secondaryText },
                              ]}
                            >
                              Clear
                            </Text>
                          </Pressable>
                          <Pressable
                            style={styles.newTaskDateDoneButton}
                            onPress={() => setShowEditTaskDatePicker(false)}
                          >
                            <Text
                              style={[
                                styles.newTaskDateDoneText,
                                { color: colors.text },
                              ]}
                            >
                              Done
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}

                    {editTaskDate.trim() !== "" && (
                      <>
                        <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                          Prewarning
                        </Text>
                        <View style={styles.inlineFieldRow}>
                          <TextInput
                            style={[
                              styles.compactNumberInput,
                              {
                                color: colors.text,
                                borderColor: colors.border,
                                backgroundColor: colors.inputBackground,
                              },
                            ]}
                            placeholder="-"
                            placeholderTextColor={colors.secondaryText}
                            value={editTaskPrewarning}
                            onChangeText={(value) => {
                              setEditTaskPrewarning(value);
                              setEditPrewarningError("");
                            }}
                            keyboardType="number-pad"
                          />
                          <Text style={[styles.inlineFieldText, { color: colors.text }]}>
                            days before due date
                          </Text>
                        </View>
                        {editPrewarningError ? (
                          <Text
                            style={[
                              styles.prewarningErrorText,
                              { color: colors.error },
                            ]}
                          >
                            {editPrewarningError}
                          </Text>
                        ) : null}
                      </>
                    )}

                    <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                      Repeat interval
                    </Text>
                    <View style={styles.inlineFieldRow}>
                      <TextInput
                        style={[
                          styles.compactNumberInput,
                          {
                            color: colors.text,
                            borderColor: colors.border,
                            backgroundColor: colors.inputBackground,
                          },
                        ]}
                        placeholder="—"
                        placeholderTextColor={colors.secondaryText}
                        value={editTaskRepeatValue}
                        onChangeText={setEditTaskRepeatValue}
                        keyboardType="number-pad"
                      />
                      <View style={styles.repeatUnitRow}>
                        {(["days", "weeks", "months", "years"] as const).map(
                          (unit) => (
                            <Pressable
                              key={unit}
                              style={[
                                styles.repeatUnitButton,
                                {
                                  borderColor: colors.border,
                                  backgroundColor:
                                    editTaskRepeatUnit === unit
                                      ? colors.iconBackground
                                      : "transparent",
                                },
                              ]}
                              onPress={() => setEditTaskRepeatUnit(unit)}
                            >
                              <Text style={[styles.repeatUnitText, { color: colors.text }]}>
                                {unit}
                              </Text>
                            </Pressable>
                          )
                        )}
                      </View>
                    </View>

                    <View style={styles.nextDueRow}>
                      <Text style={[styles.nextDueLabel, { color: colors.secondaryText }]}>
                        Next Due:
                      </Text>
                      <Text style={[styles.nextDueValue, { color: colors.text }]}>
                        {nextDue}
                      </Text>
                    </View>

                    {showEditTaskReminderTimePicker && (
                      <View
                        style={[
                          styles.newTaskDatePickerContainer,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.inputBackground,
                          },
                        ]}
                      >
                        <DateTimePicker
                          value={getStoredTimeValue(editTaskReminderTime)}
                          mode="time"
                          display={Platform.OS === "ios" ? "spinner" : "clock"}
                          onChange={(event, date) => {
                            if (Platform.OS === "android") {
                              setShowEditTaskReminderTimePicker(false);
                            }
                            if (date) {
                              setEditTaskReminderTime(
                                formatTimeForStorage(date)
                              );
                            }
                          }}
                        />
                        <Pressable
                          style={styles.newTaskDateDoneButton}
                          onPress={() =>
                            setShowEditTaskReminderTimePicker(false)
                          }
                        >
                          <Text
                            style={[
                              styles.newTaskDateDoneText,
                              { color: colors.text },
                            ]}
                          >
                            Done
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                      Description
                    </Text>
                    <TextInput
                      style={[
                        styles.workbookInput,
                        styles.taskDescriptionInput,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.inputBackground,
                          height: editTaskDescription ? 144 : 72,
                        },
                      ]}
                      placeholder="Description (optional)"
                      placeholderTextColor={colors.secondaryText}
                      value={editTaskDescription}
                      onChangeText={setEditTaskDescription}
                      multiline
                      scrollEnabled={true}
                      textAlignVertical="top"
                    />

                    <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                      Custom reminder
                    </Text>
                    <View style={styles.reminderRow}>
                      <Pressable
                        style={[
                          styles.reminderDateInput,
                          styles.datePickerCompactField,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.inputBackground,
                          },
                        ]}
                        onPress={() =>
                          setShowEditTaskReminderDatePicker((current) => !current)
                        }
                      >
                        <Text
                          style={[
                            styles.datePickerCompactText,
                            {
                              color: editTaskReminderDate
                                ? colors.text
                                : colors.secondaryText,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {editTaskReminderDate
                            ? formatTaskDate(editTaskReminderDate)
                            : "Date"}
                        </Text>
                        <Ionicons
                          name="calendar-outline"
                          size={17}
                          color={colors.secondaryText}
                        />
                      </Pressable>
                      <Pressable
                        style={[
                          styles.reminderTimeInput,
                          styles.datePickerCompactField,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.inputBackground,
                          },
                        ]}
                        onPress={() =>
                          setShowEditTaskReminderTimePicker((current) => !current)
                        }
                      >
                        <Text
                          style={[
                            styles.datePickerCompactText,
                            {
                              color: editTaskReminderTime
                                ? colors.text
                                : colors.secondaryText,
                            },
                          ]}
                        >
                          {editTaskReminderTime || "Time"}
                        </Text>
                        <Ionicons
                          name="time-outline"
                          size={17}
                          color={colors.secondaryText}
                        />
                      </Pressable>
                      <Pressable
                        style={styles.dailyToggle}
                        onPress={() =>
                          setEditTaskReminderDaily((current) => !current)
                        }
                      >
                        <Ionicons
                          name={
                            editTaskReminderDaily
                              ? "checkbox-outline"
                              : "square-outline"
                          }
                          size={22}
                          color={colors.text}
                        />
                        <Text style={[styles.dailyToggleText, { color: colors.text }]}>
                          Daily
                        </Text>
                      </Pressable>
                    </View>
                    {showEditTaskReminderDatePicker && (
                      <View
                        style={[
                          styles.newTaskDatePickerContainer,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.inputBackground,
                          },
                        ]}
                      >
                        <DateTimePicker
                          value={getStoredDateValue(editTaskReminderDate)}
                          mode="date"
                          display={Platform.OS === "ios" ? "inline" : "calendar"}
                          onChange={(event, date) => {
                            if (Platform.OS === "android") {
                              setShowEditTaskReminderDatePicker(false);
                            }
                            if (date) {
                              setEditTaskReminderDate(
                                formatDateForStorage(date)
                              );
                            }
                          }}
                        />
                        <View style={styles.datePickerActionRow}>
                          <Pressable
                            style={styles.newTaskDateDoneButton}
                            onPress={() => setEditTaskReminderDate("")}
                          >
                            <Text
                              style={[
                                styles.newTaskDateDoneText,
                                { color: colors.secondaryText },
                              ]}
                            >
                              Clear
                            </Text>
                          </Pressable>
                          <Pressable
                            style={styles.newTaskDateDoneButton}
                            onPress={() =>
                              setShowEditTaskReminderDatePicker(false)
                            }
                          >
                            <Text
                              style={[
                                styles.newTaskDateDoneText,
                                { color: colors.text },
                              ]}
                            >
                              Done
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.taskInfoRow}>
                      <View style={styles.taskInfoColumn}>
                        <Text style={[styles.taskInfoLabel, { color: colors.secondaryText }]}>
                          Name
                        </Text>
                        <Text
                          style={[styles.taskInfoValue, { color: colors.text }]}
                        >
                          {displayName}
                        </Text>
                      </View>

                      <View style={styles.taskInfoColumnRight}>
                        <Text style={[styles.taskInfoLabel, { color: colors.secondaryText }]}>
                          Location
                        </Text>
                        <Text
                          style={[
                            styles.taskInfoValue,
                            {
                              color: displayLocation
                                ? colors.text
                                : colors.secondaryText,
                            },
                          ]}
                        >
                          {displayLocation ? (
                        displayLocation
                      ) : (
                        <Text
                          style={[
                            styles.notDefinedText,
                            { color: colors.text },
                          ]}
                        >
                          not defined
                        </Text>
                      )}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.taskInfoRow}>
                      <View style={styles.taskInfoColumn}>
                        <Text style={[styles.taskInfoLabel, { color: colors.secondaryText }]}>
                          Due date
                        </Text>
                        <Text style={[styles.taskInfoValue, { color: colors.text }]}>
                          {displayDate ? (
                            formatTaskDate(displayDate)
                          ) : (
                            <Text style={styles.notDefinedText}>
                              not defined
                            </Text>
                          )}
                        </Text>
                      </View>

                      <View style={styles.taskInfoColumnRight}>
                        <Text style={[styles.taskInfoLabel, { color: colors.secondaryText }]}>
                          Prewarning
                        </Text>
                        <Text style={[styles.taskInfoValue, { color: colors.text }]}>
                          {displayPrewarning ? (
                            `${displayPrewarning} days`
                          ) : (
                            <Text style={styles.notDefinedText}>
                              not defined
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.taskInfoRow}>
                      <View style={styles.taskInfoColumn}>
                        <Text style={[styles.taskInfoLabel, { color: colors.secondaryText }]}>
                          Next Due
                        </Text>
                        <Text style={[styles.taskInfoValue, { color: colors.text }]}>
                          {nextDue ? (
                            nextDue
                          ) : (
                            <Text style={styles.notDefinedText}>
                              not defined
                            </Text>
                          )}
                        </Text>
                      </View>

                      <View style={styles.taskInfoColumnRight}>
                        <Text style={[styles.taskInfoLabel, { color: colors.secondaryText }]}>
                          Repeat interval
                        </Text>
                        <Text style={[styles.taskInfoValue, { color: colors.text }]}>
                          {displayRepeatValue ? (
                            `${displayRepeatValue} ${displayRepeatUnit}`
                          ) : (
                            <Text style={styles.notDefinedText}>
                              not defined
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.taskInfoFullBlock}>
                      <Text style={[styles.taskInfoLabel, { color: colors.secondaryText }]}>
                        Description
                      </Text>
                      <Text style={[styles.taskInfoValue, { color: colors.text }]}>
                        {displayDescription ? (
                            displayDescription
                          ) : (
                            <Text style={styles.notDefinedText}>
                              not defined
                            </Text>
                          )}
                      </Text>
                    </View>

                    <View style={styles.taskInfoFullBlock}>
                      <Text style={[styles.taskInfoLabel, { color: colors.secondaryText }]}>
                        Custom reminder
                      </Text>
                      <Text style={[styles.taskInfoValue, { color: colors.text }]}>
                        {displayReminderDate || displayReminderTime ? (
                          `${displayReminderDate || "—"}${
                            displayReminderTime
                              ? ` ${displayReminderTime}`
                              : ""
                          }${
                            displayReminderDaily
                              ? " · Daily"
                              : ""
                          }`
                        ) : (
                          <Text style={styles.notDefinedText}>
                            not defined
                          </Text>
                        )}
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>

              <View
                style={[
                  styles.taskModalFooter,
                  { borderTopColor: colors.separator },
                ]}
              >
                <View
                  style={[
                    styles.taskModalButtons,
                    !isEditingTask && styles.taskDetailsCompleteFooter,
                  ]}
                >
                  {isEditingTask ? (
                    <Pressable
                      style={[
                        styles.modalButton,
                        styles.createButton,
                      ]}
                      onPress={saveTaskEdit}
                    >
                      <Text style={styles.createButtonText}>
                        Save
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[
                        styles.modalButton,
                        styles.completeButton,
                        { backgroundColor: "#43A047" },
                      ]}
                      onPress={openCompleteTask}
                    >
                      <Text style={styles.completeButtonText}>
                        Complete
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    );
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
              <Pressable
                style={[
                  styles.locationTab,
                  selectedLocation === "All" &&
                    styles.locationTabActive,
                  {
                    borderColor:
                      selectedLocation === "All"
                        ? colors.text
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedLocation("All")}
              >
                <Text
                  style={[
                    styles.locationTabText,
                    selectedLocation === "All" &&
                      styles.locationTabActiveText,
                    {
                      color:
                        selectedLocation === "All"
                          ? "#FFFFFF"
                          : colors.secondaryText,
                    },
                  ]}
                >
                  All
                </Text>
              </Pressable>

              {workbookLocations.sortedLocations.map((item) => {
                const location = item.label;
                const active =
                  selectedLocation.toLowerCase() ===
                  location.toLowerCase();

                return (
                  <Pressable
                    key={`location-${location}`}
                    style={[
                      styles.locationTab,
                      active &&
                        styles.locationTabActive,
                      {
                        borderColor: active
                          ? colors.text
                          : colors.border,
                      },
                    ]}
                    onPress={() =>
                      setSelectedLocation(location)
                    }
                  >
                    <Text
                      style={[
                        styles.locationTabText,
                        active &&
                          styles.locationTabActiveText,
                        {
                          color: active
                            ? "#FFFFFF"
                            : colors.secondaryText,
                        },
                        location === "Unallocated" &&
                          styles.unallocatedText,
                      ]}
                      numberOfLines={1}
                    >
                      {location}
                    </Text>
                  </Pressable>
                );
              })}
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
                          fontWeight: task.hasUpdate
                            ? "700"
                            : "400",
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
                          fontWeight: task.hasUpdate
                            ? "700"
                            : "400",
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
                          fontWeight: task.hasUpdate
                            ? "700"
                            : "400",
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
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={styles.keyboardAvoidingContainer}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View
                  style={[
                    styles.createTaskBox,
                    {
                      backgroundColor: colors.card,
                      height: Math.min(
                        FLOATING_WINDOW_MAX_HEIGHT,
                        Math.max(
                          300,
                          newTaskContentHeight + 126
                        )
                      ),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.taskModalHeader,
                      { borderBottomColor: colors.separator },
                    ]}
                  >
                    <Text
                      style={[
                        styles.createWorkbookTitle,
                        {
                          color: colors.text,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      New Task
                    </Text>
                    <Pressable
                      style={styles.taskCloseButton}
                      onPress={() => {
                        resetNewTaskForm();
                        setShowCreateTask(false);
                      }}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  </View>

                  <ScrollView
                    style={styles.createTaskScroll}
                    contentContainerStyle={styles.createTaskScrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={(_, height) => {
                      setNewTaskContentHeight(height);
                    }}
                  >

              <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                Task name *
              </Text>
              <TextInput
                style={[
                  styles.workbookInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
                placeholder="Task name"
                placeholderTextColor={colors.secondaryText}
                value={newTaskName}
                onChangeText={(value) => {
                  setNewTaskName(value);
                  setTaskError("");
                }}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />

              {taskError !== "" && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {taskError}
                </Text>
              )}

              <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                Location
              </Text>
              <TextInput
                style={[
                  styles.workbookInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
                placeholder="Location (optional)"
                placeholderTextColor={colors.secondaryText}
                value={newTaskLocation}
                onChangeText={setNewTaskLocation}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />

              <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                Due date
              </Text>
              <Pressable
                style={[
                  styles.workbookInput,
                  styles.newTaskDatePickerField,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
                onPress={() =>
                  setShowNewTaskDatePicker((current) => !current)
                }
              >
                <Text
                  style={[
                    styles.newTaskDatePickerText,
                    {
                      color: newTaskDate
                        ? colors.text
                        : colors.secondaryText,
                    },
                  ]}
                >
                  {newTaskDate
                    ? formatTaskDate(newTaskDate)
                    : "Select date (optional)"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={19}
                  color={colors.secondaryText}
                />
              </Pressable>

              {showNewTaskDatePicker && (
                <View
                  style={[
                    styles.newTaskDatePickerContainer,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                >
                  <DateTimePicker
                    value={getNewTaskDateValue()}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    onChange={(event, date) => {
                      if (Platform.OS === "android") {
                        setShowNewTaskDatePicker(false);
                      }

                      if (date) {
                        setNewTaskDate(formatDateForStorage(date));
                      }
                    }}
                  />

                  <Pressable
                    style={styles.newTaskDateDoneButton}
                    onPress={() => setShowNewTaskDatePicker(false)}
                  >
                    <Text
                      style={[
                        styles.newTaskDateDoneText,
                        { color: colors.text },
                      ]}
                    >
                      Done
                    </Text>
                  </Pressable>
                </View>
              )}

              {newTaskDate.trim() !== "" && (
                <>
                  <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                    Prewarning
                  </Text>
                  <View style={styles.inlineFieldRow}>
                    <TextInput
                      style={[
                        styles.compactNumberInput,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.inputBackground,
                        },
                      ]}
                      placeholder="-"
                      placeholderTextColor={colors.secondaryText}
                      value={newTaskPrewarning}
                      onChangeText={(value) => {
                        setNewTaskPrewarning(value);
                        setNewPrewarningError("");
                      }}
                      keyboardType="number-pad"
                    />
                    <Text style={[styles.inlineFieldText, { color: colors.text }]}>
                      days before due date
                    </Text>
                  </View>
                  {newPrewarningError ? (
                    <Text
                      style={[
                        styles.prewarningErrorText,
                        { color: colors.error },
                      ]}
                    >
                      {newPrewarningError}
                    </Text>
                  ) : null}
                </>
              )}

              <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                Repeat interval
              </Text>
              <View style={styles.inlineFieldRow}>
                <TextInput
                  style={[
                    styles.compactNumberInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  placeholder="—"
                  placeholderTextColor={colors.secondaryText}
                  value={newTaskRepeatValue}
                  onChangeText={setNewTaskRepeatValue}
                  keyboardType="number-pad"
                />
                <View style={styles.repeatUnitRow}>
                  {(["days", "weeks", "months", "years"] as const).map((unit) => (
                    <Pressable
                      key={unit}
                      style={[
                        styles.repeatUnitButton,
                        {
                          borderColor: colors.border,
                          backgroundColor:
                            newTaskRepeatUnit === unit
                              ? colors.iconBackground
                              : "transparent",
                        },
                      ]}
                      onPress={() => setNewTaskRepeatUnit(unit)}
                    >
                      <Text style={[styles.repeatUnitText, { color: colors.text }]}>
                        {unit}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.nextDueRow}>
                <Text style={[styles.nextDueLabel, { color: colors.secondaryText }]}>
                  Next Due:
                </Text>
                <Text style={[styles.nextDueValue, { color: colors.text }]}>
                  {getNextDuePreview()}
                </Text>
              </View>

              <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.workbookInput,
                  styles.taskDescriptionInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                    height: newTaskDescription ? 144 : 72,
                  },
                ]}
                placeholder="Description (optional)"
                placeholderTextColor={colors.secondaryText}
                value={newTaskDescription}
                onChangeText={setNewTaskDescription}
                multiline
                scrollEnabled={newTaskDescription.length > 0}
                textAlignVertical="top"
              />

              <Text style={[styles.taskFieldLabel, { color: colors.secondaryText }]}>
                Custom reminder
              </Text>
              <View style={styles.reminderRow}>
                <Pressable
                  style={[
                    styles.reminderDateInput,
                    styles.datePickerCompactField,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  onPress={() =>
                    setShowNewTaskReminderDatePicker((current) => !current)
                  }
                >
                  <Text
                    style={[
                      styles.datePickerCompactText,
                      {
                        color: newTaskReminderDate
                          ? colors.text
                          : colors.secondaryText,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {newTaskReminderDate
                      ? formatTaskDate(newTaskReminderDate)
                      : "Date"}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={colors.secondaryText}
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.reminderTimeInput,
                    styles.datePickerCompactField,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  onPress={() =>
                    setShowNewTaskReminderTimePicker((current) => !current)
                  }
                >
                  <Text
                    style={[
                      styles.datePickerCompactText,
                      {
                        color: newTaskReminderTime
                          ? colors.text
                          : colors.secondaryText,
                      },
                    ]}
                  >
                    {newTaskReminderTime || "Time"}
                  </Text>
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={colors.secondaryText}
                  />
                </Pressable>
                <Pressable
                  style={styles.dailyToggle}
                  onPress={() =>
                    setNewTaskReminderDaily((current) => !current)
                  }
                >
                  <Ionicons
                    name={
                      newTaskReminderDaily
                        ? "checkbox-outline"
                        : "square-outline"
                    }
                    size={22}
                    color={colors.text}
                  />
                  <Text style={[styles.dailyToggleText, { color: colors.text }]}>
                    Daily
                  </Text>
                </Pressable>
              </View>

              {showNewTaskReminderDatePicker && (
                <View
                  style={[
                    styles.newTaskDatePickerContainer,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                >
                  <DateTimePicker
                    value={getStoredDateValue(newTaskReminderDate)}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    onChange={(event, date) => {
                      if (Platform.OS === "android") {
                        setShowNewTaskReminderDatePicker(false);
                      }
                      if (date) {
                        setNewTaskReminderDate(
                          formatDateForStorage(date)
                        );
                      }
                    }}
                  />
                  <View style={styles.datePickerActionRow}>
                    <Pressable
                      style={styles.newTaskDateDoneButton}
                      onPress={() => setNewTaskReminderDate("")}
                    >
                      <Text
                        style={[
                          styles.newTaskDateDoneText,
                          { color: colors.secondaryText },
                        ]}
                      >
                        Clear
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.newTaskDateDoneButton}
                      onPress={() =>
                        setShowNewTaskReminderDatePicker(false)
                      }
                    >
                      <Text
                        style={[
                          styles.newTaskDateDoneText,
                          { color: colors.text },
                        ]}
                      >
                        Done
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {showNewTaskReminderTimePicker && (
                <View
                  style={[
                    styles.newTaskDatePickerContainer,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                >
                  <DateTimePicker
                    value={getStoredTimeValue(newTaskReminderTime)}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "clock"}
                    onChange={(event, date) => {
                      if (Platform.OS === "android") {
                        setShowNewTaskReminderTimePicker(false);
                      }
                      if (date) {
                        setNewTaskReminderTime(
                          formatTimeForStorage(date)
                        );
                      }
                    }}
                  />
                  <Pressable
                    style={styles.newTaskDateDoneButton}
                    onPress={() =>
                      setShowNewTaskReminderTimePicker(false)
                    }
                  >
                    <Text
                      style={[
                        styles.newTaskDateDoneText,
                        { color: colors.text },
                      ]}
                    >
                      Done
                    </Text>
                  </Pressable>
                </View>
              )}

                  </ScrollView>

                  <View
                    style={[
                      styles.createTaskFooter,
                      { borderTopColor: colors.separator },
                    ]}
                  >
                    <View style={styles.taskModalButtons}>
  

                <Pressable
                  style={[styles.modalButton, styles.createButton]}
                  onPress={createTask}
                >
                  <Text style={styles.createButtonText}>Add</Text>
                    </Pressable>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        )}
      {selectedTask &&
        selectedWorkbook &&
        renderTaskDetailsWindow()}


      {showCompleteTask &&
        selectedTask &&
        selectedWorkbook && (
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={styles.keyboardAvoidingContainer}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View
                  style={[
                    styles.createTaskBox,
                    styles.completeTaskWindow,
                    {
                      backgroundColor: colors.card,
                      height: Math.min(
                        FLOATING_WINDOW_MAX_HEIGHT,
                        500
                      ),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.taskModalHeader,
                      { borderBottomColor: colors.separator },
                    ]}
                  >
                    <Text
                      style={[
                        styles.createWorkbookTitle,
                        {
                          color: colors.text,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      Complete Task
                    </Text>

                    <Pressable
                      style={styles.taskCloseButtonSmall}
                      onPress={closeCompleteTask}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  </View>

                  <ScrollView
                    style={styles.completeTaskScroll}
                    contentContainerStyle={
                      styles.completeTaskScrollContent
                    }
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.completeTaskField}>
                      <Text
                        style={[
                          styles.taskInfoLabel,
                          { color: colors.secondaryText },
                        ]}
                      >
                        Name
                      </Text>
                      <Text
                        style={[
                          styles.taskInfoValue,
                          { color: colors.text },
                        ]}
                      >
                        {selectedTask.name}
                      </Text>
                    </View>

                    <View style={styles.completeTaskField}>
                      <Text
                        style={[
                          styles.taskInfoLabel,
                          { color: colors.secondaryText },
                        ]}
                      >
                        Date of completion
                      </Text>
                      <Pressable
                        style={[
                          styles.workbookInput,
                          styles.additionalInput,
                          styles.newTaskDatePickerField,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.inputBackground,
                          },
                        ]}
                        onPress={() =>
                          setShowCompletionDatePicker((current) => !current)
                        }
                      >
                        <Text
                          style={[
                            styles.newTaskDatePickerText,
                            { color: colors.text },
                          ]}
                        >
                          {completionDate
                            ? formatTaskDate(completionDate)
                            : "Select date"}
                        </Text>
                        <Ionicons
                          name="calendar-outline"
                          size={19}
                          color={colors.secondaryText}
                        />
                      </Pressable>
                      {showCompletionDatePicker && (
                        <View
                          style={[
                            styles.newTaskDatePickerContainer,
                            {
                              borderColor: colors.border,
                              backgroundColor: colors.inputBackground,
                            },
                          ]}
                        >
                          <DateTimePicker
                            value={getStoredDateValue(completionDate)}
                            mode="date"
                            maximumDate={new Date()}
                            display={Platform.OS === "ios" ? "inline" : "calendar"}
                            onChange={(event, date) => {
                              if (Platform.OS === "android") {
                                setShowCompletionDatePicker(false);
                              }
                              if (date) {
                                setCompletionDate(
                                  formatDateForStorage(date)
                                );
                                setCompletionDateError("");
                              }
                            }}
                          />
                          <Pressable
                            style={styles.newTaskDateDoneButton}
                            onPress={() =>
                              setShowCompletionDatePicker(false)
                            }
                          >
                            <Text
                              style={[
                                styles.newTaskDateDoneText,
                                { color: colors.text },
                              ]}
                            >
                              Done
                            </Text>
                          </Pressable>
                        </View>
                      )}
                      {completionDateError ? (
                        <Text
                          style={[
                            styles.completionDateError,
                            { color: colors.error },
                          ]}
                        >
                          {completionDateError}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.completeTaskRow}>
                      <View style={styles.completeTaskColumn}>
                        <Text
                          style={[
                            styles.taskInfoLabel,
                            { color: colors.secondaryText },
                          ]}
                        >
                          Next due
                        </Text>
                        <Text
                          style={[
                            styles.taskInfoValue,
                            { color: colors.text },
                          ]}
                        >
                          {calculateNextDue(
                            completionDate,
                            selectedTask.repeatValue ?? "",
                            selectedTask.repeatUnit ?? "months"
                          ) ? (
                            calculateNextDue(
                              completionDate,
                              selectedTask.repeatValue ?? "",
                              selectedTask.repeatUnit ?? "months"
                            )
                          ) : (
                            <Text style={styles.notDefinedText}>
                              not defined
                            </Text>
                          )}
                        </Text>
                      </View>

                      <View style={styles.completeTaskColumn}>
                        <Text
                          style={[
                            styles.taskInfoLabel,
                            { color: colors.secondaryText },
                          ]}
                        >
                          Repeat interval
                        </Text>
                        <Text
                          style={[
                            styles.taskInfoValue,
                            { color: colors.text },
                          ]}
                        >
                          {selectedTask.repeatValue ? (
                            `${selectedTask.repeatValue} ${
                              selectedTask.repeatUnit ?? ""
                            }`
                          ) : (
                            <Text style={styles.notDefinedText}>
                              not defined
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.completeTaskField}>
                      <Text
                        style={[
                          styles.taskInfoLabel,
                          { color: colors.secondaryText },
                        ]}
                      >
                        Report
                      </Text>
                      <TextInput
                        style={[
                          styles.workbookInput,
                          styles.taskDescriptionInput,
                          {
                            color: colors.text,
                            borderColor: colors.border,
                            backgroundColor:
                              colors.inputBackground,
                            height:
                              completionReport.length > 0
                                ? 144
                                : 72,
                          },
                        ]}
                        placeholder="Report (optional)"
                        placeholderTextColor={
                          colors.secondaryText
                        }
                        value={completionReport}
                        onChangeText={setCompletionReport}
                        multiline
                        scrollEnabled={
                          completionReport.length > 0
                        }
                        textAlignVertical="top"
                        returnKeyType="default"
                      />
                    </View>
                  </ScrollView>

                  <View
                    style={[
                      styles.taskModalFooter,
                      { borderTopColor: colors.separator },
                    ]}
                  >
                    <View
                      style={[
                        styles.taskModalButtons,
                        {
                          justifyContent: "flex-end",
                        },
                      ]}
                    >
                      <Pressable
                        style={[
                          styles.modalButton,
                          styles.completeButton,
                          { backgroundColor: "#43A047" },
                        ]}
                        onPress={completeSelectedTask}
                      >
                        <Text
                          style={styles.completeButtonText}
                        >
                          Complete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        )}



      {showTaskHistory &&
        selectedTask &&
        selectedWorkbook && (
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={styles.keyboardAvoidingContainer}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View
                style={[
                  styles.createTaskBox,
                  styles.taskHistoryWindow,
                  {
                    backgroundColor: colors.card,
                    height: Math.min(
                      FLOATING_WINDOW_MAX_HEIGHT,
                      360
                    ),
                  },
                ]}
              >
                <View
                  style={[
                    styles.taskModalHeader,
                    { borderBottomColor: colors.separator },
                  ]}
                >
                  <Text
                    style={[
                      styles.createWorkbookTitle,
                      {
                        color: colors.text,
                        marginBottom: 0,
                      },
                    ]}
                  >
                    Task History
                  </Text>

                  <Pressable
                    style={styles.taskCloseButtonSmall}
                    onPress={closeTaskHistory}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.taskHistoryTaskName,
                    { borderBottomColor: colors.separator },
                  ]}
                >
                  <Text
                    style={[
                      styles.taskHistoryTaskNameValue,
                      { color: colors.text },
                    ]}
                    numberOfLines={2}
                  >
                    {selectedTask.name}
                  </Text>
                </View>

                <ScrollView
                  style={styles.taskHistoryScroll}
                  contentContainerStyle={styles.taskHistoryList}
                  showsVerticalScrollIndicator={false}
                >
                  {selectedTask.history &&
                  selectedTask.history.length > 0 ? (
                    [...selectedTask.history]
                      .sort((a, b) => {
                        const dateA = new Date(a.date).getTime();
                        const dateB = new Date(b.date).getTime();
                        return dateB - dateA;
                      })
                      .map((record, index) => (
                        <Pressable
                          key={`${record.date}-${index}`}
                          style={[
                            styles.taskHistoryRow,
                            {
                              borderBottomColor:
                                colors.separator,
                            },
                          ]}
                          onPress={() => openTaskRecord(record)}
                        >
                          <Text
                            style={[
                              styles.taskHistoryDate,
                              { color: colors.text },
                            ]}
                          >
                            {formatTaskDate(record.date)}
                          </Text>

                          <Text
                            style={[
                              styles.taskHistoryReport,
                              { color: colors.text },
                            ]}
                          >
                            {record.report || "—"}
                          </Text>
                        </Pressable>
                      ))
                  ) : (
                    <View style={styles.taskHistoryEmpty}>
                      <Text
                        style={[
                          styles.taskHistoryEmptyText,
                          { color: colors.secondaryText },
                        ]}
                      >
                        No history yet
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}

      {showTaskRecord &&
        selectedTask &&
        selectedHistoryRecord && (
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={styles.keyboardAvoidingContainer}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View
                style={[
                  styles.createTaskBox,
                  styles.taskRecordWindow,
                  {
                    backgroundColor: colors.card,
                    height: Math.min(
                      FLOATING_WINDOW_MAX_HEIGHT,
                      390
                    ),
                  },
                ]}
              >
                <View
                  style={[
                    styles.taskModalHeader,
                    { borderBottomColor: colors.separator },
                  ]}
                >
                  <Text
                    style={[
                      styles.createWorkbookTitle,
                      { color: colors.text, marginBottom: 0 },
                    ]}
                  >
                    Task Record
                  </Text>

                  <View style={styles.taskRecordHeaderActions}>
                    <Pressable
                      style={styles.taskHeaderIconButton}
                      onPress={openRecordEdit}
                    >
                      <Ionicons
                        name="create-outline"
                        size={21}
                        color={colors.text}
                      />
                    </Pressable>

                    <View style={styles.taskRecordActionSpacer} />

                    <Pressable
                      style={styles.taskCloseButtonSmall}
                      onPress={closeTaskRecord}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  </View>
                </View>

                <ScrollView
                  style={styles.taskRecordScroll}
                  contentContainerStyle={styles.taskRecordContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.taskRecordRow}>
                    <Text style={[styles.taskRecordLabel, { color: colors.secondaryText }]}>
                      Task name
                    </Text>
                    <Text style={[styles.taskRecordValue, { color: colors.text }]}>
                      {selectedTask.name}
                    </Text>
                  </View>

                  <View style={styles.taskRecordRow}>
                    <Text style={[styles.taskRecordLabel, { color: colors.secondaryText }]}>
                      Date completed
                    </Text>
                    <Text style={[styles.taskRecordValue, { color: colors.text }]}>
                      {formatTaskDate(selectedHistoryRecord.date)}
                    </Text>
                  </View>

                  <View style={styles.taskRecordReportBlock}>
                    <Text style={[styles.taskRecordLabel, { color: colors.secondaryText }]}>
                      Completion Report
                    </Text>
                    <Text style={[styles.taskRecordReport, { color: colors.text }]}>
                      {selectedHistoryRecord.report || "—"}
                    </Text>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}

      {showRecordEdit &&
        selectedTask &&
        selectedHistoryRecord && (
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={styles.keyboardAvoidingContainer}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View
                style={[
                  styles.recordEditWindow,
                  {
                    backgroundColor: colors.card,
                    height: Math.min(
                      FLOATING_WINDOW_MAX_HEIGHT,
                      430
                    ),
                  },
                ]}
              >
                <View
                  style={[
                    styles.taskModalHeader,
                    { borderBottomColor: colors.separator },
                  ]}
                >
                  <Text
                    style={[
                      styles.createWorkbookTitle,
                      { color: colors.text, marginBottom: 0 },
                    ]}
                  >
                    Record Edit
                  </Text>

                  <Pressable
                    style={styles.taskCloseButtonSmall}
                    onPress={closeRecordEdit}
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.recordEditScroll}
                  contentContainerStyle={styles.recordEditContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.recordEditFirstRow}>
                    <View style={styles.recordEditFirstColumn}>
                      <Text
                        style={[
                          styles.taskRecordLabel,
                          { color: colors.secondaryText },
                        ]}
                      >
                        Task name
                      </Text>
                      <Text
                        style={[
                          styles.taskRecordValue,
                          { color: colors.text },
                        ]}
                      >
                        {selectedTask.name}
                      </Text>
                    </View>

                    <View style={styles.recordEditSecondColumn}>
                      <Text
                        style={[
                          styles.taskRecordLabel,
                          { color: colors.secondaryText },
                        ]}
                      >
                        Location
                      </Text>
                      <Text
                        style={[
                          styles.taskRecordValue,
                          { color: colors.text },
                        ]}
                      >
                        {selectedTask.location || "not defined"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.recordEditRow}>
                    <Text
                      style={[
                        styles.taskRecordLabel,
                        { color: colors.secondaryText },
                      ]}
                    >
                      Completion Date
                    </Text>
                    <Pressable
                      style={[
                        styles.recordEditDateInput,
                        styles.datePickerCompactField,
                        {
                          borderColor: colors.separator,
                          backgroundColor: colors.inputBackground,
                        },
                      ]}
                      onPress={() =>
                        setShowRecordEditDatePicker((current) => !current)
                      }
                    >
                      <Text
                        style={[
                          styles.datePickerCompactText,
                          { color: colors.text },
                        ]}
                      >
                        {recordEditDate
                          ? formatTaskDate(recordEditDate)
                          : "Select date"}
                      </Text>
                      <Ionicons
                        name="calendar-outline"
                        size={17}
                        color={colors.secondaryText}
                      />
                    </Pressable>
                    {showRecordEditDatePicker && (
                      <View
                        style={[
                          styles.newTaskDatePickerContainer,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.inputBackground,
                          },
                        ]}
                      >
                        <DateTimePicker
                          value={getStoredDateValue(recordEditDate)}
                          mode="date"
                          maximumDate={new Date()}
                          display={Platform.OS === "ios" ? "inline" : "calendar"}
                          onChange={(event, date) => {
                            if (Platform.OS === "android") {
                              setShowRecordEditDatePicker(false);
                            }
                            if (date) {
                              setRecordEditDate(
                                formatDateForStorage(date)
                              );
                              setRecordEditDateError("");
                            }
                          }}
                        />
                        <Pressable
                          style={styles.newTaskDateDoneButton}
                          onPress={() =>
                            setShowRecordEditDatePicker(false)
                          }
                        >
                          <Text
                            style={[
                              styles.newTaskDateDoneText,
                              { color: colors.text },
                            ]}
                          >
                            Done
                          </Text>
                        </Pressable>
                      </View>
                    )}
                    {recordEditDateError ? (
                      <Text
                        style={[
                          styles.prewarningErrorText,
                          { color: colors.error },
                        ]}
                      >
                        {recordEditDateError}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.recordEditReportBlock}>
                    <Text
                      style={[
                        styles.taskRecordLabel,
                        { color: colors.secondaryText },
                      ]}
                    >
                      Completion Report
                    </Text>
                    <TextInput
                      style={[
                        styles.recordEditReportInput,
                        {
                          color: colors.text,
                          borderColor: colors.separator,
                        },
                      ]}
                      value={recordEditReport}
                      onChangeText={setRecordEditReport}
                      multiline
                      textAlignVertical="top"
                      placeholder="Report"
                      placeholderTextColor={colors.secondaryText}
                    />
                  </View>
                </ScrollView>

                <View
                  style={[
                    styles.taskModalFooter,
                    { borderTopColor: colors.separator },
                  ]}
                >
                  <View style={styles.taskModalButtons}>
                    <Pressable
                      style={[
                        styles.modalButton,
                        styles.createButton,
                      ]}
                      onPress={saveRecordEdit}
                    >
                      <Text style={styles.createButtonText}>
                        Save
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
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

  notDefinedText: {
    fontStyle: "italic",
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

  taskDetailsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },

  completeButton: {
    minWidth: 88,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  taskDetailsBottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    paddingBottom: 10,
  },

  taskModalHeader: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 5,
    marginBottom: 2,
  },

  taskInfoRow: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 4,
  },

  taskInfoColumn: {
    flex: 2,
    minWidth: 0,
  },

  taskInfoColumnRight: {
    flex: 1,
    minWidth: 0,
  },

  taskInfoFullBlock: {
    paddingVertical: 4,
  },

  taskInfoLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },

  taskInfoValue: {
    fontSize: 15,
    lineHeight: 20,
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

  /* CREATE TASK FORM */

  keyboardAvoidingContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    maxHeight: FLOATING_WINDOW_MAX_HEIGHT,
  },

  completeTaskWindow: {
    width: "100%",
    maxWidth: 500,
    maxHeight: FLOATING_WINDOW_MAX_HEIGHT,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 7,
    flexDirection: "column",
    flexShrink: 1,
  },

  completeTaskScroll: {
    flex: 1,
    minHeight: 180,
  },

  completeTaskScrollContent: {
    paddingTop: 4,
    paddingBottom: 62,
  },

  completeTaskField: {
    marginBottom: 10,
  },

  completionDateError: {
    fontSize: 12,
    marginTop: 5,
  },

  prewarningErrorText: {
    fontSize: 12,
    marginTop: 5,
  },

  completeTaskRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },

  completeTaskColumn: {
    flex: 1,
  },

  recordEditWindow: {
    width: "100%",
    maxWidth: 500,
    maxHeight: FLOATING_WINDOW_MAX_HEIGHT,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 0,
    flexDirection: "column",
  },

  recordEditScroll: {
    flex: 1,
    minHeight: 0,
  },

  recordEditContent: {
    paddingTop: 2,
    paddingBottom: 10,
  },

  recordEditFirstRow: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 6,
  },

  recordEditFirstColumn: {
    flex: 2,
    minWidth: 0,
  },

  recordEditSecondColumn: {
    flex: 1,
    minWidth: 0,
  },

  recordEditRow: {
    paddingVertical: 6,
  },

  recordEditReportBlock: {
    paddingVertical: 6,
  },

  recordEditDateInput: {
    height: 40,
    minWidth: 145,
    maxWidth: 190,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 15,
  },

  recordEditReportInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    marginTop: 3,
  },

  taskRecordWindow: {
    width: "100%",
    maxWidth: 500,
    maxHeight: FLOATING_WINDOW_MAX_HEIGHT,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 7,
    flexDirection: "column",
    flexShrink: 1,
  },

  taskRecordHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  taskRecordActionSpacer: {
    width: 28,
  },

  taskRecordScroll: {
    flex: 1,
    minHeight: 0,
  },

  taskRecordContent: {
    paddingTop: 2,
    paddingBottom: 12,
  },

  taskRecordRow: {
    paddingVertical: 6,
  },

  taskRecordLabel: {
    fontSize: 12,
    marginBottom: 2,
  },

  taskRecordValue: {
    fontSize: 15,
    lineHeight: 21,
  },

  taskRecordReportBlock: {
    paddingVertical: 6,
  },

  taskRecordReport: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 5,
  },

  taskHistoryWindow: {
    width: "100%",
    maxWidth: 500,
    maxHeight: FLOATING_WINDOW_MAX_HEIGHT,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 7,
    flexDirection: "column",
    flexShrink: 1,
  },

  taskHistoryTaskName: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  taskHistoryTaskNameValue: {
    fontSize: 16,
    fontWeight: "600",
  },

  taskHistoryScroll: {
    flex: 1,
    minHeight: 120,
  },

  taskHistoryList: {
    paddingTop: 2,
    paddingBottom: 12,
  },

  taskHistoryRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  taskHistoryDate: {
    width: 92,
    fontSize: 13,
    fontWeight: "500",
    marginRight: 12,
  },

  taskHistoryReport: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },

  taskHistoryEmpty: {
    alignItems: "center",
    paddingVertical: 30,
  },

  taskHistoryEmptyText: {
    fontSize: 14,
    fontStyle: "italic",
  },

  taskDetailsWindow: {
    width: "100%",
    maxWidth: 500,
    maxHeight: FLOATING_WINDOW_MAX_HEIGHT,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 0,
    flexDirection: "column",
    flexShrink: 1,
  },

  taskCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#D9534F",
    alignItems: "center",
    justifyContent: "center",
  },

  taskHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  taskHeaderIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  taskDetailsCompleteFooter: {
    justifyContent: "flex-end",
    width: "100%",
    height: 43,
    alignItems: "center",
  },

  taskHeaderActionSpacer: {
    width: 28,
  },

  taskCloseButtonSmall: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#D9534F",
    alignItems: "center",
    justifyContent: "center",
  },

  createTaskBox: {
    width: "100%",
    maxWidth: 500,
    maxHeight: FLOATING_WINDOW_MAX_HEIGHT,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 0,
    flexDirection: "column",
  },

  createTaskScroll: {
    width: "100%",
    flex: 1,
    minHeight: 0,
  },

  taskDetailsScroll: {
    width: "100%",
    flex: 1,
    minHeight: 0,
  },

  createTaskScrollContent: {
    paddingTop: 2,
    paddingBottom: 62,
  },

  taskFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },

  inlineFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  compactNumberInput: {
    width: 54,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    fontSize: 13,
  },

  inlineFieldText: {
    fontSize: 12,
  },

  repeatUnitRow: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },

  repeatUnitButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  repeatUnitText: {
    fontSize: 10,
    textTransform: "capitalize",
  },

  nextDueRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  nextDueLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 6,
  },

  nextDueValue: {
    fontSize: 12,
    fontWeight: "700",
  },

  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  reminderDateInput: {
    flex: 1.4,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    fontSize: 11,
  },

  reminderTimeInput: {
    flex: 0.75,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    fontSize: 11,
  },

  dailyToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minHeight: 40,
  },

  dailyToggleText: {
    fontSize: 11,
  },

  taskDescriptionInput: {
    paddingTop: 9,
  },

  taskModalFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 2,
  },

  createTaskFooter: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "transparent",
    zIndex: 10,
  },

  taskModalButtons: {
    height: 43,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
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
 
    zIndex: 100,
    elevation: 100,
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

  newTaskDatePickerField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  newTaskDatePickerText: {
    fontSize: 15,
  },

  newTaskDatePickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 4,
    alignItems: "center",
    overflow: "hidden",
  },

  newTaskDateDoneButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignSelf: "flex-end",
  },

  newTaskDateDoneText: {
    fontSize: 15,
    fontWeight: "600",
  },

  datePickerActionRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  datePickerCompactField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  datePickerCompactText: {
    fontSize: 14,
    flex: 1,
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
    borderRadius: 10,
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