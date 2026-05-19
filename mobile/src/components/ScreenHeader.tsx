import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useColors } from "../theme/ThemeContext";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

const ScreenHeader = ({ eyebrow, title, subtitle }: ScreenHeaderProps) => {
  const colors = useColors();
  const { width } = Dimensions.get("window");
  const isMobile = width < 640;

  const styles = React.useMemo(() => StyleSheet.create({
    wrap: {
      paddingHorizontal: isMobile ? 14 : 20,
      paddingTop: isMobile ? 10 : 14,
      paddingBottom: isMobile ? 10 : 14,
      borderBottomWidth: 2,
      borderBottomColor: colors.boardBorder,
      backgroundColor: colors.bg,
    },
    eyebrow: {
      fontSize: isMobile ? 9 : 10,
      color: colors.accent,
      textTransform: "uppercase",
      letterSpacing: 2,
      fontWeight: "900",
    },
    title: {
      marginTop: 3,
      fontSize: isMobile ? 20 : 26,
      fontWeight: "900",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: -0.5,
      lineHeight: isMobile ? 24 : 30,
    },
    subtitle: {
      marginTop: 3,
      color: colors.muted,
      fontSize: isMobile ? 11 : 12,
      fontWeight: "600",
      lineHeight: isMobile ? 16 : 18,
    },
  }), [colors, isMobile]);

  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

export default ScreenHeader;
