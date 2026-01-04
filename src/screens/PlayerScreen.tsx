import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { colors, spacing, typography, shadows } from '../constants/theme';
import { formatMilliseconds, getImageUrl, sanitizeTitle } from '../utils/helpers';
import { downloadService } from '../services/download';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width - spacing.xl * 2;

export default function PlayerScreen() {
  const navigation = useNavigation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const {
    currentSong,
    isPlaying,
    position,
    duration,
    repeatMode,
    isShuffled,
    volume,
    togglePlayPause,
    seekTo,
    playNext,
    playPrevious,
    setRepeatMode,
    toggleShuffle,
    setVolume,
  } = usePlayerStore();

  useEffect(() => {
    const checkDownload = async () => {
      if (currentSong) {
        const downloaded = await downloadService.isDownloaded(currentSong.id);
        setIsDownloaded(downloaded);
      } else {
        setIsDownloaded(false);
      }
    };

    checkDownload();
  }, [currentSong]);

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No song playing</Text>
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = getImageUrl(currentSong.image, '500x500');

  const handleDownload = async () => {
    if (isDownloaded || isDownloading) return;

    try {
      setIsDownloading(true);
      await downloadService.downloadSong(currentSong, '320kbps');
      setIsDownloaded(true);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRepeatPress = () => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return 'repeat-outline';
      case 'all':
        return 'repeat';
      default:
        return 'repeat-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-down" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
            <Ionicons
              name={isDownloaded ? 'checkmark-circle' : isDownloading ? 'cloud-download-outline' : 'download-outline'}
              size={24}
              color={isDownloaded ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Album Art */}
        <View style={styles.artworkContainer}>
          <View style={styles.artworkWrapper}>
            <Image source={{ uri: imageUrl }} style={styles.artwork} />
          </View>
        </View>

        {/* Song Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.songTitle} numberOfLines={2}>
            {sanitizeTitle(currentSong.name)}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {currentSong.primaryArtists}
          </Text>
          <Text style={styles.albumName} numberOfLines={1}>
            {sanitizeTitle(currentSong.album.name)} • {currentSong.year}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={seekTo}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatMilliseconds(position)}</Text>
            <Text style={styles.timeText}>{formatMilliseconds(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={toggleShuffle} style={styles.controlButton}>
            <Ionicons
              name="shuffle"
              size={24}
              color={isShuffled ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={playPrevious} style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={32} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={playNext} style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={32} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRepeatPress} style={styles.controlButton}>
            <Ionicons
              name={getRepeatIcon()}
              size={24}
              color={repeatMode !== 'off' ? colors.primary : colors.textSecondary}
            />
            {repeatMode === 'one' && (
              <View style={styles.repeatBadge}>
                <Text style={styles.repeatBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Volume Control */}
        <View style={styles.volumeContainer}>
          <Ionicons name="volume-low" size={20} color={colors.textSecondary} />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={setVolume}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <Ionicons name="volume-high" size={20} color={colors.textSecondary} />
        </View>

        {/* Queue Button */}
        <TouchableOpacity
          style={styles.queueButton}
          onPress={() => navigation.navigate('Queue' as never)}
        >
          <Ionicons name="list" size={20} color={colors.text} />
          <Text style={styles.queueButtonText}>View Queue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  downloadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  artworkContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  artworkWrapper: {
    borderRadius: 12,
    backgroundColor: colors.card,
    ...shadows.large,
  },
  artwork: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  infoContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  songTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  artistName: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  albumName: {
    ...typography.caption,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    ...typography.caption,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    ...shadows.medium,
  },
  repeatBadge: {
    position: 'absolute',
    top: 4,
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  queueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  queueButtonText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.h3,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
});
