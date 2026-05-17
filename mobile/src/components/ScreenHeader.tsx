import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

const ScreenHeader = ({ eyebrow, title, subtitle }: ScreenHeaderProps) => {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  eyebrow: {
    fontSize: 10,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "900",
  },
  title: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
});

export default ScreenHeader;
