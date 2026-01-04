import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import { colors, spacing, typography, shadows } from '../constants/theme';
import { getImageUrl, sanitizeTitle } from '../utils/helpers';

const MINI_PLAYER_HEIGHT = 60;

export default function MiniPlayer() {
  const navigation = useNavigation();
  const { currentSong, isPlaying, togglePlayPause, playNext, position, duration } = usePlayerStore();

  if (!currentSong) {
    return null;
  }

  const imageUrl = getImageUrl(currentSong.image, '150x150');
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player' as never)}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />

        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {sanitizeTitle(currentSong.name)}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {currentSong.primaryArtists}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            style={styles.controlButton}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              playNext();
            }}
            style={styles.controlButton}
          >
            <Ionicons name="play-skip-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

export { MINI_PLAYER_HEIGHT };

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MINI_PLAYER_HEIGHT,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.medium,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginRight: spacing.md,
  },
  songInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  songTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  artistName: {
    ...typography.caption,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 3,
    backgroundColor: colors.surface,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});
