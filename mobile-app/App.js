import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import { CartProvider } from "./src/CartContext";
import BillScreen from "./src/screens/BillScreen";
import CartScreen from "./src/screens/CartScreen";
import MenuScreen from "./src/screens/MenuScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import TablesScreen from "./src/screens/TablesScreen";
import { colors } from "./src/styles";

const Stack = createNativeStackNavigator();

// Colored header used on every screen.
const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" },
  headerTitleAlign: "center",
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

// Screens, in the order a diner uses them:
// choose table → menu → cart → live order status → bill and pay
export default function App() {
  return (
    <CartProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Tables" screenOptions={headerOptions}>
          <Stack.Screen name="Tables" component={TablesScreen} options={{ title: "Welcome" }} />
          <Stack.Screen name="Menu" component={MenuScreen} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Your order" }} />
          <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: "Order status" }} />
          <Stack.Screen name="Bill" component={BillScreen} options={{ title: "Bill" }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </CartProvider>
  );
}
