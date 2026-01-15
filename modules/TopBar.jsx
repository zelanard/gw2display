import "react-native-gesture-handler";
import { View, Text, Pressable } from "react-native";
import { DrawerActions } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "../theme/ThemeContext";

export function TopBar({ navigation, route, options }) {
    const Styles = useStyles();
    const title = options && options.title ? options.title : route.name;

    return (
        <SafeAreaView edges={["top"]} style={Styles.topBarSafe}>
            <View style={Styles.topBar}>
                <Pressable
                    onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                    style={Styles.iconBtn}
                    hitSlop={10}
                >
                    <Text style={Styles.iconText}>☰</Text>
                </Pressable>

                <Text style={Styles.topBarTitle} numberOfLines={1}>
                    {title}
                </Text>

                <View style={Styles.iconBtn}>
                    <Text style={Styles.iconText}></Text>
                </View>
            </View>
        </SafeAreaView>
    );
}