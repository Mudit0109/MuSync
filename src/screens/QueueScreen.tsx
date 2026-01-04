import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { colors, spacing, typography } from '../constants/theme';
import { formatDuration, getImageUrl, sanitizeTitle } from '../utils/helpers';
import type { QueueItem } from '../types';

export default function QueueScreen() {
  const navigation = useNavigation();
  const { queue, currentIndex, currentSong, removeFromQueue, reorderQueue, clearQueue, playSong } =
    usePlayerStore();

  const handleClearQueue = () => {
    Alert.alert('Clear Queue', 'Are you sure you want to clear the entire queue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: clearQueue,
      },
    ]);
  };

  const handleRemoveSong = (queueId: string) => {
    removeFromQueue(queueId);
  };

  const handlePlaySong = (song: QueueItem, index: number) => {
    playSong(song, queue, index);
  };

  const renderQueueItem = ({ item, index }: { item: QueueItem; index: number }) => {
    const isCurrentSong = currentSong?.id === item.id;
    const imageUrl = getImageUrl(item.image, '150x150');
    const canMoveUp = index > 0;
    const canMoveDown = index < queue.length - 1;

    const handleMoveUp = () => {
      if (canMoveUp) {
        reorderQueue(index, index - 1);
      }
    };

    const handleMoveDown = () => {
      if (canMoveDown) {
        reorderQueue(index, index + 1);
      }
    };

    return (
      <View style={styles.queueItemContainer}>
        <TouchableOpacity
          style={[styles.queueItem, isCurrentSong && styles.queueItemActive]}
          onPress={() => handlePlaySong(item, index)}
          activeOpacity={0.7}
        >
          <View style={styles.leftContent}>
            {isCurrentSong ? (
              <View style={styles.currentIndicator}>
                <Ionicons name="play" size={16} color={colors.primary} />
              </View>
            ) : (
              <Text style={styles.queueNumber}>{index + 1}</Text>
            )}

            <Image source={{ uri: imageUrl }} style={styles.thumbnail} />

            <View style={styles.songInfo}>
              <Text style={[styles.songTitle, isCurrentSong && styles.activeText]} numberOfLines={1}>
                {sanitizeTitle(item.name)}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {item.primaryArtists}
              </Text>
            </View>
          </View>

          <View style={styles.rightContent}>
            <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.queueActions}>
          <TouchableOpacity
            style={[styles.actionButton, !canMoveUp && styles.actionButtonDisabled]}
            onPress={handleMoveUp}
            disabled={!canMoveUp}
          >
            <Ionicons name="chevron-up" size={18} color={canMoveUp ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, !canMoveDown && styles.actionButtonDisabled]}
            onPress={handleMoveDown}
            disabled={!canMoveDown}
          >
            <Ionicons name="chevron-down" size={18} color={canMoveDown ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveSong(item.queueId)}
          >
            <Ionicons name="close-circle" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyQueue = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Queue is empty</Text>
      <Text style={styles.emptySubtitle}>Add songs to start listening</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Queue</Text>
        <TouchableOpacity
          onPress={handleClearQueue}
          style={styles.clearButton}
          disabled={queue.length === 0}
        >
          <Text style={[styles.clearText, queue.length === 0 && styles.clearTextDisabled]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {queue.length > 0 && (
        <View style={styles.queueInfo}>
          <Text style={styles.queueInfoText}>
            {queue.length} {queue.length === 1 ? 'song' : 'songs'} in queue
          </Text>
        </View>
      )}

      <FlatList
        data={queue}
        renderItem={renderQueueItem}
        keyExtractor={(item) => item.queueId}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyQueue}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...typography.h3,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearText: {
    ...typography.body,
    color: colors.primary,
  },
  clearTextDisabled: {
    color: colors.textSecondary,
  },
  queueInfo: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  queueInfoText: {
    ...typography.caption,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  queueItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  queueItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  queueItemActive: {
    backgroundColor: colors.surface,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  queueNumber: {
    ...typography.caption,
    width: 24,
    textAlign: 'center',
    marginRight: spacing.sm,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: colors.surface,
    marginRight: spacing.md,
  },
  songInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  songTitle: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 4,
  },
  activeText: {
    color: colors.primary,
  },
  artistName: {
    ...typography.caption,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  duration: {
    ...typography.caption,
  },
  removeButton: {
    padding: spacing.sm,
  },
  queueActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.caption,
  },
});
