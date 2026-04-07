import { SOFT_BADGE_BG, SOFT_BADGE_BORDER, SOFT_BADGE_TEXT } from '@/constants/ui';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

const TILE_BG = 'rgba(12,38,62,0.78)';
const TILE_BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(255,255,255,0.88)';
const Watermark = require('../assets/images/maly_aniol.png');

type MenuSquareTileProps = {
  title: string;
  subtitle?: string;
  accent: string;
  glow: string;
  openedToday?: boolean;
  onPress: () => void;
  disabled?: boolean;
  badgeCount?: number;
  titleLines?: number;
  subtitleLines?: number;
  wide?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function MenuSquareTile({
  title,
  subtitle,
  accent,
  glow,
  openedToday = false,
  onPress,
  disabled = false,
  badgeCount,
  titleLines = 2,
  subtitleLines = 2,
  wide = false,
  style,
}: MenuSquareTileProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.squareTile,
        wide && styles.squareTileWide,
        { borderColor: accent },
        openedToday && styles.squareTileOpened,
        openedToday && { backgroundColor: glow },
        pressed && styles.tilePressed,
        style,
      ]}
    >
      <View style={[styles.tileGlow, { backgroundColor: glow }]} />
      <Image source={Watermark} resizeMode="contain" style={styles.tileWatermark} />
      {typeof badgeCount === 'number' && badgeCount > 0 ? (
        <View style={styles.tileBadge}>
          <Text style={styles.tileBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      ) : null}
      <View style={styles.tileContent}>
        <View style={[styles.tileAccent, { backgroundColor: accent }]} />
        <Text style={styles.squareTitle} numberOfLines={titleLines} ellipsizeMode="tail">
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.squareSubtitle} numberOfLines={subtitleLines} ellipsizeMode="tail">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  squareTile: {
    width: '48.5%',
    minHeight: 126,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 11,
    backgroundColor: TILE_BG,
    borderWidth: 1.5,
    borderColor: TILE_BORDER,
    overflow: 'hidden',
    position: 'relative',
  },
  squareTileWide: {
    width: '100%',
    minHeight: 144,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  squareTileOpened: {
    borderColor: 'rgba(222,244,255,0.98)',
    borderWidth: 2,
  },
  tilePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
  tileGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    right: -40,
    top: -28,
    opacity: 0.5,
  },
  tileWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 120,
    height: 120,
    opacity: 0.12,
    tintColor: 'white',
    transform: [{ rotate: '15deg' }],
  },
  tileBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: SOFT_BADGE_BG,
    borderWidth: 1.5,
    borderColor: SOFT_BADGE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  tileBadgeText: {
    color: SOFT_BADGE_TEXT,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '800',
  },
  tileAccent: {
    width: 34,
    height: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  tileContent: {
    zIndex: 2,
    flex: 1,
    justifyContent: 'space-between',
  },
  squareTitle: {
    color: 'white',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
  },
  squareSubtitle: {
    marginTop: 4,
    color: SUB,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
  },
});
