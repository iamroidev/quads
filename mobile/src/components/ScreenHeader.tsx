import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useColors } from "../theme/ThemeContext";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

const ZIGZAG_COUNT = 24;

const ScreenHeader = ({ eyebrow, title, subtitle }: ScreenHeaderProps) => {
  const colors = useColors();
  const { width } = Dimensions.get("window");
  const isMobile = width < 640;
  const toothWidth = width / ZIGZAG_COUNT;

  const styles = React.useMemo(() => StyleSheet.create({
    wrap: {
      paddingHorizontal: isMobile ? 14 : 20,
      paddingTop: isMobile ? 10 : 14,
      paddingBottom: isMobile ? 18 : 20,
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
    zigzagRow: {
      flexDirection: "row",
      height: 8,
      overflow: "hidden",
    },
    tooth: {
      width: 0,
      height: 0,
      borderLeftWidth: toothWidth / 2,
      borderRightWidth: toothWidth / 2,
      borderTopWidth: 8,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: colors.bg,
    },
    zigzagBg: {
      backgroundColor: colors.background,
    },
  }), [colors, isMobile, toothWidth]);

  return (
    <View>
      <View style={styles.wrap}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {/* Torn/ripped paper edge */}
      <View style={[styles.zigzagRow, styles.zigzagBg]}>
        {Array.from({ length: ZIGZAG_COUNT }).map((_, i) => (
          <View key={i} style={styles.tooth} />
        ))}
      </View>
    </View>
  );
};

export default ScreenHeader;
