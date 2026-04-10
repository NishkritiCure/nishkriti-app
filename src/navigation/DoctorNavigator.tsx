
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text } from "react-native";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography } from "../theme";
import { DoctorRosterScreen } from "../screens/doctor/RosterScreen";
import { PatientProfileScreen } from "../screens/doctor/PatientProfileScreen";
import { ProtocolEditorScreen } from "../screens/doctor/ProtocolEditorScreen";
import { DoctorDashboardScreen } from "../screens/doctor/DashboardScreen";
import { CreatePatientScreen } from "../screens/doctor/CreatePatientScreen";
import { TreatmentPlanEditorScreen } from "../screens/doctor/TreatmentPlanEditorScreen";
import { StatsScreen } from "../screens/doctor/StatsScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ name, active }: { name: string; active: boolean }) => (
  <View style={{ alignItems:"center", gap:2, minWidth: 70 }}>
    <Text style={{ fontSize:22, opacity: active ? 1 : 0.3, color: active ? Colors.teal : Colors.ink2 }}>
      {({ Roster:"👥", Flags:"⚠", Proto:"📋", Stats:"📊" } as any)[name] || "·"}
    </Text>
    <Text style={{ fontFamily:Typography.sans, fontSize:11, color: active ? Colors.teal : Colors.ink3, textAlign: "center" }}>
      {name}
    </Text>
  </View>
);

const DoctorTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.deep,
          borderTopWidth: 0.5, borderTopColor: Colors.border,
          paddingBottom: insets.bottom || 8,
          height: 64 + (insets.bottom || 0),
        },
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} active={focused} />,
      })}
    >
      <Tab.Screen name="Roster" component={DoctorRosterScreen} />
      <Tab.Screen name="Flags" component={DoctorDashboardScreen} />
      <Tab.Screen name="Proto" component={ProtocolEditorScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
};

// FIX: wrapped in ErrorBoundary so unhandled throws show fallback, not white screen
export const DoctorNavigator = () => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorTabs" component={DoctorTabs} />
      <Stack.Screen name="PatientProfile" component={PatientProfileScreen} />
      <Stack.Screen name="ProtocolEditor" component={ProtocolEditorScreen} />
      <Stack.Screen name="CreatePatient" component={CreatePatientScreen} />
      <Stack.Screen name="TreatmentPlanEditor" component={TreatmentPlanEditorScreen} />
    </Stack.Navigator>
  </ErrorBoundary>
);
