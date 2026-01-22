import { Text, View } from "react-native";
import { TopBarButton } from "./TopBarButton";

export default function TopPortrait({ openMenu, title }) {
    return (
        <View style={{ flexDirection: "row", marginTop: "18", alignItems: "center" }}>
            <TopBarButton openMenu={openMenu} />
            <Text style={{ color: "white", fontSize: 18 }} numberOfLines={1}>
                {title}
            </Text>
        </View>
    );
}
