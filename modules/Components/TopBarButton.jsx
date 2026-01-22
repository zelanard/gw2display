import { Pressable } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export function TopBarButton({ openMenu }) {
    return (
        <Pressable
            onPress={openMenu}
            style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
            }}
            hitSlop={8}
        >
            <Ionicons name="menu-outline" size={26} color="white" />
        </Pressable>
    );
}