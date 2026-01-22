import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MainStack } from "./modules/MainStack";
import { DrawerContent } from "./modules/menu/DrawerContent";
import { ThemeProvider, useTheme } from "./modules/contexts/ThemeContext";
import { Gw2ApiProvider } from "./modules/contexts/Gw2ApiContext";
import { OrientationProvider } from "./modules/contexts/OrientationContext";

const Drawer = createDrawerNavigator();

function AppShell() {
  const theme = useTheme();

  return (
    <OrientationProvider>
      <NavigationContainer>
        <Gw2ApiProvider>
          <Drawer.Navigator
            screenOptions={{
              headerShown: false,
              drawerType: "front",
              drawerStyle: {
                width: theme.sizing.drawerWidth,
                backgroundColor: theme.colors.topBar,
              },
              overlayColor: theme.colors.overlay,
            }}
            drawerContent={(p) => <DrawerContent {...p} />}
          >
            <Drawer.Screen name="Main" component={MainStack} />
          </Drawer.Navigator>
        </Gw2ApiProvider>
      </NavigationContainer>
    </OrientationProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider initialMode="dark">
      <AppShell />
    </ThemeProvider>
  );
}