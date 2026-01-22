import { Text, View } from "react-native";
import { TopBarButton } from "./TopBarButton";

export default function Landscape({ openMenu, title }) {
    return <View style={{ alignItems: "center" }}>
        <TopBarButton openMenu={openMenu} />
        <Text
            style={{
                flexShrink: 0,
                width: "250",
                backgroundColor: "transparent",
                height: 35,
                marginTop: 100,
                marginLeft: 15,
                color: "white",
                fontSize: 18,
                textAlign: "center",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: [{ rotate: "270deg" }],
            }}>
            {title}
        </Text>
    </View>;
}
