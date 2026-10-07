import { View } from "react-native";
import { Colors } from "@/constants/theme";

// The route guard in _layout decides where to go from here.
export default function Index() {
  return <View style={{ flex: 1, backgroundColor: Colors.bgDeep }} />;
}
