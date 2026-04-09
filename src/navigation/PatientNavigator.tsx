import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography } from "../theme";
import { HomeScreen }          from "../screens/patient/HomeScreen";
import { CheckInScreen }       from "../screens/patient/CheckInScreen";
import { DietPlanScreen }      from "../screens/patient/DietPlanScreen";
import { WorkoutScreen }       from "../screens/patient/WorkoutScreen";
import { ProgressScreen }      from "../screens/patient/ProgressScreen";
import { SupplementsScreen }   from "../screens/patient/SupplementsScreen";
import { NotifyDoctorScreen }  from "../screens/patient/NotifyDoctorScreen";
import { WaitingScreen }       from "../screens/patient/WaitingScreen";
import { OnboardingScreen }    from "../screens/patient/OnboardingScreen";

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: "⌂", Plan: "☰", Progress: "↗", Supps: "⬤", Notify: "✆",
};

const TabIcon = ({ name, active }: { name: string; active: boolean }) => (
  <View style={{ alignItems: "center", gap: 2, minWidth: 60 }}>
    <Text style={{ fontSize: 22, opacity: active ? 1 : 0.3, color: active ? Colors.teal : Colors.ink2 }}>
      {TAB_ICONS[name] ?? "·"}
    </Text>
    <Text style={{ fontFamily: Typography.sans, fontSize: 11, color: active ? Colors.teal : Colors.ink3, textAlign: "center" }}>
      {name}
    </Text>
  </View>
);

const PatientTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.deep,
          borderTopWidth: 0.5,
          borderTopColor: Colors.border,
          paddingBottom: insets.bottom || 8,
          height: 64 + (insets.bottom || 0),
        },
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} active={focused} />,
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Plan"     component={DietPlanScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Supps"    component={SupplementsScreen} />
      <Tab.Screen name="Notify"   component={NotifyDoctorScreen} />
    </Tab.Navigator>
  );
};

export const PatientNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PatientTabs" component={PatientTabs} />
    <Stack.Screen
      name="CheckIn"
      component={CheckInScreen}
      options={{ presentation: "modal", cardStyle: { backgroundColor: Colors.deep } }}
    />
    <Stack.Screen name="Workout"    component={WorkoutScreen} />
    <Stack.Screen name="Waiting"    component={WaitingScreen} />
    <Stack.Screen
      name="Onboarding"
      component={OnboardingScreen}
      options={{ presentation: "modal", gestureEnabled: false, cardStyle: { backgroundColor: Colors.deep } }}
    />
  </Stack.Navigator>
);
